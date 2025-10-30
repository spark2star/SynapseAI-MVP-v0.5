"""
Dashboard analytics endpoint for Clinical Command Center.
Provides consolidated dashboard statistics for doctors.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from typing import Dict, Any, List
from datetime import datetime, timedelta
import logging

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.models.patient import Patient, ProfileStatus
from app.models.report import Report, ReportStatus
from app.models.session import ConsultationSession

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_pending_intake_patients(db: Session, doctor_id: str) -> List[Dict[str, Any]]:
    """
    Get patients who have completed demographics but need clinical info completion.
    
    Args:
        db: Database session
        doctor_id: Current doctor's user ID
        
    Returns:
        List of pending intake patients with id, full_name, and registered_at
    """
    try:
        patients = db.query(Patient).filter(
            and_(
                Patient.created_by == doctor_id,
                Patient.profile_status == ProfileStatus.DEMOGRAPHICS_ONLY.value
            )
        ).order_by(desc(Patient.created_at)).limit(5).all()
        
        return [
            {
                "id": patient.id,
                "full_name": patient.full_name,
                "registered_at": patient.created_at.isoformat() if patient.created_at else None
            }
            for patient in patients
        ]
    except Exception as e:
        logger.error(f"Error fetching pending intake patients: {str(e)}", exc_info=True)
        return []


def _get_needs_attention_count(db: Session, doctor_id: str) -> int:
    """
    Get count of patients whose latest report indicates 'worse' status.
    
    Args:
        db: Database session
        doctor_id: Current doctor's user ID
        
    Returns:
        Count of patients needing attention
    """
    try:
        # Subquery to get the latest report for each patient
        latest_reports_subquery = db.query(
            ConsultationSession.patient_id,
            func.max(Report.created_at).label('latest_report_date')
        ).join(
            Report,
            ConsultationSession.id == Report.session_id
        ).join(
            Patient,
            ConsultationSession.patient_id == Patient.id
        ).filter(
            and_(
                Patient.created_by == doctor_id,
                Report.patient_status.isnot(None)
            )
        ).group_by(
            ConsultationSession.patient_id
        ).subquery()
        
        # Join back to get the actual reports and filter for 'worse' status
        needs_attention_count = db.query(
            func.count(func.distinct(ConsultationSession.patient_id))
        ).join(
            Report,
            ConsultationSession.id == Report.session_id
        ).join(
            latest_reports_subquery,
            and_(
                ConsultationSession.patient_id == latest_reports_subquery.c.patient_id,
                Report.created_at == latest_reports_subquery.c.latest_report_date
            )
        ).filter(
            Report.patient_status == 'worse'
        ).scalar()
        
        return needs_attention_count or 0
    except Exception as e:
        logger.error(f"Error fetching needs attention count: {str(e)}", exc_info=True)
        return 0


def _get_pending_reports_count(db: Session, doctor_id: str) -> int:
    """
    Get count of reports with status 'completed' awaiting review.
    
    Args:
        db: Database session
        doctor_id: Current doctor's user ID
        
    Returns:
        Count of pending reports
    """
    try:
        pending_count = db.query(Report).join(
            ConsultationSession,
            Report.session_id == ConsultationSession.id
        ).join(
            Patient,
            ConsultationSession.patient_id == Patient.id
        ).filter(
            and_(
                Patient.created_by == doctor_id,
                Report.status == ReportStatus.COMPLETED.value
            )
        ).count()
        
        return pending_count
    except Exception as e:
        logger.error(f"Error fetching pending reports count: {str(e)}", exc_info=True)
        return 0


def _get_active_patients_count(db: Session, doctor_id: str) -> int:
    """
    Get count of patients with completed clinical profiles.
    
    Args:
        db: Database session
        doctor_id: Current doctor's user ID
        
    Returns:
        Count of active patients
    """
    try:
        active_count = db.query(Patient).filter(
            and_(
                Patient.created_by == doctor_id,
                Patient.profile_status == ProfileStatus.CLINICAL_INFO_COMPLETE.value
            )
        ).count()
        
        return active_count
    except Exception as e:
        logger.error(f"Error fetching active patients count: {str(e)}", exc_info=True)
        return 0


def _get_weekly_sessions(db: Session, doctor_id: str) -> List[Dict[str, Any]]:
    """
    Get consultation session counts grouped by day of week for the last 7 days.
    
    Args:
        db: Database session
        doctor_id: Current doctor's user ID
        
    Returns:
        List of objects with day and count fields
    """
    try:
        from datetime import timezone
        
        # Calculate date 7 days ago (timezone-aware)
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        
        # Get all sessions from last 7 days
        # Note: started_at is stored as ISO string, so we need to parse it
        sessions_query = db.query(ConsultationSession).join(
            Patient,
            ConsultationSession.patient_id == Patient.id
        ).filter(
            and_(
                Patient.created_by == doctor_id,
                ConsultationSession.started_at.isnot(None)
            )
        ).all()
        
        # Map day numbers to abbreviated names
        day_map = {
            0: 'Mon',
            1: 'Tue',
            2: 'Wed',
            3: 'Thu',
            4: 'Fri',
            5: 'Sat',
            6: 'Sun'
        }
        
        # Create result with all days initialized to 0
        result = [{"day": day_map[i], "count": 0} for i in range(7)]
        
        # Count sessions by day of week
        for session in sessions_query:
            try:
                # Parse ISO format timestamp and make it timezone-aware
                session_date_str = session.started_at.replace('Z', '+00:00')
                session_date = datetime.fromisoformat(session_date_str)
                
                # If session_date is naive, make it UTC-aware
                if session_date.tzinfo is None:
                    session_date = session_date.replace(tzinfo=timezone.utc)
                
                # Check if within last 7 days
                if session_date >= seven_days_ago:
                    # Get day of week (0=Monday, 6=Sunday)
                    day_of_week = session_date.weekday()
                    result[day_of_week]["count"] += 1
            except (ValueError, AttributeError) as e:
                logger.warning(f"Could not parse session date: {session.started_at}")
                continue
        
        return result
    except Exception as e:
        logger.error(f"Error fetching weekly sessions: {str(e)}", exc_info=True)
        return [{"day": day, "count": 0} for day in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']]


@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """
    Get consolidated dashboard statistics for the current doctor.
    
    Returns all dashboard metrics in a single API call:
    - Pending intake patients (up to 5)
    - Needs attention patients count
    - Pending reports count
    - Active patients count
    - Weekly sessions data
    
    Implements graceful degradation - if individual queries fail,
    returns default values for those metrics while still providing
    available data.
    
    Returns:
        Dictionary with status and data containing all dashboard metrics
    """
    try:
        logger.info(f"Dashboard stats requested by doctor {current_user_id}")
        
        # Initialize response with default values
        response_data = {
            "pending_intake_patients": [],
            "needs_attention_patients_count": 0,
            "pending_reports_count": 0,
            "active_patients_count": 0,
            "sessions_this_week": []
        }
        
        # Execute queries with individual error handling for graceful degradation
        try:
            response_data["pending_intake_patients"] = _get_pending_intake_patients(db, current_user_id)
        except Exception as e:
            logger.error(f"Failed to fetch pending intake patients: {str(e)}")
        
        try:
            response_data["needs_attention_patients_count"] = _get_needs_attention_count(db, current_user_id)
        except Exception as e:
            logger.error(f"Failed to fetch needs attention count: {str(e)}")
        
        try:
            response_data["pending_reports_count"] = _get_pending_reports_count(db, current_user_id)
        except Exception as e:
            logger.error(f"Failed to fetch pending reports count: {str(e)}")
        
        try:
            response_data["active_patients_count"] = _get_active_patients_count(db, current_user_id)
        except Exception as e:
            logger.error(f"Failed to fetch active patients count: {str(e)}")
        
        try:
            response_data["sessions_this_week"] = _get_weekly_sessions(db, current_user_id)
        except Exception as e:
            logger.error(f"Failed to fetch weekly sessions: {str(e)}")
        
        logger.info(f"Dashboard stats successfully retrieved for doctor {current_user_id}")
        
        return {
            "status": "success",
            "data": response_data
        }
        
    except Exception as e:
        logger.error(f"Dashboard stats error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to load dashboard data"
        )
