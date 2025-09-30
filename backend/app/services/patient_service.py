"""
Patient service implementation.
Handles patient CRUD operations with encryption and search functionality.
"""

from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from fastapi import HTTPException, status, Depends
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timezone

from app.core.database import get_db
from app.models.patient import Patient, Gender, BloodGroup
from app.schemas.patient import PatientCreate, PatientUpdate, PatientSearch
from app.core.audit import audit_logger, AuditEventType, log_patient_access
from app.core.encryption import create_patient_id


class PatientService:
    """Service for handling patient operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def create_patient(
        self,
        patient_data: PatientCreate,
        created_by_user_id: str,
        ip_address: str
    ) -> Patient:
        """
        Create a new patient with encrypted demographics.
        """
        # Check for potential duplicates based on encrypted hashes
        if patient_data.email:
            email_hash = Patient.search_by_email(patient_data.email)
            existing_patient = self.db.query(Patient).filter(
                Patient.email_hash == email_hash
            ).first()
            
            if existing_patient:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A patient with this email already exists"
                )
        
        if patient_data.phone_primary:
            phone_hash = Patient.search_by_phone(patient_data.phone_primary)
            existing_patient = self.db.query(Patient).filter(
                Patient.phone_hash == phone_hash
            ).first()
            
            if existing_patient:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A patient with this phone number already exists"
                )
        
        # Create patient
        db_patient = Patient(
            patient_id=create_patient_id(),
            first_name=patient_data.first_name,
            last_name=patient_data.last_name,
            date_of_birth=patient_data.date_of_birth.isoformat(),
            gender=patient_data.gender.value,
            phone_primary=patient_data.phone_primary,
            phone_secondary=patient_data.phone_secondary,
            email=patient_data.email,
            address_line1=patient_data.address_line1,
            address_line2=patient_data.address_line2,
            city=patient_data.city,
            state=patient_data.state,
            postal_code=patient_data.postal_code,
            country=patient_data.country,
            emergency_contact_name=patient_data.emergency_contact_name,
            emergency_contact_phone=patient_data.emergency_contact_phone,
            emergency_contact_relationship=patient_data.emergency_contact_relationship,
            blood_group=patient_data.blood_group.value if patient_data.blood_group else None,
            allergies=patient_data.allergies,
            medical_history=patient_data.medical_history,
            current_medications=patient_data.current_medications,
            insurance_provider=patient_data.insurance_provider,
            insurance_policy_number=patient_data.insurance_policy_number,
            insurance_group_number=patient_data.insurance_group_number,
            occupation=patient_data.occupation,
            marital_status=patient_data.marital_status,
            preferred_language=patient_data.preferred_language,
            created_by=created_by_user_id,
            notes=patient_data.notes,
            tags=patient_data.tags
        )
        
        self.db.add(db_patient)
        self.db.commit()
        self.db.refresh(db_patient)
        
        # Log patient creation
        await audit_logger.log_event(
            event_type=AuditEventType.PATIENT_CREATED,
            user_id=created_by_user_id,
            resource_type="patient",
            resource_id=db_patient.id,
            ip_address=ip_address,
            contains_phi="true",
            details={
                "patient_id": db_patient.patient_id,
                "action": "patient_created"
            }
        )
        
        return db_patient
    
    async def get_patient_by_id(
        self,
        patient_id: str,
        user_id: str,
        ip_address: str
    ) -> Patient:
        """
        Get patient by ID with access logging.
        """
        patient = self.db.query(Patient).filter(Patient.id == patient_id).first()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Log patient access
        await audit_logger.log_event(
            event_type=AuditEventType.PATIENT_VIEWED,
            user_id=user_id,
            resource_type="patient",
            resource_id=patient.id,
            ip_address=ip_address,
            contains_phi="true",
            details={
                "patient_id": patient.patient_id,
                "action": "patient_viewed"
            }
        )
        
        return patient
    
    async def get_patient_by_patient_id(
        self,
        patient_id: str,
        user_id: str,
        ip_address: str
    ) -> Patient:
        """
        Get patient by patient_id (the human-readable identifier).
        """
        patient = self.db.query(Patient).filter(Patient.patient_id == patient_id).first()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Log patient access
        await audit_logger.log_event(
            event_type=AuditEventType.PATIENT_VIEWED,
            user_id=user_id,
            resource_type="patient",
            resource_id=patient.id,
            ip_address=ip_address,
            contains_phi="true",
            details={
                "patient_id": patient.patient_id,
                "action": "patient_viewed_by_patient_id"
            }
        )
        
        return patient
    
    async def update_patient(
        self,
        patient_id: str,
        patient_data: PatientUpdate,
        user_id: str,
        ip_address: str
    ) -> Patient:
        """
        Update patient information with audit logging.
        """
        patient = self.db.query(Patient).filter(Patient.id == patient_id).first()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Store original values for audit
        original_values = {
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "phone_primary": patient.phone_primary,
            "email": patient.email,
            "address_line1": patient.address_line1
        }
        
        # Update patient fields
        update_data = patient_data.dict(exclude_unset=True)
        updated_fields = []
        
        for field, value in update_data.items():
            if hasattr(patient, field) and value is not None:
                # Handle date fields
                if field == "date_of_birth" and hasattr(value, 'isoformat'):
                    value = value.isoformat()
                elif field in ["gender", "blood_group"] and hasattr(value, 'value'):
                    value = value.value
                
                setattr(patient, field, value)
                updated_fields.append(field)
        
        # Update search hashes if necessary
        patient._update_search_hashes()
        patient.updated_at = datetime.now(timezone.utc)
        
        self.db.commit()
        self.db.refresh(patient)
        
        # Prepare new values for audit
        new_values = {
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "phone_primary": patient.phone_primary,
            "email": patient.email,
            "address_line1": patient.address_line1
        }
        
        # Log patient update
        await audit_logger.log_event(
            event_type=AuditEventType.PATIENT_UPDATED,
            user_id=user_id,
            resource_type="patient",
            resource_id=patient.id,
            ip_address=ip_address,
            contains_phi="true",
            before_values=original_values,
            after_values=new_values,
            details={
                "patient_id": patient.patient_id,
                "action": "patient_updated",
                "fields_updated": updated_fields
            }
        )
        
        return patient
    
    async def search_patients(
        self,
        search_params: PatientSearch,
        user_id: str,
        ip_address: str
    ) -> Tuple[List[Patient], int]:
        """
        Search patients using encrypted search hashes.
        """
        query = self.db.query(Patient)
        
        # Apply search filters
        if search_params.query:
            if search_params.search_type == "name":
                name_hash = Patient.search_by_name(search_params.query)
                query = query.filter(Patient.name_hash == name_hash)
            elif search_params.search_type == "phone":
                phone_hash = Patient.search_by_phone(search_params.query)
                query = query.filter(Patient.phone_hash == phone_hash)
            elif search_params.search_type == "email":
                email_hash = Patient.search_by_email(search_params.query)
                query = query.filter(Patient.email_hash == email_hash)
        
        # Apply additional filters
        if search_params.created_by:
            query = query.filter(Patient.created_by == search_params.created_by)
        
        if search_params.gender:
            query = query.filter(Patient.gender == search_params.gender.value)
        
        if search_params.blood_group:
            query = query.filter(Patient.blood_group == search_params.blood_group.value)
        
        # Apply date range filters
        if search_params.created_after:
            query = query.filter(Patient.created_at >= search_params.created_after)
        
        if search_params.created_before:
            query = query.filter(Patient.created_at <= search_params.created_before)
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply pagination and ordering
        patients = query.order_by(Patient.updated_at.desc()).offset(search_params.offset).limit(search_params.limit).all()
        
        # Log search activity
        await audit_logger.log_event(
            event_type=AuditEventType.PATIENT_SEARCHED,
            user_id=user_id,
            resource_type="patient",
            ip_address=ip_address,
            contains_phi="true",
            details={
                "search_type": search_params.search_type,
                "query_length": len(search_params.query) if search_params.query else 0,
                "filters_applied": {
                    "created_by": search_params.created_by,
                    "gender": search_params.gender.value if search_params.gender else None,
                    "blood_group": search_params.blood_group.value if search_params.blood_group else None
                },
                "results_count": len(patients),
                "total_matches": total_count
            }
        )
        
        return patients, total_count
    
    async def list_patients(
        self,
        limit: int,
        offset: int,
        created_by: Optional[str],
        user_id: str,
        ip_address: str
    ) -> Tuple[List[Patient], int]:
        """
        List patients with pagination and optional filtering.
        """
        query = self.db.query(Patient)
        
        # Apply filters
        if created_by:
            query = query.filter(Patient.created_by == created_by)
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination and ordering
        patients = query.order_by(Patient.updated_at.desc()).offset(offset).limit(limit).all()
        
        # Log patient list access
        await audit_logger.log_event(
            event_type=AuditEventType.PATIENT_VIEWED,
            user_id=user_id,
            resource_type="patient",
            ip_address=ip_address,
            details={
                "action": "patient_list",
                "filters": {"created_by": created_by},
                "limit": limit,
                "offset": offset,
                "results_count": len(patients),
                "total_count": total_count
            }
        )
        
        return patients, total_count
    
    async def get_patient_history(
        self,
        patient_id: str,
        user_id: str,
        ip_address: str,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Get comprehensive patient history including sessions, reports, and bills.
        """
        patient = await self.get_patient_by_id(patient_id, user_id, ip_address)
        
        # Get consultation sessions (placeholder - will implement with session models)
        consultation_sessions = []
        reports = []
        bills = []
        
        # Log history access
        await audit_logger.log_event(
            event_type=AuditEventType.PATIENT_VIEWED,
            user_id=user_id,
            resource_type="patient",
            resource_id=patient.id,
            ip_address=ip_address,
            contains_phi="true",
            details={
                "patient_id": patient.patient_id,
                "action": "patient_history_viewed",
                "history_limit": limit
            }
        )
        
        return {
            "patient": patient,
            "consultation_sessions": consultation_sessions,
            "reports": reports,
            "bills": bills,
            "total_sessions": len(consultation_sessions)
        }
    
    async def delete_patient(
        self,
        patient_id: str,
        user_id: str,
        ip_address: str,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Soft delete patient (admin only operation).
        """
        patient = self.db.query(Patient).filter(Patient.id == patient_id).first()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Store patient info for audit before deletion
        patient_info = {
            "patient_id": patient.patient_id,
            "name": patient.full_name,
            "created_by": patient.created_by
        }
        
        # For now, we'll implement hard delete. In production, consider soft delete
        self.db.delete(patient)
        self.db.commit()
        
        # Log patient deletion
        await audit_logger.log_event(
            event_type=AuditEventType.PATIENT_DELETED,
            user_id=user_id,
            resource_type="patient",
            resource_id=patient_id,
            ip_address=ip_address,
            contains_phi="true",
            details={
                "action": "patient_deleted",
                "reason": reason,
                "deleted_patient": patient_info
            }
        )
        
        return {
            "message": "Patient deleted successfully",
            "patient_id": patient_info["patient_id"],
            "deleted_at": datetime.now(timezone.utc).isoformat()
        }


def get_patient_service(db: Session = Depends(get_db)) -> PatientService:
    """Dependency to get patient service."""
    return PatientService(db)
