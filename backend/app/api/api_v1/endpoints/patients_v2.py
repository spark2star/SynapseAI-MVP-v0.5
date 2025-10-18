"""
Patient Management Endpoints V2
Implements two-stage patient registration with RBAC.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    require_doctor,
    require_receptionist,
    require_doctor_or_receptionist
)
from app.models.user import User, UserRole
from app.models.patient import Patient, ProfileStatus
from app.schemas.patient import (
    PatientDemographicsRequest,
    PatientClinicalInfoRequest,
    PatientDemographicsResponse,
    PatientCompleteResponse,
    PendingPatientResponse
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/demographics", response_model=PatientDemographicsResponse, status_code=status.HTTP_201_CREATED)
async def create_patient_demographics(
    request: PatientDemographicsRequest,
    current_user: User = Depends(require_doctor_or_receptionist),
    db: Session = Depends(get_db)
):
    """
    Stage 1: Create patient with demographics only.
    Accessible by both doctors and receptionists.
    
    Creates a patient record with profile_status='DEMOGRAPHICS_ONLY'.
    """
    try:
        # Create patient with demographics
        patient = Patient(
            first_name=request.first_name,
            last_name=request.last_name,
            date_of_birth=request.date_of_birth,
            gender=request.gender,
            phone_primary=request.phone_primary,
            phone_secondary=request.phone_secondary,
            email=request.email,
            address_line1=request.address_line1,
            address_line2=request.address_line2,
            city=request.city,
            state=request.state,
            postal_code=request.postal_code,
            country=request.country,
            emergency_contact_name=request.emergency_contact_name,
            emergency_contact_phone=request.emergency_contact_phone,
            emergency_contact_relationship=request.emergency_contact_relationship,
            insurance_provider=request.insurance_provider,
            insurance_policy_number=request.insurance_policy_number,
            insurance_group_number=request.insurance_group_number,
            occupation=request.occupation,
            marital_status=request.marital_status,
            preferred_language=request.preferred_language,
            created_by=current_user.id,
            profile_status=ProfileStatus.DEMOGRAPHICS_ONLY.value
        )
        
        db.add(patient)
        db.commit()
        db.refresh(patient)
        
        logger.info(
            f"Patient demographics created: {patient.id} by {current_user.role} {current_user.id}"
        )
        
        return PatientDemographicsResponse(
            id=str(patient.id),
            patient_id=patient.patient_id,
            first_name=patient.first_name,
            last_name=patient.last_name,
            full_name=patient.full_name,
            date_of_birth=patient.date_of_birth,
            age=patient.age,
            gender=patient.gender,
            phone_primary=patient.phone_primary,
            phone_secondary=patient.phone_secondary,
            email=patient.email,
            profile_status=patient.profile_status,
            created_at=patient.created_at,
            created_by=str(patient.created_by)
        )
    
    except Exception as e:
        logger.error(f"Error creating patient demographics: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create patient record"
        )


@router.put("/{patient_id}/clinical-info", response_model=PatientCompleteResponse)
async def complete_patient_clinical_info(
    patient_id: str,
    request: PatientClinicalInfoRequest,
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db)
):
    """
    Stage 2: Complete patient profile with clinical information.
    Only accessible by doctors.
    
    Updates patient record and changes profile_status to 'CLINICAL_INFO_COMPLETE'.
    """
    try:
        # Find patient
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Security: Verify doctor has access (same clinic)
        if current_user.role == UserRole.DOCTOR.value:
            # Check if patient was created by doctor or their receptionist
            creator = db.query(User).filter(User.id == patient.created_by).first()
            if creator:
                # Allow if created by this doctor or their receptionist
                if creator.id != current_user.id and creator.invited_by_id != current_user.id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You don't have access to this patient"
                    )
        
        # Update clinical information
        patient.blood_group = request.blood_group
        patient.allergies = request.allergies
        patient.medical_history = request.medical_history
        patient.current_medications = request.current_medications
        patient.notes = request.notes
        patient.tags = request.tags
        
        # Update profile status
        patient.profile_status = ProfileStatus.CLINICAL_INFO_COMPLETE.value
        
        db.commit()
        db.refresh(patient)
        
        logger.info(f"Patient clinical info completed: {patient.id} by doctor {current_user.id}")
        
        return PatientCompleteResponse(
            id=str(patient.id),
            patient_id=patient.patient_id,
            first_name=patient.first_name,
            last_name=patient.last_name,
            full_name=patient.full_name,
            date_of_birth=patient.date_of_birth,
            age=patient.age,
            gender=patient.gender,
            phone_primary=patient.phone_primary,
            phone_secondary=patient.phone_secondary,
            email=patient.email,
            address_line1=patient.address_line1,
            address_line2=patient.address_line2,
            city=patient.city,
            state=patient.state,
            postal_code=patient.postal_code,
            country=patient.country,
            emergency_contact_name=patient.emergency_contact_name,
            emergency_contact_phone=patient.emergency_contact_phone,
            emergency_contact_relationship=patient.emergency_contact_relationship,
            blood_group=patient.blood_group,
            allergies=patient.allergies,
            medical_history=patient.medical_history,
            current_medications=patient.current_medications,
            insurance_provider=patient.insurance_provider,
            insurance_policy_number=patient.insurance_policy_number,
            insurance_group_number=patient.insurance_group_number,
            profile_status=patient.profile_status,
            created_at=patient.created_at,
            updated_at=patient.updated_at,
            created_by=str(patient.created_by)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing patient clinical info: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update patient record"
        )


@router.get("/pending-clinical-review", response_model=List[PendingPatientResponse])
async def list_pending_patients(
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db)
):
    """
    List patients pending clinical review (demographics only).
    Only accessible by doctors.
    
    Returns patients with profile_status='DEMOGRAPHICS_ONLY' created by
    the doctor or their receptionists.
    """
    try:
        # Get all receptionists invited by this doctor
        receptionist_ids = db.query(User.id).filter(
            User.invited_by_id == current_user.id,
            User.role == UserRole.RECEPTIONIST.value
        ).all()
        receptionist_ids = [r[0] for r in receptionist_ids]
        
        # Include doctor's own ID
        creator_ids = [current_user.id] + receptionist_ids
        
        # Query patients with demographics only
        patients = db.query(Patient).filter(
            Patient.profile_status == ProfileStatus.DEMOGRAPHICS_ONLY.value,
            Patient.created_by.in_(creator_ids)
        ).order_by(Patient.created_at.desc()).all()
        
        # Build response with creator names
        result = []
        for patient in patients:
            creator = db.query(User).filter(User.id == patient.created_by).first()
            creator_name = None
            if creator and creator.profile:
                from app.core.encryption import decrypt_field
                creator_name = f"{decrypt_field(creator.profile.first_name)} {decrypt_field(creator.profile.last_name)}"
            
            result.append(PendingPatientResponse(
                id=str(patient.id),
                patient_id=patient.patient_id,
                full_name=patient.full_name,
                age=patient.age,
                gender=patient.gender,
                phone_primary=patient.phone_primary,
                created_at=patient.created_at,
                created_by_name=creator_name
            ))
        
        logger.info(f"Doctor {current_user.id} retrieved {len(result)} pending patients")
        
        return result
    
    except Exception as e:
        logger.error(f"Error listing pending patients: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve pending patients"
        )


@router.get("/{patient_id}/demographics", response_model=PatientDemographicsResponse)
async def get_patient_demographics(
    patient_id: str,
    current_user: User = Depends(require_doctor_or_receptionist),
    db: Session = Depends(get_db)
):
    """
    Get patient demographics (non-clinical data).
    Accessible by doctors and receptionists.
    """
    try:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Security check based on role
        if current_user.role == UserRole.RECEPTIONIST.value:
            # Receptionist can only see patients in their clinic
            creator = db.query(User).filter(User.id == patient.created_by).first()
            if creator and creator.invited_by_id != current_user.invited_by_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
        
        return PatientDemographicsResponse(
            id=str(patient.id),
            patient_id=patient.patient_id,
            first_name=patient.first_name,
            last_name=patient.last_name,
            full_name=patient.full_name,
            date_of_birth=patient.date_of_birth,
            age=patient.age,
            gender=patient.gender,
            phone_primary=patient.phone_primary,
            phone_secondary=patient.phone_secondary,
            email=patient.email,
            profile_status=patient.profile_status,
            created_at=patient.created_at,
            created_by=str(patient.created_by)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving patient demographics: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve patient"
        )


@router.get("/{patient_id}/complete", response_model=PatientCompleteResponse)
async def get_complete_patient(
    patient_id: str,
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db)
):
    """
    Get complete patient profile including clinical data.
    Only accessible by doctors.
    """
    try:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Security: Verify doctor has access
        creator = db.query(User).filter(User.id == patient.created_by).first()
        if creator:
            if creator.id != current_user.id and creator.invited_by_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
        
        return PatientCompleteResponse(
            id=str(patient.id),
            patient_id=patient.patient_id,
            first_name=patient.first_name,
            last_name=patient.last_name,
            full_name=patient.full_name,
            date_of_birth=patient.date_of_birth,
            age=patient.age,
            gender=patient.gender,
            phone_primary=patient.phone_primary,
            phone_secondary=patient.phone_secondary,
            email=patient.email,
            address_line1=patient.address_line1,
            address_line2=patient.address_line2,
            city=patient.city,
            state=patient.state,
            postal_code=patient.postal_code,
            country=patient.country,
            emergency_contact_name=patient.emergency_contact_name,
            emergency_contact_phone=patient.emergency_contact_phone,
            emergency_contact_relationship=patient.emergency_contact_relationship,
            blood_group=patient.blood_group,
            allergies=patient.allergies,
            medical_history=patient.medical_history,
            current_medications=patient.current_medications,
            insurance_provider=patient.insurance_provider,
            insurance_policy_number=patient.insurance_policy_number,
            insurance_group_number=patient.insurance_group_number,
            profile_status=patient.profile_status,
            created_at=patient.created_at,
            updated_at=patient.updated_at,
            created_by=str(patient.created_by)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving complete patient: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve patient"
        )
