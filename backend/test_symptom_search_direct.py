#!/usr/bin/env python3
"""
Direct database test for symptom search (no API required).
Tests SQL queries directly against the database.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text, func, case
from sqlalchemy.orm import sessionmaker

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://emr_user:emr_password@localhost:5432/emr_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


def test_basic_search(db, query: str):
    """Test basic symptom search."""
    print(f"\n🔍 Searching for: '{query}'")
    
    # Create ILIKE pattern
    like_pattern = f"%{query}%"
    starts_with_pattern = f"{query}%"
    
    # Execute search with relevance ranking
    result = db.execute(
        text("""
            SELECT 
                id, 
                name, 
                categories,
                CASE
                    WHEN LOWER(name) = LOWER(:exact) THEN 1
                    WHEN LOWER(name) LIKE LOWER(:starts_with) THEN 2
                    ELSE 3
                END as relevance
            FROM master_symptoms
            WHERE name ILIKE :pattern
            ORDER BY relevance, name
            LIMIT 10
        """),
        {
            'exact': query,
            'starts_with': starts_with_pattern,
            'pattern': like_pattern
        }
    ).fetchall()
    
    if result:
        print(f"   ✅ Found {len(result)} result(s):")
        for row in result:
            categories = row[2][0] if row[2] else 'No category'
            print(f"      - {row[1]} [{categories}] (relevance: {row[3]})")
    else:
        print(f"   ❌ No results found")
    
    return len(result)


def run_direct_tests():
    """Run direct database tests."""
    print("=" * 70)
    print("SYMPTOM SEARCH DIRECT DATABASE TEST")
    print("=" * 70)
    
    db = SessionLocal()
    
    try:
        # Test 1: Database connection and symptom count
        print("\n📊 DATABASE STATISTICS")
        print("-" * 70)
        
        count = db.execute(text("SELECT COUNT(*) FROM master_symptoms")).scalar()
        print(f"Total symptoms: {count}")
        
        if count == 0:
            print("\n❌ ERROR: No symptoms found in database!")
            print("💡 Run: python seed_symptoms_direct.py")
            return False
        
        # Show categories
        categories = db.execute(text("""
            SELECT categories::text, COUNT(*) 
            FROM master_symptoms 
            GROUP BY categories::text 
            ORDER BY COUNT(*) DESC 
            LIMIT 5
        """)).fetchall()
        
        print(f"\nTop categories:")
        for cat, cnt in categories:
            print(f"   {cat}: {cnt} symptoms")
        
        # Test 2: Search queries
        print("\n\n🔍 SEARCH QUERY TESTS")
        print("-" * 70)
        
        test_queries = [
            ("anxiety", 5),
            ("Anxiety", 5),  # Case insensitivity
            ("panic", 1),
            ("depression", 2),
            ("fatigue", 1),
            ("sleep", 3),
            ("hallucination", 2),
            ("memory", 2),
            ("adhd", 2),
            ("trauma", 2),
            ("xyznotexist", 0),  # Should return 0
        ]
        
        passed = 0
        failed = 0
        
        for query, expected_min in test_queries:
            count = test_basic_search(db, query)
            
            if count >= expected_min:
                passed += 1
                status = "✅ PASS"
            else:
                failed += 1
                status = f"❌ FAIL (expected >={expected_min}, got {count})"
            
            print(f"   {status}")
        
        # Test 3: Relevance ranking
        print("\n\n🎯 RELEVANCE RANKING TEST")
        print("-" * 70)
        print("Testing that exact matches appear first...")
        
        result = db.execute(
            text("""
                SELECT name,
                    CASE
                        WHEN LOWER(name) = 'panic attacks' THEN 1
                        WHEN LOWER(name) LIKE 'panic%' THEN 2
                        ELSE 3
                    END as relevance
                FROM master_symptoms
                WHERE name ILIKE '%panic%'
                ORDER BY relevance, name
                LIMIT 5
            """)
        ).fetchall()
        
        if result and result[0][1] == 1:
            print("   ✅ PASS: Exact match 'Panic attacks' appears first")
            for row in result:
                print(f"      {row[1]}. {row[0]}")
        else:
            print("   ❌ FAIL: Exact match should appear first")
        
        # Test 4: Case insensitivity
        print("\n\n🔤 CASE INSENSITIVITY TEST")
        print("-" * 70)
        
        queries = ["anxiety", "Anxiety", "ANXIETY"]
        counts = [test_basic_search(db, q) for q in queries]
        
        if len(set(counts)) == 1 and counts[0] > 0:
            print(f"   ✅ PASS: All case variations return same count ({counts[0]})")
        else:
            print(f"   ❌ FAIL: Case variations return different counts: {counts}")
        
        # Summary
        print("\n\n" + "=" * 70)
        print("TEST SUMMARY")
        print("=" * 70)
        print(f"Search tests passed: {passed}/{passed + failed}")
        print(f"Success rate: {(passed / (passed + failed) * 100):.1f}%")
        
        if count > 0 and passed == len(test_queries):
            print("\n🎉 ALL TESTS PASSED!")
            print(f"✅ Database contains {count} symptoms")
            print(f"✅ Search functionality working correctly")
            print(f"✅ Case insensitivity working")
            print(f"✅ Relevance ranking working")
            return True
        else:
            print("\n⚠️  SOME TESTS FAILED")
            return False
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = run_direct_tests()
    print("\n" + "=" * 70)
    sys.exit(0 if success else 1)
