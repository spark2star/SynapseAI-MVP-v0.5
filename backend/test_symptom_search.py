#!/usr/bin/env python3
"""
Comprehensive test script for symptom search functionality.
Tests the existing /api/v1/intake/symptoms endpoint.
"""

import requests
import json
import sys
from typing import Dict, List, Any

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1/intake/symptoms"

# Test credentials - you'll need to update these with actual valid credentials
TEST_EMAIL = "test@example.com"  # Update with your test doctor email
TEST_PASSWORD = "test_password"   # Update with your test password


def get_auth_token() -> str:
    """Get authentication token for test user."""
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if response.status_code == 200:
            data = response.json()
            # Try different possible response structures
            token = data.get('access_token') or data.get('token') or data.get('data', {}).get('token')
            if token:
                return token
            else:
                print(f"⚠️  Login successful but no token found in response: {data}")
                return None
        else:
            print(f"⚠️  Login failed (status {response.status_code}): {response.text}")
            print(f"💡 Tip: Update TEST_EMAIL and TEST_PASSWORD in the script with valid credentials")
            return None
    except requests.exceptions.ConnectionError:
        print(f"❌ Could not connect to {BASE_URL}")
        print(f"💡 Make sure the backend is running: cd backend && uvicorn app.main:app --reload")
        return None
    except Exception as e:
        print(f"❌ Error getting auth token: {str(e)}")
        return None


def test_symptom_search(query: str, token: str, expected_min: int = 1) -> Dict[str, Any]:
    """Test symptom search with a specific query."""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(
            API_URL,
            params={"q": query, "limit": 50},
            headers=headers
        )
        
        result = {
            "query": query,
            "status_code": response.status_code,
            "success": response.status_code == 200,
            "results": [],
            "count": 0,
            "error": None
        }
        
        if response.status_code == 200:
            data = response.json()
            
            # Handle different response structures
            if 'data' in data and 'results' in data['data']:
                results = data['data']['results']
            elif 'results' in data:
                results = data['results']
            elif isinstance(data, list):
                results = data
            else:
                results = []
            
            result["results"] = results
            result["count"] = len(results)
            result["passed"] = result["count"] >= expected_min
        else:
            result["error"] = response.text
            result["passed"] = False
        
        return result
        
    except Exception as e:
        return {
            "query": query,
            "status_code": 0,
            "success": False,
            "results": [],
            "count": 0,
            "error": str(e),
            "passed": False
        }


def print_test_result(result: Dict[str, Any]):
    """Pretty print test result."""
    status = "✅ PASS" if result.get("passed") else "❌ FAIL"
    print(f"\n{status} - Query: '{result['query']}'")
    print(f"   Status: {result['status_code']}")
    print(f"   Results found: {result['count']}")
    
    if result["error"]:
        print(f"   Error: {result['error']}")
    
    if result["results"] and result["count"] <= 10:
        print(f"   Sample results:")
        for r in result["results"][:5]:
            name = r.get('name', 'Unknown')
            source = r.get('source', 'unknown')
            category = r.get('categories', [''])[0] if r.get('categories') else ''
            print(f"      - {name} ({source}) [{category}]")


def run_comprehensive_tests():
    """Run comprehensive symptom search tests."""
    print("=" * 70)
    print("SYMPTOM SEARCH COMPREHENSIVE TEST SUITE")
    print("=" * 70)
    
    # Get auth token
    print("\n🔐 Authenticating...")
    token = get_auth_token()
    
    if not token:
        print("\n" + "=" * 70)
        print("TESTS SKIPPED: Authentication required")
        print("=" * 70)
        print("\n💡 To run tests:")
        print("   1. Make sure backend is running: cd backend && uvicorn app.main:app --reload")
        print("   2. Update TEST_EMAIL and TEST_PASSWORD in this script")
        print("   3. Run: python test_symptom_search.py")
        return
    
    print("✅ Authenticated successfully!\n")
    
    # Define test cases
    test_cases = [
        # (query, expected_min_results)
        ("anxiety", 5),  # Should find multiple anxiety-related symptoms
        ("Anxiety", 5),  # Case insensitivity test
        ("ANXIETY", 5),  # All caps test
        ("panic", 1),    # Should find "Panic attacks"
        ("depression", 2),  # Should find depression symptoms
        ("fatigue", 1),  # Should find "Fatigue (low energy)"
        ("sleep", 3),    # Should find multiple sleep-related symptoms
        ("mood", 3),     # Should find mood-related symptoms
        ("hallucination", 2),  # Should find hallucination symptoms
        ("memory", 2),   # Should find memory-related symptoms
        ("adhd", 2),     # Should find ADHD symptoms
        ("eating", 1),   # Should find eating disorder symptoms
        ("trauma", 2),   # Should find trauma-related symptoms
        ("compulsive", 1),  # Should find compulsive symptoms
        ("social", 1),   # Should find social-related symptoms
        ("xyznotexist123", 0),  # Should return empty results
        ("a", 10),       # Short query should still work
    ]
    
    # Run tests
    results = []
    passed = 0
    failed = 0
    
    for query, expected_min in test_cases:
        result = test_symptom_search(query, token, expected_min)
        results.append(result)
        print_test_result(result)
        
        if result.get("passed"):
            passed += 1
        else:
            failed += 1
    
    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print(f"Total tests: {len(test_cases)}")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {failed} ❌")
    print(f"Success rate: {(passed / len(test_cases) * 100):.1f}%")
    
    # Database stats
    print("\n" + "=" * 70)
    print("DATABASE STATS")
    print("=" * 70)
    try:
        import psycopg2
        conn = psycopg2.connect(
            host="localhost",
            database="emr_db",
            user="emr_user",
            password="emr_password"
        )
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) FROM master_symptoms")
        total = cur.fetchone()[0]
        print(f"Total symptoms in database: {total}")
        
        cur.execute("SELECT categories::text, COUNT(*) FROM master_symptoms GROUP BY categories::text ORDER BY COUNT(*) DESC LIMIT 5")
        categories = cur.fetchall()
        print(f"\nTop 5 categories:")
        for cat, count in categories:
            print(f"   {cat}: {count} symptoms")
        
        cur.close()
        conn.close()
    except ImportError:
        print("⚠️  Install psycopg2 to see database stats: pip install psycopg2-binary")
    except Exception as e:
        print(f"⚠️  Could not fetch database stats: {str(e)}")
    
    print("=" * 70)
    
    return passed == len(test_cases)


if __name__ == "__main__":
    success = run_comprehensive_tests()
    sys.exit(0 if success else 1)
