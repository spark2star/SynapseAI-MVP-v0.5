"""add profile qualifications and signature hash

Revision ID: profile_signature_001
Revises: 9691ddd22bb4
Create Date: 2025-10-18 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'profile_signature_001'
down_revision: Union[str, None] = '9691ddd22bb4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Apply schema changes for doctor profile completion and digital signature."""
    # Add qualifications column to doctor_profiles table
    op.add_column('doctor_profiles', sa.Column('qualifications', sa.String(length=255), nullable=True))
    
    # Add signature_hash column to reports table for digital signature verification
    op.add_column('reports', sa.Column('signature_hash', sa.String(length=64), nullable=True))


def downgrade() -> None:
    """Revert schema changes."""
    # Remove signature_hash column from reports table
    op.drop_column('reports', 'signature_hash')
    
    # Remove qualifications column from doctor_profiles table
    op.drop_column('doctor_profiles', 'qualifications')
