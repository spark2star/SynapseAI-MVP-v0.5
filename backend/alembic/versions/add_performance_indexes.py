"""add_performance_indexes

Revision ID: perf_idx_001
Revises: doctor_reg_001
Create Date: 2025-10-05

Strategic indexes for query performance optimization.
Target: <100ms response time for all list operations.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'perf_idx_001'
down_revision = 'doctor_reg_001'
branch_labels = None
depends_on = None


def upgrade():
    """Add performance indexes"""
    
    # ============================================
    # PATIENT INDEXES
    # ============================================
    
    # For patient list ordered by created_at with doctor filter
    op.create_index(
        'idx_intake_patients_doctor_created',
        'intake_patients',
        ['doctor_id', 'created_at'],
        postgresql_using='btree'
    )
    
    # For patient search by name (case-insensitive)
    op.create_index(
        'idx_intake_patients_name_search',
        'intake_patients',
        [sa.text('LOWER(name)')],
        postgresql_using='btree'
    )
    
    # For patient search by phone
    op.create_index(
        'idx_intake_patients_phone',
        'intake_patients',
        ['phone'],
        postgresql_using='btree'
    )
    
    # For patient search by email
    op.create_index(
        'idx_intake_patients_email',
        'intake_patients',
        ['email'],
        postgresql_using='btree'
    )
    
    # Composite index for doctor + status queries
    op.create_index(
        'idx_intake_patients_doctor_status',
        'intake_patients',
        ['doctor_id', 'is_active'],
        postgresql_using='btree'
    )
    
    # ============================================
    # CONSULTATION SESSION INDEXES
    # ============================================
    
    # For consultation history by patient
    op.create_index(
        'idx_consultation_sessions_patient_created',
        'consultation_sessions',
        ['patient_id', 'created_at'],
        postgresql_using='btree'
    )
    
    # For doctor's consultation list
    op.create_index(
        'idx_consultation_sessions_doctor_created',
        'consultation_sessions',
        ['doctor_id', 'created_at'],
        postgresql_using='btree'
    )
    
    # For session lookup by session_id (human-readable ID)
    op.create_index(
        'idx_consultation_sessions_session_id',
        'consultation_sessions',
        ['session_id'],
        unique=True,
        postgresql_using='btree'
    )
    
    # For status filtering
    op.create_index(
        'idx_consultation_sessions_status',
        'consultation_sessions',
        ['status'],
        postgresql_using='btree'
    )
    
    # Composite for patient + status queries
    op.create_index(
        'idx_consultation_sessions_patient_status',
        'consultation_sessions',
        ['patient_id', 'status'],
        postgresql_using='btree'
    )
    
    # ============================================
    # REPORT INDEXES
    # ============================================
    
    # For report list by creation date
    op.create_index(
        'idx_reports_created',
        'reports',
        ['created_at'],
        postgresql_using='btree'
    )
    
    # For reports by session
    op.create_index(
        'idx_reports_session',
        'reports',
        ['session_id'],
        postgresql_using='btree'
    )
    
    # For report status filtering
    op.create_index(
        'idx_reports_status',
        'reports',
        ['status'],
        postgresql_using='btree'
    )
    
    # Composite for session + status queries
    op.create_index(
        'idx_reports_session_status',
        'reports',
        ['session_id', 'status'],
        postgresql_using='btree'
    )
    
    # For report type filtering
    op.create_index(
        'idx_reports_type',
        'reports',
        ['report_type'],
        postgresql_using='btree'
    )
    
    # ============================================
    # USER INDEXES
    # ============================================
    
    # For authentication by email (most critical)
    op.create_index(
        'idx_users_email',
        'users',
        ['email'],
        unique=True,
        postgresql_using='btree'
    )
    
    # For role-based queries
    op.create_index(
        'idx_users_role',
        'users',
        ['role'],
        postgresql_using='btree'
    )
    
    # Composite for active users by role
    op.create_index(
        'idx_users_role_active',
        'users',
        ['role', 'is_active'],
        postgresql_using='btree'
    )
    
    # ============================================
    # TRANSCRIPTION INDEXES
    # ============================================
    
    # For transcription by session
    op.create_index(
        'idx_transcriptions_session',
        'transcriptions',
        ['session_id'],
        postgresql_using='btree'
    )
    
    # For transcription status
    op.create_index(
        'idx_transcriptions_status',
        'transcriptions',
        ['status'],
        postgresql_using='btree'
    )
    
    # ============================================
    # SYMPTOM INDEXES
    # ============================================
    
    # For symptom search (case-insensitive)
    op.create_index(
        'idx_master_symptoms_name_search',
        'master_symptoms',
        [sa.text('LOWER(name)')],
        postgresql_using='btree'
    )
    
    # For user symptom search by doctor
    op.create_index(
        'idx_user_symptoms_doctor',
        'user_symptoms',
        ['doctor_id'],
        postgresql_using='btree'
    )
    
    # For user symptom search by name
    op.create_index(
        'idx_user_symptoms_name_search',
        'user_symptoms',
        [sa.text('LOWER(name)')],
        postgresql_using='btree'
    )


def downgrade():
    """Remove performance indexes"""
    
    # Patient indexes
    op.drop_index('idx_intake_patients_doctor_created', table_name='intake_patients')
    op.drop_index('idx_intake_patients_name_search', table_name='intake_patients')
    op.drop_index('idx_intake_patients_phone', table_name='intake_patients')
    op.drop_index('idx_intake_patients_email', table_name='intake_patients')
    op.drop_index('idx_intake_patients_doctor_status', table_name='intake_patients')
    
    # Consultation indexes
    op.drop_index('idx_consultation_sessions_patient_created', table_name='consultation_sessions')
    op.drop_index('idx_consultation_sessions_doctor_created', table_name='consultation_sessions')
    op.drop_index('idx_consultation_sessions_session_id', table_name='consultation_sessions')
    op.drop_index('idx_consultation_sessions_status', table_name='consultation_sessions')
    op.drop_index('idx_consultation_sessions_patient_status', table_name='consultation_sessions')
    
    # Report indexes
    op.drop_index('idx_reports_created', table_name='reports')
    op.drop_index('idx_reports_session', table_name='reports')
    op.drop_index('idx_reports_status', table_name='reports')
    op.drop_index('idx_reports_session_status', table_name='reports')
    op.drop_index('idx_reports_type', table_name='reports')
    
    # User indexes
    op.drop_index('idx_users_email', table_name='users')
    op.drop_index('idx_users_role', table_name='users')
    op.drop_index('idx_users_role_active', table_name='users')
    
    # Transcription indexes
    op.drop_index('idx_transcriptions_session', table_name='transcriptions')
    op.drop_index('idx_transcriptions_status', table_name='transcriptions')
    
    # Symptom indexes
    op.drop_index('idx_master_symptoms_name_search', table_name='master_symptoms')
    op.drop_index('idx_user_symptoms_doctor', table_name='user_symptoms')
    op.drop_index('idx_user_symptoms_name_search', table_name='user_symptoms')
