"""combined_schema_fix

Revision ID: combined_fix
Revises: d2a79ea3fd06
Create Date: 2025-10-03 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = 'combined_fix'
down_revision: Union[str, None] = 'd2a79ea3fd06'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use raw connection to check if tables exist
    from sqlalchemy import inspect
    connection = op.get_bind()
    inspector = inspect(connection)
    existing_tables = inspector.get_table_names()
    
    # Only alter tables if they exist, otherwise the initial schema hasn't been created
    # In that case, we need to manually use the app's create_tables()
    if 'user_profiles' not in existing_tables or 'users' not in existing_tables:
        # Tables don't exist yet - they'll be created by the app's create_tables() call in startup.sh
        # Just mark this migration as applied
        return
    
    # Step 1: Increase VARCHAR sizes for encrypted fields in user_profiles
    op.alter_column('user_profiles', 'first_name', type_=sa.String(255), existing_type=sa.String(100))
    op.alter_column('user_profiles', 'last_name', type_=sa.String(255), existing_type=sa.String(100))
    op.alter_column('user_profiles', 'phone', type_=sa.String(255), existing_type=sa.String(20))
    op.alter_column('user_profiles', 'license_number', type_=sa.String(255), existing_type=sa.String(50), existing_nullable=True)
    op.alter_column('user_profiles', 'specialization', type_=sa.String(255), existing_type=sa.String(100), existing_nullable=True)
    op.alter_column('user_profiles', 'organization', type_=sa.String(400), existing_type=sa.String(200), existing_nullable=True)
    op.alter_column('user_profiles', 'city', type_=sa.String(255), existing_type=sa.String(100), existing_nullable=True)
    op.alter_column('user_profiles', 'state', type_=sa.String(255), existing_type=sa.String(100), existing_nullable=True)
    op.alter_column('user_profiles', 'postal_code', type_=sa.String(255), existing_type=sa.String(20), existing_nullable=True)
    op.alter_column('user_profiles', 'country', type_=sa.String(255), existing_type=sa.String(100), existing_nullable=True)
    
    # Step 2: Add email_hash column for efficient lookups
    op.add_column('users', sa.Column('email_hash', sa.String(64), nullable=False, server_default='placeholder'))
    op.alter_column('users', 'email_hash', server_default=None)
    op.create_unique_constraint('uq_users_email_hash', 'users', ['email_hash'])
    op.create_index('ix_users_email_hash', 'users', ['email_hash'])
    
    # Step 3: Remove unique constraint from encrypted email column
    try:
        op.drop_constraint('users_email_key', 'users', type_='unique')
    except:
        pass


def downgrade() -> None:
    # Revert email_hash changes
    op.drop_index('ix_users_email_hash', 'users')
    op.drop_constraint('uq_users_email_hash', 'users', type_='unique')
    op.drop_column('users', 'email_hash')
    op.create_unique_constraint('users_email_key', 'users', ['email'])
    
    # Revert column sizes (may cause data loss)
    op.alter_column('user_profiles', 'first_name', type_=sa.String(100), existing_type=sa.String(255))
    op.alter_column('user_profiles', 'last_name', type_=sa.String(100), existing_type=sa.String(255))
    op.alter_column('user_profiles', 'phone', type_=sa.String(20), existing_type=sa.String(255))
    op.alter_column('user_profiles', 'license_number', type_=sa.String(50), existing_type=sa.String(255), existing_nullable=True)
    op.alter_column('user_profiles', 'specialization', type_=sa.String(100), existing_type=sa.String(255), existing_nullable=True)
    op.alter_column('user_profiles', 'organization', type_=sa.String(200), existing_type=sa.String(400), existing_nullable=True)
    op.alter_column('user_profiles', 'city', type_=sa.String(100), existing_type=sa.String(255), existing_nullable=True)
    op.alter_column('user_profiles', 'state', type_=sa.String(100), existing_type=sa.String(255), existing_nullable=True)
    op.alter_column('user_profiles', 'postal_code', type_=sa.String(20), existing_type=sa.String(255), existing_nullable=True)
    op.alter_column('user_profiles', 'country', type_=sa.String(100), existing_type=sa.String(255), existing_nullable=True)

