"""Initial schema with all models

Revision ID: d2a79ea3fd06
Revises: 
Create Date: 2025-09-30 17:59:35.001922

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'd2a79ea3fd06'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create master_symptoms table (needed before seeding)
    op.create_table(
        'master_symptoms',
        sa.Column('id', sa.String(length=36), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('categories', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column('aliases', postgresql.JSONB(astext_type=sa.Text()), nullable=True, server_default=sa.text("'[]'::jsonb")),
        sa.Column('tags', postgresql.JSONB(astext_type=sa.Text()), nullable=True, server_default=sa.text("'[]'::jsonb")),
        sa.Column('is_active', sa.Integer, nullable=False, server_default='1'),
    )
    op.create_index('ix_master_symptoms_name', 'master_symptoms', ['name'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_master_symptoms_name', table_name='master_symptoms')
    op.drop_table('master_symptoms')
