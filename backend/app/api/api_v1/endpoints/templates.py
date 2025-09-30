"""
Report template API endpoints.
Handles template creation, management, and sharing.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_doctor_or_admin, PaginationParams
from app.models.user import User
from app.schemas.report import (
    ReportTemplateCreate,
    ReportTemplateRead,
    ReportTemplateUpdate,
    TemplateSummaryResponse
)
from app.services.report_service import ReportService

router = APIRouter()


@router.post("/", response_model=ReportTemplateRead, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: ReportTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    Create a new report template.
    
    - Allows doctors to create custom report structures
    - Defines AI prompt templates
    - Can be set as default or public
    
    **Requires:** Doctor or Admin role
    """
    template = ReportService.create_template(
        db=db,
        doctor_id=current_user.id,
        template_name=template_data.template_name,
        template_description=template_data.template_description,
        template_structure=template_data.template_structure,
        ai_prompt_template=template_data.ai_prompt_template,
        report_type=template_data.report_type,
        is_default=template_data.is_default,
        is_active=template_data.is_active,
        is_public=template_data.is_public,
        prompt_variables=template_data.prompt_variables
    )
    
    return template


@router.get("/", response_model=List[TemplateSummaryResponse])
async def list_templates(
    pagination: PaginationParams = Depends(),
    is_active: Optional[bool] = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    List all report templates for current doctor.
    
    - Returns templates in reverse chronological order
    - Default templates listed first
    - Supports pagination
    
    **Requires:** Doctor or Admin role
    """
    templates = ReportService.list_templates_by_doctor(
        db=db,
        doctor_id=current_user.id,
        skip=pagination.skip,
        limit=pagination.limit,
        is_active=is_active
    )
    
    return templates


@router.get("/{template_id}", response_model=ReportTemplateRead)
async def get_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    Get template details.
    
    - Returns full template including structure and AI prompt
    
    **Requires:** Doctor or Admin role
    **Access Control:** Own templates or public templates
    """
    template = ReportService.get_template_by_id(
        db=db,
        template_id=template_id,
        doctor_id=current_user.id
    )
    
    return template


@router.put("/{template_id}", response_model=ReportTemplateRead)
async def update_template(
    template_id: str,
    template_data: ReportTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    Update report template.
    
    - Supports partial updates
    - Creates new version if significant changes
    
    **Requires:** Doctor or Admin role
    **Access Control:** Only template owner can update
    """
    template = ReportService.get_template_by_id(
        db=db,
        template_id=template_id,
        doctor_id=current_user.id
    )
    
    # Ensure user owns the template
    if template.doctor_id != current_user.id:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("You can only update your own templates")
    
    # Update fields
    update_dict = template_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(template, field, value)
    
    db.commit()
    db.refresh(template)
    
    return template


@router.post("/{template_id}/set-default")
async def set_default_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    Set a template as the default for current doctor.
    
    - Removes default flag from other templates
    - Sets this template as default
    
    **Requires:** Doctor or Admin role
    **Access Control:** Only template owner
    """
    template = ReportService.set_default_template(
        db=db,
        template_id=template_id,
        doctor_id=current_user.id
    )
    
    return {
        "message": "Template set as default successfully",
        "template_id": template.id,
        "template_name": template.template_name
    }


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    Delete (deactivate) a report template.
    
    - Sets is_active to False
    - Template data is preserved for existing reports
    
    **Requires:** Doctor or Admin role
    **Access Control:** Only template owner
    """
    template = ReportService.get_template_by_id(
        db=db,
        template_id=template_id,
        doctor_id=current_user.id
    )
    
    # Ensure user owns the template
    if template.doctor_id != current_user.id:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("You can only delete your own templates")
    
    template.is_active = False
    db.commit()
    
    return None
