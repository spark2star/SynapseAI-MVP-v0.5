"""
Manual test script for report signing functionality.
Tests the ReportSigningService and signing endpoint.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.services.report_signing_service import ReportSigningService


def test_signature_hash_generation():
    """Test SHA-256 hash generation."""
    print("Testing signature hash generation...")
    
    # Test with sample content
    content = "This is a sample medical report content."
    hash_result = ReportSigningService.generate_signature_hash(content)
    
    print(f"✓ Generated hash: {hash_result}")
    print(f"✓ Hash length: {len(hash_result)} characters")
    
    # Verify it's a valid SHA-256 hash (64 hex characters)
    assert len(hash_result) == 64, "Hash should be 64 characters"
    assert all(c in '0123456789abcdef' for c in hash_result), "Hash should be hexadecimal"
    
    # Test consistency
    hash_result2 = ReportSigningService.generate_signature_hash(content)
    assert hash_result == hash_result2, "Same content should produce same hash"
    
    # Test different content produces different hash
    different_content = "Different medical report content."
    different_hash = ReportSigningService.generate_signature_hash(different_content)
    assert hash_result != different_hash, "Different content should produce different hash"
    
    print("✓ All hash generation tests passed!\n")


def test_empty_content_handling():
    """Test handling of empty content."""
    print("Testing empty content handling...")
    
    try:
        ReportSigningService.generate_signature_hash("")
        print("✗ Should have raised ValueError for empty content")
        sys.exit(1)
    except ValueError as e:
        print(f"✓ Correctly raised ValueError: {e}\n")


def main():
    """Run all tests."""
    print("=" * 60)
    print("Report Signing Service Tests")
    print("=" * 60 + "\n")
    
    try:
        test_signature_hash_generation()
        test_empty_content_handling()
        
        print("=" * 60)
        print("✓ All tests passed successfully!")
        print("=" * 60)
        
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
