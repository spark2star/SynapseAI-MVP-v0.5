"""
Patient intake endpoints for the new mental health-focused patient registration.
Implements the two-stage intake process with symptoms management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from typing import Annotated, Dict, Any, Optional, List
from datetime import datetime, timezone
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.security import get_current_user_id, require_any_role
from app.models.symptom import (
    IntakePatient, MasterSymptom, UserSymptom, PatientSymptom,
    SymptomSeverity, SymptomFrequency, DurationUnit
)

router = APIRouter()


# Pydantic schemas for request/response
class InformantSelection(BaseModel):
    selection: List[str] = Field(..., description="List of informants: Self, Parent, Spouse, Child, Other")
    other_details: Optional[str] = Field(None, description="Details if Other is selected")


class IllnessDuration(BaseModel):
    value: int = Field(..., gt=0, description="Duration value")
    unit: str = Field(..., regex="^(Weeks|Months)$", description="Duration unit")


class PrecipitatingFactor(BaseModel):
    narrative: Optional[str] = Field(None, description="Narrative description")
    tags: Optional[List[str]] = Field(default_factory=list, description="Structured tags")


class IntakePatientCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200, description="Patient full name")
    age: int = Field(..., ge=1, le=150, description="Patient age")
    sex: str = Field(..., regex="^(Male|Female|Other)$", description="Patient sex")
    address: Optional[str] = Field(None, max_length=500, description="Patient address")
    informants: InformantSelection = Field(..., description="Information sources")
    illness_duration: IllnessDuration = Field(..., description="Duration of current illness")
    referred_by: Optional[str] = Field(None, max_length=200, description="Referring doctor/source")
    precipitating_factor: Optional[PrecipitatingFactor] = Field(None, description="Precipitating factors")


class SymptomDuration(BaseModel):
    value: int = Field(..., gt=0, description="Duration value")
    unit: str = Field(..., regex="^(Days|Weeks|Months)$", description="Duration unit")


class PatientSymptomCreate(BaseModel):
    symptom_id: str = Field(..., description="ID of the symptom (master or user)")
    symptom_source: str = Field(..., regex="^(master|user)$", description="Source of symptom")
    severity: str = Field(..., regex="^(Mild|Moderate|Severe)$", description="Symptom severity")
    frequency: str = Field(..., regex="^(Hourly|Daily|Weekly|Constant)$", description="Symptom frequency")
    duration: SymptomDuration = Field(..., description="Symptom duration")
    notes: Optional[str] = Field(None, max_length=1000, description="Additional notes")
    triggers: Optional[List[str]] = Field(default_factory=list, description="Symptom triggers")


class UserSymptomCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200, description="Symptom name")
    description: Optional[str] = Field(None, max_length=1000, description="Symptom description")
    categories: List[str] = Field(..., min_items=1, description="ICD-11 category codes")


@router.post("/patients", response_model=Dict[str, Any])
async def create_intake_patient(
    patient_data: IntakePatientCreate,
    request: Request,
    db: Session = Depends(get_db)
    current_user_id: str = Depends(get_current_user_id)
    _: Dict[str, Any] = Depends(require_any_role(["admin", "doctor", "receptionist"]))
):
    """
    Create a new intake patient record (Stage 1).
    Returns patient ID for use in Stage 2 symptom input.
    """
    try:
        # Create intake patient
        intake_patient = IntakePatient(
            name=patient_data.name,
            age=patient_data.age,
            sex=patient_data.sex,
            address=patient_data.address,
            informants={
                "selection": patient_data.informants.selection,
                "other_details": patient_data.informants.other_details
            },
            illness_duration_value=patient_data.illness_duration.value,
            illness_duration_unit=patient_data.illness_duration.unit,
            referred_by=patient_data.referred_by,
            precipitating_factor_narrative=patient_data.precipitating_factor.narrative if patient_data.precipitating_factor else None,
            precipitating_factor_tags=patient_data.precipitating_factor.tags if patient_data.precipitating_factor else [],
            doctor_id=current_user_id
        )
        
        db.add(intake_patient)
        db.commit()
        db.refresh(intake_patient)
        
        return {
            "status": "success",
            "data": {
                "patient_id": intake_patient.id,
                "name": intake_patient.name,
                "message": "Patient intake record created successfully"
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "stage": "1_completed"
            }
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create patient intake: {str(e)}"
        )


@router.get("/symptoms", response_model=Dict[str, Any])
async def search_symptoms(
    q: str = Query(..., min_length=2, description="Search query for symptoms"),
    limit: int = Query(20, ge=1, le=50, description="Maximum results to return"),
    db: Session = Depends(get_db)
    current_user_id: str = Depends(get_current_user_id)
    _: Dict[str, Any] = Depends(require_any_role(["admin", "doctor", "receptionist"]))
):
    """
    Search for symptoms in both master and user-defined collections.
    Returns symptoms matching the search query.
    """
    try:
        search_term = f"%{q.lower()}%"
        
        # Search master symptoms
        master_symptoms = db.query(MasterSymptom).filter(
            MasterSymptom.name.ilike(search_term),
            MasterSymptom.is_active == 1
        ).limit(limit // 2).all()
        
        # Search user symptoms for current doctor
        user_symptoms = db.query(UserSymptom).filter(
            UserSymptom.name.ilike(search_term),
            UserSymptom.doctor_id == current_user_id
        ).limit(limit // 2).all()
        
        # Format results
        results = []
        
        for symptom in master_symptoms:
            results.append({
                "id": symptom.id,
                "name": symptom.name,
                "description": symptom.description,
                "categories": symptom.categories,
                "source": "master",
                "aliases": symptom.aliases or []
            })
        
        for symptom in user_symptoms:
            results.append({
                "id": symptom.id,
                "name": symptom.name,
                "description": symptom.description,
                "categories": symptom.categories,
                "source": "user", 
                "aliases": symptom.aliases or []
            })
        
        return {
            "status": "success",
            "data": {
                "symptoms": results[:limit],
                "total_found": len(results),
                "search_query": q,
                "master_count": len(master_symptoms),
                "user_count": len(user_symptoms)
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Symptom search failed: {str(e)}"
        )


@router.post("/user_symptoms", response_model=Dict[str, Any])
async def create_user_symptom(
    symptom_data: UserSymptomCreate,
    request: Request,
    db: Session = Depends(get_db)
    current_user_id: str = Depends(get_current_user_id)
    _: Dict[str, Any] = Depends(require_any_role(["admin", "doctor"]))
):
    """
    Create a new custom symptom for the current doctor.
    The symptom will be available for use in patient intakes.
    """
    try:
        # Check if symptom name already exists for this doctor
        existing = db.query(UserSymptom).filter(
            UserSymptom.doctor_id == current_user_id,
            UserSymptom.name.ilike(symptom_data.name.strip())
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have a symptom with this name"
            )
        
        # Create user symptom
        user_symptom = UserSymptom(
            doctor_id=current_user_id,
            name=symptom_data.name.strip(),
            description=symptom_data.description,
            categories=symptom_data.categories
        )
        
        db.add(user_symptom)
        db.commit()
        db.refresh(user_symptom)
        
        return {
            "status": "success",
            "data": {
                "symptom_id": user_symptom.id,
                "name": user_symptom.name,
                "categories": user_symptom.categories,
                "source": "user",
                "message": "Custom symptom created successfully"
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
        
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create custom symptom: {str(e)}"
        )


@router.post("/patients/{patient_id}/symptoms", response_model=Dict[str, Any])
async def add_patient_symptoms(
    patient_id: str,
    symptoms_data: List[PatientSymptomCreate],
    request: Request,
    db: Session = Depends(get_db)
    current_user_id: str = Depends(get_current_user_id)
    _: Dict[str, Any] = Depends(require_any_role(["admin", "doctor", "receptionist"]))
):
    """
    Add symptoms to a patient (Stage 2).
    Links symptoms to the patient with contextual information.
    """
    try:
        # Verify patient exists and belongs to current doctor
        intake_patient = db.query(IntakePatient).filter(
            IntakePatient.id == patient_id,
            IntakePatient.doctor_id == current_user_id
        ).first()
        
        if not intake_patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found or access denied"
            )
        
        created_symptoms = []
        
        for symptom_data in symptoms_data:
            # Get symptom name for denormalization
            if symptom_data.symptom_source == "master":
                symptom = db.query(MasterSymptom).filter(
                    MasterSymptom.id == symptom_data.symptom_id,
                    MasterSymptom.is_active == 1
                ).first()
            else:  # user symptom
                symptom = db.query(UserSymptom).filter(
                    UserSymptom.id == symptom_data.symptom_id,
                    UserSymptom.doctor_id == current_user_id
                ).first()
            
            if not symptom:
                continue  # Skip invalid symptoms
            
            # Create patient symptom association
            patient_symptom = PatientSymptom(
                patient_id=patient_id,
                symptom_id=symptom_data.symptom_id,
                symptom_source=symptom_data.symptom_source,
                symptom_name=symptom.name,
                severity=symptom_data.severity,
                frequency=symptom_data.frequency,
                duration_value=symptom_data.duration.value,
                duration_unit=symptom_data.duration.unit,
                notes=symptom_data.notes,
                triggers=symptom_data.triggers
            )
            
            db.add(patient_symptom)
            created_symptoms.append(patient_symptom)
        
        db.commit()
        
        # Refresh all created symptoms
        for symptom in created_symptoms:
            db.refresh(symptom)
        
        return {
            "status": "success",
            "data": {
                "patient_id": patient_id,
                "patient_name": intake_patient.name,
                "symptoms_added": len(created_symptoms),
                "symptoms": [symptom.to_dict() for symptom in created_symptoms],
                "message": "Patient symptoms added successfully"
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "stage": "2_completed"
            }
        }
        
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add patient symptoms: {str(e)}"
        )


@router.get("/patients/{patient_id}", response_model=Dict[str, Any])
async def get_intake_patient(
    patient_id: str,
    db: Session = Depends(get_db)
    current_user_id: str = Depends(get_current_user_id)
    _: Dict[str, Any] = Depends(require_any_role(["admin", "doctor", "receptionist"]))
):
    """
    Get complete intake patient information including symptoms.
    """
    try:
        # Get intake patient
        intake_patient = db.query(IntakePatient).filter(
            IntakePatient.id == patient_id,
            IntakePatient.doctor_id == current_user_id
        ).first()
        
        if not intake_patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found or access denied"
            )
        
        # Get patient symptoms
        patient_symptoms = db.query(PatientSymptom).filter(
            PatientSymptom.patient_id == patient_id
        ).all()
        
        return {
            "status": "success",
            "data": {
                "patient": intake_patient.to_dict(),
                "symptoms": [symptom.to_dict() for symptom in patient_symptoms],
                "total_symptoms": len(patient_symptoms)
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve patient: {str(e)}"
        )


@router.get("/patients", response_model=Dict[str, Any])
async def list_intake_patients(
    limit: int = Query(50, ge=1, le=100, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Results to skip"),
    db: Session = Depends(get_db)
    current_user_id: str = Depends(get_current_user_id)
    _: Dict[str, Any] = Depends(require_any_role(["admin", "doctor", "receptionist"]))
):
    """
    List intake patients for the current doctor with pagination.
    """
    try:
        # Get patients for current doctor
        query = db.query(IntakePatient).filter(
            IntakePatient.doctor_id == current_user_id
        ).order_by(IntakePatient.created_at.desc())
        
        total_count = query.count()
        patients = query.offset(offset).limit(limit).all()
        
        return {
            "status": "success",
            "data": {
                "patients": [patient.to_dict() for patient in patients],
                "total_count": total_count,
                "limit": limit,
                "offset": offset
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list patients: {str(e)}"
        )
