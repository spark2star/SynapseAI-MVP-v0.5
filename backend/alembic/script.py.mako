"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
${imports if imports else ""}

# revision identifiers, used by Alembic.
revision: str = ${repr(up_revision)}
down_revision: Union[str, None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
    """Apply schema changes."""
    # Example safety check:
    # conn = op.get_bind()
    # result = conn.execute(text("SELECT 1")).scalar()
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    """Revert schema changes."""
    ${downgrades if downgrades else "pass"}
