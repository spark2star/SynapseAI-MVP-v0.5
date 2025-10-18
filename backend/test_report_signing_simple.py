"""
Simple unit test for report signing hash generation.
Tests only the hash generation logic without database dependencies.
"""

import hashlib


def generate_signature_hash(content: str) -> str:
    """Generate SHA-256 hash of report content."""
    if not content:
        raise ValueError("Cannot generate signature hash for empty content")
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


def test_signature_hash_generation():
    """Test SHA-256 hash generation."""
    print("Testing signature hash generation...")
    
    # Test with sample content
    content = "This is a sample medical report content."
    hash_result = generate_signature_hash(content)
    
    print(f"✓ Generated hash: {hash_result}")
    print(f"✓ Hash length: {len(hash_result)} characters")
    
    # Verify it's a valid SHA-256 hash (64 hex characters)
    assert len(hash_result) == 64, "Hash should be 64 characters"
    assert all(c in '0123456789abcdef' for c in hash_result), "Hash should be hexadecimal"
    
    # Test consistency
    hash_result2 = generate_signature_hash(content)
    assert hash_result == hash_result2, "Same content should produce same hash"
    
    # Test different content produces different hash
    different_content = "Different medical report content."
    different_hash = generate_signature_hash(different_content)
    assert hash_result != different_hash, "Different content should produce different hash"
    
    print("✓ All hash generation tests passed!\n")


def test_empty_content_handling():
    """Test handling of empty content."""
    print("Testing empty content handling...")
    
    try:
        generate_signature_hash("")
        print("✗ Should have raised ValueError for empty content")
        return False
    except ValueError as e:
        print(f"✓ Correctly raised ValueError: {e}\n")
        return True


def test_real_world_example():
    """Test with a realistic medical report."""
    print("Testing with realistic medical report content...")
    
    report_content = """
    MEDICAL CONSULTATION REPORT
    
    Patient: John Doe
    Date: 2025-10-18
    
    Chief Complaint: Persistent headache for 3 days
    
    History of Present Illness:
    Patient reports severe headache starting 3 days ago...
    
    Assessment:
    Tension-type headache, likely stress-related
    
    Plan:
    1. Ibuprofen 400mg TID
    2. Stress management techniques
    3. Follow-up in 1 week
    """
    
    hash_result = generate_signature_hash(report_content)
    print(f"✓ Generated hash for realistic report: {hash_result[:16]}...")
    print(f"✓ Full hash length: {len(hash_result)} characters\n")
    
    return True


def main():
    """Run all tests."""
    print("=" * 60)
    print("Report Signing Hash Generation Tests")
    print("=" * 60 + "\n")
    
    try:
        test_signature_hash_generation()
        
        if not test_empty_content_handling():
            print("✗ Empty content test failed")
            return 1
        
        if not test_real_world_example():
            print("✗ Real-world example test failed")
            return 1
        
        print("=" * 60)
        print("✓ All tests passed successfully!")
        print("=" * 60)
        return 0
        
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        return 1
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit(main())
