"""Add enhanced report fields

Revision ID: enhanced_report_001
Revises: 
Create Date: 2025-10-14 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'enhanced_report_001'
down_revision = None  # Set this to your latest migration ID
branch_labels = None
depends_on = None


def upgrade():
    """Add new fields to reports table for enhanced workflow."""
    # Add reviewed_transcript column (encrypted text)
    op.add_column('reports', sa.Column('reviewed_transcript', sa.Text(), nullable=True))
    
    # Add keywords array column
    op.add_column('reports', sa.Column('keywords', postgresql.ARRAY(sa.String()), nullable=True))
    
    # Add confidence scores
    op.add_column('reports', sa.Column('stt_confidence_score', sa.Float(), nullable=True))
    op.add_column('reports', sa.Column('llm_confidence_score', sa.Float(), nullable=True))
    
    # Add doctor feedback fields
    op.add_column('reports', sa.Column('doctor_feedback', sa.String(length=20), nullable=True))
    op.add_column('reports', sa.Column('feedback_submitted_at', sa.DateTime(), nullable=True))


def downgrade():
    """Remove enhanced workflow fields."""
    op.drop_column('reports', 'feedback_submitted_at')
    op.drop_column('reports', 'doctor_feedback')
    op.drop_column('reports', 'llm_confidence_score')
    op.drop_column('reports', 'stt_confidence_score')
    op.drop_column('reports', 'keywords')
    op.drop_column('reports', 'reviewed_transcript')

