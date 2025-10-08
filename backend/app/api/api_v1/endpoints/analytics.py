"""
Analytics endpoints for dashboard statistics.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Dict, Any
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import logging

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.report import Report
from app.models.session import ConsultationSession
from app.models.symptom import IntakePatient

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/patient-status")
async def get_patient_status_stats(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get patient status statistics (improving/stable/worse) for the current doctor.
    Returns counts for each status category.
    """
    try:
        # Get latest report for each patient with status
        latest_reports = db.query(
            Report.session_id,
            Report.patient_status,
            func.max(Report.created_at).label('latest_report_date')
        ).join(
            ConsultationSession,
            Report.session_id == ConsultationSession.id
        ).join(
            IntakePatient,
            ConsultationSession.patient_id == IntakePatient.id
        ).filter(
            IntakePatient.doctor_id == current_user_id,
            Report.patient_status.isnot(None)
        ).group_by(
            ConsultationSession.patient_id,
            Report.session_id,
            Report.patient_status
        ).subquery()
        
        # Count by status
        status_counts = db.query(
            latest_reports.c.patient_status,
            func.count(latest_reports.c.session_id).label('count')
        ).group_by(latest_reports.c.patient_status).all()
        
        # Format response
        stats = {
            'improving': 0,
            'stable': 0,
            'worse': 0,
            'total': 0
        }
        
        for status, count in status_counts:
            if status:
                stats[status.lower()] = count
                stats['total'] += count
        
        return {
            "status": "success",
            "data": stats
        }
        
    except Exception as e:
        logger.error(f"Analytics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/overview")
async def get_dashboard_overview(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get comprehensive dashboard overview statistics.
    """
    try:
        # Total patients
        total_patients = db.query(IntakePatient).filter(
            IntakePatient.doctor_id == current_user_id
        ).count()
        
        # Total consultations
        total_consultations = db.query(ConsultationSession).join(
            IntakePatient,
            ConsultationSession.patient_id == IntakePatient.id
        ).filter(
            IntakePatient.doctor_id == current_user_id
        ).count()
        
        # Get patient status stats
        status_stats = await get_patient_status_stats(db, current_user_id)
        
        return {
            "status": "success",
            "data": {
                "total_patients": total_patients,
                "total_consultations": total_consultations,
                "patient_status": status_stats["data"]
            }
        }
        
    except Exception as e:
        logger.error(f"Overview error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/monthly-trends")
async def get_monthly_trends(
    months: int = Query(6, ge=1, le=12, description="Number of months to retrieve"),
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get monthly patient trends for the specified number of months.
    Returns patient counts, consultation counts, and status distribution per month.
    
    This is a production-ready endpoint that provides real historical data
    instead of mock data for dashboard graphs.
    """
    try:
        trends = []
        now = datetime.utcnow()
        
        for i in range(months):
            # Calculate month boundaries
            month_date = now - relativedelta(months=months - i - 1)
            month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            if i == months - 1:  # Current month
                month_end = now
            else:
                month_end = (month_start + relativedelta(months=1)) - timedelta(seconds=1)
            
            # Count patients created up to end of this month (cumulative)
            cumulative_patients = db.query(IntakePatient).filter(
                IntakePatient.doctor_id == current_user_id,
                IntakePatient.created_at <= month_end
            ).count()
            
            # Get consultations in this month
            consultations_in_month = db.query(ConsultationSession).join(
                IntakePatient,
                ConsultationSession.patient_id == IntakePatient.id
            ).filter(
                IntakePatient.doctor_id == current_user_id,
                ConsultationSession.created_at >= month_start,
                ConsultationSession.created_at <= month_end
            ).all()
            
            # Count unique patients with status from reports in this month
            improving_patients = set()
            worse_patients = set()
            stable_patients = set()
            
            for consultation in consultations_in_month:
                reports = db.query(Report).filter(
                    Report.session_id == consultation.id,
                    Report.patient_status.isnot(None)
                ).all()
                
                for report in reports:
                    patient_id = consultation.patient_id
                    if report.patient_status == 'improving':
                        improving_patients.add(patient_id)
                    elif report.patient_status == 'worse':
                        worse_patients.add(patient_id)
                    elif report.patient_status == 'stable':
                        stable_patients.add(patient_id)
            
            trends.append({
                "month": month_date.strftime("%b"),
                "year": month_date.year,
                "lives_touched": cumulative_patients,
                "positive_progress": len(improving_patients),
                "needs_attention": len(worse_patients),
                "stable": len(stable_patients),
                "consultations": len(consultations_in_month)
            })
        
        logger.info(f"Monthly trends generated: {months} months for doctor {current_user_id}")
        
        return {
            "status": "success",
            "data": {
                "trends": trends,
                "months": months,
                "current_month": now.strftime("%B %Y")
            }
        }
        
    except Exception as e:
        logger.error(f"Monthly trends error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve monthly trends: {str(e)}")
