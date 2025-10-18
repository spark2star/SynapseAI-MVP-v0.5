# Database Migration Commands

## Receptionist Role & Two-Stage Patient Registration

This migration adds support for:
1. Staff invitation system for receptionists
2. Two-stage patient registration workflow
3. Clinic grouping via invited_by_id relationship

### Changes:
- **users table**: Added `invited_by_id` column (nullable UUID, ForeignKey to users.id)
- **patients table**: Added `profile_status` column (default: 'DEMOGRAPHICS_ONLY')
- **staff_invitations table**: New table for managing invitation tokens

### Commands:

```bash
# 1. Auto-generate migration script
cd backend
alembic revision --autogenerate -m "add_receptionist_role_and_two_stage_patient_registration"

# 2. Review the generated migration file in backend/alembic/versions/
# Make sure it includes:
#   - ALTER TABLE users ADD COLUMN invited_by_id
#   - ALTER TABLE patients ADD COLUMN profile_status
#   - CREATE TABLE staff_invitations

# 3. Apply the migration
alembic upgrade head

# 4. Verify migration was applied
alembic current

# 5. If you need to rollback
alembic downgrade -1
```

### Manual Migration (if autogenerate doesn't work):

If alembic autogenerate doesn't detect the changes, create a manual migration:

```bash
alembic revision -m "add_receptionist_role_and_two_stage_patient_registration"
```

Then edit the generated file with:

```python
def upgrade():
    # Add invited_by_id to users table
    op.add_column('users', sa.Column('invited_by_id', sa.String(36), nullable=True))
    op.create_index('ix_users_invited_by_id', 'users', ['invited_by_id'])
    op.create_foreign_key('fk_users_invited_by_id', 'users', 'users', ['invited_by_id'], ['id'])
    
    # Add profile_status to patients table
    op.add_column('patients', sa.Column('profile_status', sa.String(30), nullable=False, server_default='DEMOGRAPHICS_ONLY'))
    op.create_index('ix_patients_profile_status', 'patients', ['profile_status'])
    
    # Create staff_invitations table
    op.create_table(
        'staff_invitations',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('inviter_id', sa.String(36), nullable=False),
        sa.Column('recipient_email', sa.String(255), nullable=False),
        sa.Column('token', sa.String(255), nullable=False, unique=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['inviter_id'], ['users.id']),
    )
    op.create_index('ix_staff_invitations_inviter_id', 'staff_invitations', ['inviter_id'])
    op.create_index('ix_staff_invitations_recipient_email', 'staff_invitations', ['recipient_email'])
    op.create_index('ix_staff_invitations_token', 'staff_invitations', ['token'], unique=True)


def downgrade():
    # Drop staff_invitations table
    op.drop_index('ix_staff_invitations_token', 'staff_invitations')
    op.drop_index('ix_staff_invitations_recipient_email', 'staff_invitations')
    op.drop_index('ix_staff_invitations_inviter_id', 'staff_invitations')
    op.drop_table('staff_invitations')
    
    # Remove profile_status from patients
    op.drop_index('ix_patients_profile_status', 'patients')
    op.drop_column('patients', 'profile_status')
    
    # Remove invited_by_id from users
    op.drop_constraint('fk_users_invited_by_id', 'users', type_='foreignkey')
    op.drop_index('ix_users_invited_by_id', 'users')
    op.drop_column('users', 'invited_by_id')
```

### Testing the Migration:

```bash
# Check database schema
psql -U your_user -d your_database -c "\d users"
psql -U your_user -d your_database -c "\d patients"
psql -U your_user -d your_database -c "\d staff_invitations"
```
