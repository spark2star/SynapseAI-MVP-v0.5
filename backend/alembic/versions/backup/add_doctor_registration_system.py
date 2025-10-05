"""add_doctor_registration_system

Revision ID: doctor_reg_001
Revises: add_pagination_indexes
Create Date: 2025-10-04 22:00:00.000000

Adds comprehensive doctor registration and admin verification system:
- Extends User model with doctor_status field
- Creates DoctorProfile model for medical credentials
- Creates AuditLog model for compliance tracking
- Creates EmailQueue model for notification management
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'doctor_reg_001'
down_revision = 'pagination_idx_001'
branch_labels = None
depends_on = None


def upgrade():
    """Apply doctor registration system schema changes."""
    
    # 1. Add doctor_status column to users table
    op.add_column('users', sa.Column('doctor_status', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('password_reset_required', sa.Boolean(), nullable=False, server_default='false'))
    
    # Create index on doctor_status for efficient filtering
    op.create_index('idx_users_doctor_status', 'users', ['doctor_status'])
    
    # 2. Create doctor_profiles table
    op.create_table(
        'doctor_profiles',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        
        # Required fields for application
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('medical_registration_number', sa.String(100), nullable=False, unique=True),
        sa.Column('state_medical_council', sa.String(100), nullable=False),
        
        # Required fields post-approval (completed on first login)
        sa.Column('clinic_name', sa.String(255), nullable=True),
        sa.Column('clinic_address', sa.Text, nullable=True),
        sa.Column('specializations', postgresql.JSONB, nullable=True),
        sa.Column('years_of_experience', sa.Integer, nullable=True),
        sa.Column('digital_signature_url', sa.String(500), nullable=True),
        sa.Column('phone_number', sa.String(20), nullable=True),
        sa.Column('alternate_email', sa.String(255), nullable=True),
        
        # Metadata fields
        sa.Column('application_date', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('verification_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('verified_by_admin_id', sa.String(36), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('rejection_reason', sa.Text, nullable=True),
        sa.Column('profile_completed', sa.Boolean, nullable=False, server_default='false'),
        
        # Audit fields
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), onupdate=sa.text('CURRENT_TIMESTAMP')),
    )
    
    # Create indexes for doctor_profiles
    op.create_index('idx_doctor_profiles_user_id', 'doctor_profiles', ['user_id'])
    op.create_index('idx_doctor_profiles_med_reg_number', 'doctor_profiles', ['medical_registration_number'])
    op.create_index('idx_doctor_profiles_verified_by', 'doctor_profiles', ['verified_by_admin_id'])
    
    # 3. Create doctor_audit_logs table
    op.create_table(
        'doctor_audit_logs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('event_type', sa.String(50), nullable=False),
        sa.Column('admin_user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('doctor_user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),  # IPv6 max length
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('details', postgresql.JSONB, nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    
    # Create indexes for doctor_audit_logs
    op.create_index('idx_doctor_audit_logs_event_type', 'doctor_audit_logs', ['event_type'])
    op.create_index('idx_doctor_audit_logs_admin_user', 'doctor_audit_logs', ['admin_user_id'])
    op.create_index('idx_doctor_audit_logs_doctor_user', 'doctor_audit_logs', ['doctor_user_id'])
    op.create_index('idx_doctor_audit_logs_timestamp', 'doctor_audit_logs', ['timestamp'])
    
    # 4. Create email_queue table
    op.create_table(
        'email_queue',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('recipient_email', sa.String(255), nullable=False),
        sa.Column('template_name', sa.String(100), nullable=False),
        sa.Column('template_data', postgresql.JSONB, nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), onupdate=sa.text('CURRENT_TIMESTAMP')),
    )
    
    # Create indexes for email_queue
    op.create_index('idx_email_queue_status', 'email_queue', ['status'])
    op.create_index('idx_email_queue_created_at', 'email_queue', ['created_at'])


def downgrade():
    """Rollback doctor registration system schema changes."""
    
    # Drop email_queue table and indexes
    op.drop_index('idx_email_queue_created_at', table_name='email_queue')
    op.drop_index('idx_email_queue_status', table_name='email_queue')
    op.drop_table('email_queue')
    
    # Drop doctor_audit_logs table and indexes
    op.drop_index('idx_doctor_audit_logs_timestamp', table_name='doctor_audit_logs')
    op.drop_index('idx_doctor_audit_logs_doctor_user', table_name='doctor_audit_logs')
    op.drop_index('idx_doctor_audit_logs_admin_user', table_name='doctor_audit_logs')
    op.drop_index('idx_doctor_audit_logs_event_type', table_name='doctor_audit_logs')
    op.drop_table('doctor_audit_logs')
    
    # Drop doctor_profiles table and indexes
    op.drop_index('idx_doctor_profiles_verified_by', table_name='doctor_profiles')
    op.drop_index('idx_doctor_profiles_med_reg_number', table_name='doctor_profiles')
    op.drop_index('idx_doctor_profiles_user_id', table_name='doctor_profiles')
    op.drop_table('doctor_profiles')
    
    # Remove columns from users table
    op.drop_index('idx_users_doctor_status', table_name='users')
    op.drop_column('users', 'password_reset_required')
    op.drop_column('users', 'doctor_status')
