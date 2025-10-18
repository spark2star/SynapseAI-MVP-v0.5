#!/usr/bin/env python3
"""
Manual testing script for Dashboard Redesign
Tests all dashboard functionality according to task 5 requirements
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8080"
API_BASE = f"{BASE_URL}/api/v1"

# ANSI color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

class DashboardTester:
    def __init__(self):
        self.token = None
        self.test_results = []
        
    def log_test(self, test_name, passed, message=""):
        """Log test result"""
        status = f"{GREEN}✓ PASS{RESET}" if passed else f"{RED}✗ FAIL{RESET}"
        print(f"{status} - {test_name}")
        if message:
            print(f"  {message}")
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "message": message
        })
    
    def authenticate(self):
        """Authenticate and get token"""
        print(f"\n{BLUE}=== Authentication ==={RESET}")
        
        # Try to login with demo doctor credentials
        login_data = {
            "email": "doctor@example.com",
            "password": "doctor123"
        }
        
        try:
            response = requests.post(
                f"{API_BASE}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "data" in data:
                    self.token = data["data"].get("access_token")
                    self.log_test("Authentication", True, f"Logged in successfully")
                    return True
            
            self.log_test("Authentication", False, f"Login failed: {response.text}")
            return False
            
        except Exception as e:
            self.log_test("Authentication", False, f"Error: {str(e)}")
            return False
    
    def get_headers(self):
        """Get headers with auth token"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}"
        }
    
    def test_dashboard_endpoint_exists(self):
        """Test 1: Dashboard endpoint exists and responds"""
        print(f"\n{BLUE}=== Test 1: Dashboard Endpoint Availability ==={RESET}")
        
        try:
            response = requests.get(
                f"{API_BASE}/dashboard/stats",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    self.log_test("Dashboard endpoint responds", True)
                    return data.get("data")
                else:
                    self.log_test("Dashboard endpoint responds", False, f"Unexpected response: {data}")
                    return None
            else:
                self.log_test("Dashboard endpoint responds", False, f"Status code: {response.status_code}")
                return None
                
        except Exception as e:
            self.log_test("Dashboard endpoint responds", False, f"Error: {str(e)}")
            return None
    
    def test_response_structure(self, data):
        """Test 2: Verify response structure"""
        print(f"\n{BLUE}=== Test 2: Response Structure ==={RESET}")
        
        if not data:
            self.log_test("Response structure", False, "No data received")
            return False
        
        required_fields = [
            "pending_intake_patients",
            "needs_attention_patients_count",
            "pending_reports_count",
            "active_patients_count",
            "sessions_this_week"
        ]
        
        all_present = True
        for field in required_fields:
            if field in data:
                self.log_test(f"Field '{field}' present", True)
            else:
                self.log_test(f"Field '{field}' present", False)
                all_present = False
        
        return all_present
    
    def test_pending_intake_patients(self, data):
        """Test 3: Pending intake patients structure"""
        print(f"\n{BLUE}=== Test 3: Pending Intake Patients ==={RESET}")
        
        patients = data.get("pending_intake_patients", [])
        
        if isinstance(patients, list):
            self.log_test("Pending intake patients is a list", True, f"Count: {len(patients)}")
            
            if len(patients) > 0:
                patient = patients[0]
                required_fields = ["id", "full_name", "registered_at"]
                
                for field in required_fields:
                    if field in patient:
                        self.log_test(f"Patient has '{field}' field", True, f"Value: {patient[field]}")
                    else:
                        self.log_test(f"Patient has '{field}' field", False)
            else:
                self.log_test("Pending intake patients data", True, "Empty list (valid state)")
        else:
            self.log_test("Pending intake patients is a list", False, f"Type: {type(patients)}")
    
    def test_needs_attention_count(self, data):
        """Test 4: Needs attention count"""
        print(f"\n{BLUE}=== Test 4: Needs Attention Count ==={RESET}")
        
        count = data.get("needs_attention_patients_count")
        
        if isinstance(count, int) and count >= 0:
            self.log_test("Needs attention count is valid", True, f"Count: {count}")
        else:
            self.log_test("Needs attention count is valid", False, f"Value: {count}")
    
    def test_pending_reports_count(self, data):
        """Test 5: Pending reports count"""
        print(f"\n{BLUE}=== Test 5: Pending Reports Count ==={RESET}")
        
        count = data.get("pending_reports_count")
        
        if isinstance(count, int) and count >= 0:
            self.log_test("Pending reports count is valid", True, f"Count: {count}")
        else:
            self.log_test("Pending reports count is valid", False, f"Value: {count}")
    
    def test_active_patients_count(self, data):
        """Test 6: Active patients count"""
        print(f"\n{BLUE}=== Test 6: Active Patients Count ==={RESET}")
        
        count = data.get("active_patients_count")
        
        if isinstance(count, int) and count >= 0:
            self.log_test("Active patients count is valid", True, f"Count: {count}")
        else:
            self.log_test("Active patients count is valid", False, f"Value: {count}")
    
    def test_weekly_sessions(self, data):
        """Test 7: Weekly sessions data"""
        print(f"\n{BLUE}=== Test 7: Weekly Sessions Data ==={RESET}")
        
        sessions = data.get("sessions_this_week", [])
        
        if isinstance(sessions, list):
            self.log_test("Weekly sessions is a list", True, f"Count: {len(sessions)}")
            
            expected_days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            
            if len(sessions) == 7:
                self.log_test("Weekly sessions has 7 days", True)
                
                for i, session in enumerate(sessions):
                    if "day" in session and "count" in session:
                        day = session["day"]
                        count = session["count"]
                        
                        if day == expected_days[i]:
                            self.log_test(f"Day {i+1} is '{day}'", True, f"Count: {count}")
                        else:
                            self.log_test(f"Day {i+1} is '{day}'", False, f"Expected: {expected_days[i]}")
                    else:
                        self.log_test(f"Day {i+1} structure", False, "Missing 'day' or 'count' field")
            else:
                self.log_test("Weekly sessions has 7 days", False, f"Found: {len(sessions)}")
        else:
            self.log_test("Weekly sessions is a list", False, f"Type: {type(sessions)}")
    
    def test_response_time(self):
        """Test 8: API response time"""
        print(f"\n{BLUE}=== Test 8: Performance - Response Time ==={RESET}")
        
        try:
            start_time = datetime.now()
            response = requests.get(
                f"{API_BASE}/dashboard/stats",
                headers=self.get_headers()
            )
            end_time = datetime.now()
            
            response_time_ms = (end_time - start_time).total_seconds() * 1000
            
            if response_time_ms < 500:
                self.log_test("Response time < 500ms", True, f"Time: {response_time_ms:.2f}ms")
            elif response_time_ms < 1000:
                self.log_test("Response time < 500ms", False, f"Time: {response_time_ms:.2f}ms (acceptable but not optimal)")
            else:
                self.log_test("Response time < 500ms", False, f"Time: {response_time_ms:.2f}ms (too slow)")
                
        except Exception as e:
            self.log_test("Response time test", False, f"Error: {str(e)}")
    
    def test_authentication_required(self):
        """Test 9: Authentication is required"""
        print(f"\n{BLUE}=== Test 9: Security - Authentication Required ==={RESET}")
        
        try:
            response = requests.get(f"{API_BASE}/dashboard/stats")
            
            if response.status_code == 401 or response.status_code == 403:
                self.log_test("Authentication required", True, "Endpoint properly secured")
            else:
                self.log_test("Authentication required", False, f"Status code: {response.status_code}")
                
        except Exception as e:
            self.log_test("Authentication required", False, f"Error: {str(e)}")
    
    def test_error_handling(self):
        """Test 10: Error handling with invalid token"""
        print(f"\n{BLUE}=== Test 10: Error Handling ==={RESET}")
        
        try:
            response = requests.get(
                f"{API_BASE}/dashboard/stats",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": "Bearer invalid_token_12345"
                }
            )
            
            if response.status_code in [401, 403]:
                self.log_test("Invalid token rejected", True, "Proper error handling")
            else:
                self.log_test("Invalid token rejected", False, f"Status code: {response.status_code}")
                
        except Exception as e:
            self.log_test("Error handling test", False, f"Error: {str(e)}")
    
    def print_summary(self):
        """Print test summary"""
        print(f"\n{BLUE}{'='*60}{RESET}")
        print(f"{BLUE}=== TEST SUMMARY ==={RESET}")
        print(f"{BLUE}{'='*60}{RESET}\n")
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["passed"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"{GREEN}Passed: {passed_tests}{RESET}")
        print(f"{RED}Failed: {failed_tests}{RESET}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%\n")
        
        if failed_tests > 0:
            print(f"{RED}Failed Tests:{RESET}")
            for result in self.test_results:
                if not result["passed"]:
                    print(f"  - {result['test']}")
                    if result["message"]:
                        print(f"    {result['message']}")
        
        return failed_tests == 0
    
    def run_all_tests(self):
        """Run all dashboard tests"""
        print(f"\n{BLUE}{'='*60}{RESET}")
        print(f"{BLUE}=== DASHBOARD MANUAL TESTING SUITE ==={RESET}")
        print(f"{BLUE}{'='*60}{RESET}")
        
        # Authenticate first
        if not self.authenticate():
            print(f"\n{RED}Cannot proceed without authentication{RESET}")
            return False
        
        # Test dashboard endpoint
        dashboard_data = self.test_dashboard_endpoint_exists()
        
        if dashboard_data:
            # Test response structure
            self.test_response_structure(dashboard_data)
            
            # Test individual data components
            self.test_pending_intake_patients(dashboard_data)
            self.test_needs_attention_count(dashboard_data)
            self.test_pending_reports_count(dashboard_data)
            self.test_active_patients_count(dashboard_data)
            self.test_weekly_sessions(dashboard_data)
        
        # Test performance
        self.test_response_time()
        
        # Test security
        self.test_authentication_required()
        self.test_error_handling()
        
        # Print summary
        return self.print_summary()


def main():
    """Main test execution"""
    tester = DashboardTester()
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
