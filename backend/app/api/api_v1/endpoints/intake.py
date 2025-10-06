"""
Patient intake endpoints for the new mental health-focused patient registration.
Implements the two-stage intake process with symptoms management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from typing import Annotated, Dict, Any, Optional, List
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import logging
from app.core.dependencies import get_current_user
from app.core.database import get_db
from app.core.security import get_current_user_id, require_any_role
from app.models.symptom import (
    IntakePatient, MasterSymptom, UserSymptom, PatientSymptom,
    SymptomSeverity, SymptomFrequency, DurationUnit
)

router = APIRouter()
logger = logging.getLogger(__name__)

# Pydantic schemas for request/response
class InformantSelection(BaseModel):
    selection: List[str] = Field(..., description="List of informants: Self, Parent, Spouse, Child, Other")
    other_details: Optional[str] = Field(None, description="Details if Other is selected")


class IllnessDuration(BaseModel):
    value: int = Field(..., gt=0, description="Duration value")
    unit: str = Field(..., pattern="^(Weeks|Months)$", description="Duration unit")


class PrecipitatingFactor(BaseModel):
    narrative: Optional[str] = Field(None, description="Narrative description")
    tags: Optional[List[str]] = Field(default_factory=list, description="Structured tags")


class IntakePatientCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200, description="Patient full name")
    age: int = Field(..., ge=1, le=150, description="Patient age")
    sex: str = Field(..., pattern="^(Male|Female|Other)$", description="Patient sex")
    address: Optional[str] = Field(None, max_length=500, description="Patient address")
    informants: InformantSelection = Field(..., description="Information sources")
    illness_duration: IllnessDuration = Field(..., description="Duration of current illness")
    referred_by: Optional[str] = Field(None, max_length=200, description="Referring doctor/source")
    precipitating_factor: Optional[PrecipitatingFactor] = Field(None, description="Precipitating factors")


class SymptomDuration(BaseModel):
    value: int = Field(..., gt=0, description="Duration value")
    unit: str = Field(..., pattern="^(Days|Weeks|Months)$", description="Duration unit")


class PatientSymptomCreate(BaseModel):
    symptom_id: str = Field(..., description="ID of the symptom (master or user)")
    symptom_source: str = Field(..., pattern="^(master|user)$", description="Source of symptom")
    severity: str = Field(..., pattern="^(Mild|Moderate|Severe)$", description="Symptom severity")
    frequency: str = Field(..., pattern="^(Hourly|Daily|Weekly|Constant)$", description="Symptom frequency")
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
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: Dict[str, Any] = Depends(require_any_role(["admin", "doctor", "receptionist"]))
):
    """
    Create a new intake patient record (Stage 1).
    Returns patient ID for use in Stage 2 symptom input.
    """
    try:
        # Import required modules
        import uuid
        
        # Generate UUID for intake patient
        patient_uuid = str(uuid.uuid4())
        
        # Create intake patient
        # Note: We create a minimal Patient record using raw SQL to avoid encryption overhead
        # This satisfies the FK constraint for consultation_sessions
        from sqlalchemy import text
        
        intake_patient = IntakePatient(
            id=patient_uuid,
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
        
        # Insert minimal Patient record using raw SQL (to bypass encryption)
        # This is a placeholder for FK constraint - real data is in intake_patients
        patient_insert_sql = text("""
            INSERT INTO patients (id, patient_id, first_name, last_name, date_of_birth, gender, created_by, name_hash)
            VALUES (:id, :patient_id, :first_name, :last_name, :dob, :gender, :created_by, :name_hash)
        """)
        
        db.execute(patient_insert_sql, {
            'id': patient_uuid,
            'patient_id': f'PT{patient_uuid[:10].upper()}',
            'first_name': patient_data.name[:20],  # Truncate to avoid encryption overflow
            'last_name': '',
            'dob': '1990-01-01',
            'gender': patient_data.sex[:10],
            'created_by': current_user_id,
            'name_hash': patient_uuid[:64]  # Placeholder hash
        })
        
        # Set main_patient_id to link to the placeholder
        intake_patient.main_patient_id = patient_uuid
        
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


@router.get("/patients/{patient_id}", response_model=Dict[str, Any])
async def get_intake_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: Dict[str, Any] = Depends(require_any_role(["admin", "doctor", "receptionist"]))
):
    """
    Get intake patient details by ID.
    Returns the patient data created during intake flow.
    """
    try:
        # Query intake patient
        intake_patient = db.query(IntakePatient).filter(
            IntakePatient.id == patient_id
        ).first()
        
        if not intake_patient:
            raise HTTPException(status_code=404, detail=f"Patient with ID {patient_id} not found")
        
        # Check authorization - only doctor who created it or admin can view
        if intake_patient.doctor_id != current_user_id:
            # Check if user is admin
            from app.models.user import User
            user = db.query(User).filter(User.id == current_user_id).first()
            if not user or user.role not in ['admin', 'doctor']:
                raise HTTPException(status_code=403, detail="You don't have permission to view this patient")
        
        return {
            "status": "success",
            "data": {
                "id": intake_patient.id,
                "name": intake_patient.name,
                "age": intake_patient.age,
                "sex": intake_patient.sex,
                "address": intake_patient.address,
                "informants": intake_patient.informants,
                "illness_duration": {
                    "value": intake_patient.illness_duration_value,
                    "unit": intake_patient.illness_duration_unit
                },
                "referred_by": intake_patient.referred_by,
                "precipitating_factor": {
                    "narrative": intake_patient.precipitating_factor_narrative,
                    "tags": intake_patient.precipitating_factor_tags
                } if intake_patient.precipitating_factor_narrative else None,
                "created_at": intake_patient.created_at.isoformat() if intake_patient.created_at else None,
                "doctor_id": intake_patient.doctor_id
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching intake patient: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch intake patient: {str(e)}")


@router.get("/symptoms", response_model=Dict[str, Any])
async def search_symptoms(
    q: str = Query(..., min_length=2, description="Search query for symptoms"),
    limit: int = Query(20, ge=1, le=50, description="Maximum results to return"),
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
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
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
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
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
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
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
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
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
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
        pass
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/patients/{patient_id}", response_model=Dict[str, Any])
async def update_intake_patient(
    patient_id: str,
    patient_data: dict,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: Dict[str, Any] = Depends(require_any_role(["admin", "doctor", "receptionist"]))
):
    """
    Update patient details.
    
    Allowed fields:
    - name, age, sex, address, phone, email
    - illness_duration_value, illness_duration_unit
    - referred_by, precipitating_factor_narrative
    - informants
    """
    try:
        import traceback
        
        # Find patient belonging to this doctor
        patient = db.query(IntakePatient).filter(
            IntakePatient.id == patient_id,
            IntakePatient.doctor_id == current_user_id
        ).first()
        
        if not patient:
            raise HTTPException(
                status_code=404,
                detail="Patient not found or you don't have permission to edit"
            )
        
        logger.info(f"📝 Updating patient {patient_id}: {list(patient_data.keys())}")
        
        # Update allowed fields
        updatable_fields = [
            'name', 'age', 'sex', 'address', 'phone', 'email',
            'illness_duration_value', 'illness_duration_unit',
            'referred_by', 'precipitating_factor_narrative',
            'precipitating_factor_tags', 'informants'
        ]
        
        updated_count = 0
        for key, value in patient_data.items():
            if key in updatable_fields and hasattr(patient, key):
                old_value = getattr(patient, key)
                setattr(patient, key, value)
                if old_value != value:
                    updated_count += 1
                    logger.info(f"  → {key}: changed")
        
        patient.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(patient)
        
        logger.info(f"✅ Patient {patient_id} updated: {updated_count} fields changed")
        
        return {
            "status": "success",
            "message": f"Patient updated successfully ({updated_count} fields)",
            "data": {
                "patient": patient.to_dict(),
                "updated_fields": updated_count
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Update patient error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update patient: {str(e)}"
        )


@router.get("/symptoms/search")
async def search_symptoms(
    q: str = Query(..., description="Search query"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Search for symptoms (global + user's custom symptoms)
    """
    try:
        logger.info(f"🔍 Searching symptoms: query='{q}', limit={limit}, user={current_user.id}")
        
        # Mock response for now - replace with actual database query later
        mock_results = [
            {"source_id": "1", "name": "Mania", "category": "Mood", "type": "global"},
            {"source_id": "2", "name": "Manic Episode", "category": "Mood", "type": "global"},
            {"source_id": "3", "name": "Depression", "category": "Mood", "type": "global"},
            {"source_id": "4", "name": "Depressive Episode", "category": "Mood", "type": "global"},
            {"source_id": "5", "name": "Anxiety", "category": "Mood", "type": "global"},
            {"source_id": "6", "name": "Panic Attack", "category": "Mood", "type": "global"},
            {"source_id": "7", "name": "Insomnia", "category": "Sleep", "type": "global"},
            {"source_id": "8", "name": "Hypersomnia", "category": "Sleep", "type": "global"},
            {"source_id": "9", "name": "Fatigue", "category": "Physical", "type": "global"},
            {"source_id": "10", "name": "Loss of Energy", "category": "Physical", "type": "global"},
            {"source_id": "11", "name": "Irritability", "category": "Mood", "type": "global"},
            {"source_id": "12", "name": "Restlessness", "category": "Physical", "type": "global"},
            {"source_id": "13", "name": "Loss of Appetite", "category": "Physical", "type": "global"},
            {"source_id": "14", "name": "Weight Loss", "category": "Physical", "type": "global"},
            {"source_id": "15", "name": "Weight Gain", "category": "Physical", "type": "global"},
            {"source_id": "16", "name": "Suicidal Thoughts", "category": "Mood", "type": "global"},
            {"source_id": "17", "name": "Hallucinations", "category": "Psychotic", "type": "global"},
            {"source_id": "18", "name": "Delusions", "category": "Psychotic", "type": "global"},
            {"source_id": "19", "name": "Racing Thoughts", "category": "Cognitive", "type": "global"},
            {"source_id": "20", "name": "Difficulty Concentrating", "category": "Cognitive", "type": "global"},
            {"source_id": "21", "name": "Memory Problems", "category": "Cognitive", "type": "global"},
            {"source_id": "22", "name": "Social Withdrawal", "category": "Behavioral", "type": "global"},
            {"source_id": "23", "name": "Agitation", "category": "Behavioral", "type": "global"},
            {"source_id": "24", "name": "Psychomotor Retardation", "category": "Physical", "type": "global"},
        ]
        
        # Filter results based on query (case-insensitive)
        query_lower = q.lower()
        filtered_results = [
            r for r in mock_results 
            if query_lower in r["name"].lower()
        ][:limit]
        
        logger.info(f"✅ Found {len(filtered_results)} symptoms matching '{q}'")
        
        return {
            "status": "success",
            "data": {
                "results": filtered_results,
                "total": len(filtered_results),
                "query": q
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Symptom search error: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
            "data": {"results": [], "total": 0}
        }


@router.post("/user_symptoms")
async def create_user_symptom(
    symptom_data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a custom symptom for the current user
    """
    try:
        symptom_name = symptom_data.get("name", "").strip()
        
        if not symptom_name:
            raise HTTPException(status_code=400, detail="Symptom name is required")
        
        logger.info(f"📝 Creating custom symptom '{symptom_name}' for user {current_user.id}")
        
        # For now, return mock data - implement database storage later
        symptom_id = f"custom_{current_user.id}_{symptom_name.replace(' ', '_').lower()}"
        
        logger.info(f"✅ Custom symptom created: {symptom_id}")
        
        return {
            "status": "success",
            "data": {
                "symptom_id": symptom_id,
                "name": symptom_name,
                "categories": symptom_data.get("categories", ["Custom"]),
                "type": "user",
                "description": symptom_data.get("description", "")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Create custom symptom error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create custom symptom: {str(e)}")

        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list patients: {str(e)}"
        )
