"""
Dependencies for FastAPI endpoints.
Implements authentication, authorization, and common dependencies.
"""

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
import logging

from app.core.database import get_db
from app.core.security import jwt_manager
from app.core.exceptions import UnauthorizedException, ForbiddenException, UserNotFoundException
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)
security = HTTPBearer()


# Token and Authentication Dependencies
async def get_current_user_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Extract and verify JWT token from Authorization header.
    
    Returns:
        Token payload containing user information
        
    Raises:
        UnauthorizedException: If token is invalid or expired
    """
    try:
        token = credentials.credentials
        payload = jwt_manager.verify_token(token, token_type="access")
        return payload
    except Exception as e:
        logger.warning(f"Token verification failed: {str(e)}")
        raise UnauthorizedException("Invalid or expired authentication token")


async def get_current_user_id(
    token_data: Dict[str, Any] = Depends(get_current_user_token)
) -> str:
    """
    Extract user ID from token payload.
    
    Returns:
        User ID as string
        
    Raises:
        UnauthorizedException: If user ID not in token
    """
    user_id = token_data.get("sub")
    if not user_id:
        raise UnauthorizedException("Invalid token: missing user identifier")
    return user_id


async def get_current_user(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from database.
    
    Returns:
        User model instance
        
    Raises:
        UserNotFoundException: If user not found
        ForbiddenException: If user account is inactive or locked
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise UserNotFoundException(user_id)
    
    if not user.is_active:
        raise ForbiddenException("Account is inactive. Please contact support.")
    
    if user.is_account_locked():
        raise ForbiddenException("Account is temporarily locked. Please try again later.")
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Ensure current user is active (redundant check for clarity).
    
    Returns:
        Active user model instance
    """
    return current_user


# Role-Based Access Control Dependencies
def require_role(required_role: UserRole):
    """
    Dependency factory to require specific user role.
    
    Args:
        required_role: Required UserRole enum value
        
    Returns:
        Dependency function that checks user role
        
    Example:
        @app.get("/admin", dependencies=[Depends(require_role(UserRole.ADMIN))])
    """
    async def check_role(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role != required_role.value:
            raise ForbiddenException(
                f"Access denied. Required role: {required_role.value}"
            )
        return current_user
    
    return check_role


def require_any_role(required_roles: List[UserRole]):
    """
    Dependency factory to require any of the specified roles.
    
    Args:
        required_roles: List of acceptable UserRole enum values
        
    Returns:
        Dependency function that checks if user has any of the roles
        
    Example:
        @app.get("/data", dependencies=[Depends(require_any_role([UserRole.ADMIN, UserRole.DOCTOR]))])
    """
    async def check_roles(current_user: User = Depends(get_current_active_user)) -> User:
        role_values = [role.value for role in required_roles]
        if current_user.role not in role_values:
            raise ForbiddenException(
                f"Access denied. Required roles: {', '.join(role_values)}"
            )
        return current_user
    
    return check_roles


# Specific Role Dependencies (for convenience)
async def require_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Require admin role."""
    if current_user.role != UserRole.ADMIN.value:
        raise ForbiddenException("Admin access required")
    return current_user


async def require_doctor(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Require doctor role."""
    if current_user.role != UserRole.DOCTOR.value:
        raise ForbiddenException("Doctor access required")
    return current_user


async def require_doctor_or_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Require doctor or admin role."""
    if current_user.role not in [UserRole.DOCTOR.value, UserRole.ADMIN.value]:
        raise ForbiddenException("Doctor or Admin access required")
    return current_user


# Pagination Dependencies
class PaginationParams:
    """Common pagination parameters."""
    
    def __init__(
        self,
        skip: int = 0,
        limit: int = 100
    ):
        if skip < 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Skip must be >= 0"
            )
        if limit < 1 or limit > 1000:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Limit must be between 1 and 1000"
            )
        
        self.skip = skip
        self.limit = limit


# Search Dependencies
class SearchParams:
    """Common search parameters."""
    
    def __init__(
        self,
        query: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ):
        if query and len(query) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Search query must be at least 2 characters"
            )
        
        if skip < 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Skip must be >= 0"
            )
        if limit < 1 or limit > 1000:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Limit must be between 1 and 1000"
            )
        
        self.query = query
        self.skip = skip
        self.limit = limit


# Rate Limiting Dependencies
async def check_rate_limit(request: Request):
    """
    Check rate limits for the current request.
    
    Note: This is a placeholder. In production, use Redis-based rate limiting.
    """
    # Implementation moved to middleware
    pass


# Resource Ownership Dependencies
def require_resource_owner(resource_user_id_field: str = "created_by"):
    """
    Dependency factory to verify user owns a resource.
    
    Args:
        resource_user_id_field: Field name containing owner user ID
        
    Example:
        def get_patient(patient: Patient = Depends(get_patient_by_id)):
            # patient ownership is checked
            return patient
    """
    async def check_ownership(
        resource: Any,
        current_user: User = Depends(get_current_active_user)
    ) -> Any:
        # Admin can access all resources
        if current_user.role == UserRole.ADMIN.value:
            return resource
        
        # Check ownership
        resource_owner_id = getattr(resource, resource_user_id_field, None)
        if resource_owner_id != current_user.id:
            raise ForbiddenException("You don't have permission to access this resource")
        
        return resource
    
    return check_ownership


# Audit Logging Dependencies
async def log_audit_event(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Log audit event for the current request.
    
    Note: Actual implementation in audit middleware.
    """
    pass


# Common Response Dependencies
class CommonQueryParams:
    """Common query parameters for list endpoints."""
    
    def __init__(
        self,
        skip: int = 0,
        limit: int = 100,
        sort_by: Optional[str] = None,
        sort_order: str = "desc"
    ):
        if skip < 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Skip must be >= 0"
            )
        if limit < 1 or limit > 1000:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Limit must be between 1 and 1000"
            )
        if sort_order not in ["asc", "desc"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Sort order must be 'asc' or 'desc'"
            )
        
        self.skip = skip
        self.limit = limit
        self.sort_by = sort_by
        self.sort_order = sort_order
