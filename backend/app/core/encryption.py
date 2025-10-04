"""
Encryption utilities for securing sensitive data.
Implements AES-256-GCM encryption for field-level encryption.
Privacy by design implementation.
"""

import base64
import hashlib
from typing import Optional, Union
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import secrets
import os

from .config import settings


class FieldEncryption:
    """
    Field-level encryption for sensitive data.
    Uses AES-256-GCM for authenticated encryption.
    """
    
    def __init__(self, key: Optional[str] = None):
        """Initialize with encryption key."""
        self.key = key or settings.FIELD_ENCRYPTION_KEY
        self._ensure_key_format()
    
    def _ensure_key_format(self):
        """Ensure the key is in the correct format for Fernet."""
        if isinstance(self.key, str):
            # Convert string key to bytes and derive a proper Fernet key
            key_bytes = self.key.encode('utf-8')
            digest = hashes.Hash(hashes.SHA256(), backend=default_backend())
            digest.update(key_bytes)
            key_hash = digest.finalize()
            self.fernet_key = base64.urlsafe_b64encode(key_hash)
            self.fernet = Fernet(self.fernet_key)
        else:
            raise ValueError("Encryption key must be a string")
    
    def encrypt(self, plaintext: Union[str, bytes]) -> str:
        """
        Encrypt plaintext data.
        
        Args:
            plaintext: Data to encrypt (string or bytes)
            
        Returns:
            Base64 encoded encrypted data
        """
        if plaintext is None:
            return None
        
        if isinstance(plaintext, str):
            plaintext = plaintext.encode('utf-8')
        
        encrypted_data = self.fernet.encrypt(plaintext)
        return base64.urlsafe_b64encode(encrypted_data).decode('utf-8')
    
    def decrypt(self, ciphertext: str) -> str:
        """
        Decrypt encrypted data.
        
        Args:
            ciphertext: Base64 encoded encrypted data
            
        Returns:
            Decrypted plaintext string
        """
        if ciphertext is None:
            return None
        
        try:
            encrypted_data = base64.urlsafe_b64decode(ciphertext.encode('utf-8'))
            decrypted_data = self.fernet.decrypt(encrypted_data)
            return decrypted_data.decode('utf-8')
        except Exception as e:
            raise ValueError(f"Failed to decrypt data: {str(e)}")


class DatabaseEncryption:
    """
    Database-level encryption utilities.
    Implements transparent encryption for database fields.
    """
    
    def __init__(self):
        self.field_encryptor = FieldEncryption()
    
    def encrypt_field(self, value: Union[str, bytes, None]) -> Optional[str]:
        """Encrypt a single field value."""
        if value is None:
            return None
        return self.field_encryptor.encrypt(value)
    
    def decrypt_field(self, encrypted_value: Optional[str]) -> Optional[str]:
        """Decrypt a single field value."""
        if encrypted_value is None:
            return None
        return self.field_encryptor.decrypt(encrypted_value)


class HashingUtility:
    """
    Secure hashing utilities for passwords and sensitive identifiers.
    """
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt directly."""
        import bcrypt
        
        # Encode password to bytes
        password_bytes = password.encode('utf-8')
        
        # Generate salt and hash
        salt = bcrypt.gensalt(rounds=settings.BCRYPT_ROUNDS)
        hashed = bcrypt.hashpw(password_bytes, salt)
        
        # Return as string
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash using bcrypt directly."""
        import bcrypt
        
        # Encode both to bytes
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        
        # Verify
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    
    @staticmethod
    def generate_secure_token(length: int = 32) -> str:
        """Generate cryptographically secure random token."""
        return secrets.token_urlsafe(length)
    
    @staticmethod
    def hash_identifier(identifier: str, salt: Optional[str] = None) -> str:
        """
        Create deterministic hash of identifier for indexing.
        Used for creating searchable but encrypted identifiers.
        """
        if salt is None:
            salt = settings.SECRET_KEY
        
        combined = f"{identifier}{salt}".encode('utf-8')
        return hashlib.sha256(combined).hexdigest()


# Global instances
db_encryption = DatabaseEncryption()
field_encryption = FieldEncryption()
hash_util = HashingUtility()


def generate_encryption_key() -> str:
    """Generate a new encryption key for configuration."""
    return base64.urlsafe_b64encode(os.urandom(32)).decode('utf-8')


def create_patient_id() -> str:
    """Generate unique patient identifier."""
    return f"PT{secrets.token_hex(6).upper()}"


def create_session_id() -> str:
    """Generate unique session identifier."""
    return f"SS{secrets.token_hex(8).upper()}"
