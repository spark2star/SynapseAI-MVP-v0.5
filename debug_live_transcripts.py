#!/usr/bin/env python3
"""
Live Transcripts Debugging Script
Comprehensive analysis of why live transcripts are not working
"""

import asyncio
import json
import sys
import os
import subprocess
import requests
import websockets
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class LiveTranscriptDebugger:
    """Comprehensive debugger for live transcript issues"""
    
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.ws_url = "ws://localhost:8000"
        self.results = {}
        
    async def run_all_tests(self):
        """Run comprehensive debugging tests"""
        logger.info("🔍 Starting Live Transcript Debugging...")
        logger.info("=" * 60)
        
        # Test 1: Check if backend is running
        await self.test_backend_health()
        
        # Test 2: Check database connectivity
        await self.test_database_connection()
        
        # Test 3: Check API endpoints
        await self.test_api_endpoints()
        
        # Test 4: Check WebSocket connectivity
        await self.test_websocket_connection()
        
        # Test 5: Check Google Cloud STT configuration
        await self.test_stt_configuration()
        
        # Test 6: Check environment variables
        await self.test_environment_config()
        
        # Test 7: Check frontend configuration
        await self.test_frontend_config()
        
        # Generate report
        await self.generate_report()
        
    async def test_backend_health(self):
        """Test if backend server is running and healthy"""
        logger.info("1️⃣  Testing Backend Health...")
        
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                self.results['backend_health'] = {
                    'status': 'PASS',
                    'version': data.get('version'),
                    'environment': data.get('environment'),
                    'database': data.get('database', {}).get('status')
                }
                logger.info("✅ Backend is running and healthy")
            else:
                self.results['backend_health'] = {
                    'status': 'FAIL',
                    'error': f"HTTP {response.status_code}"
                }
                logger.error(f"❌ Backend health check failed: HTTP {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            self.results['backend_health'] = {
                'status': 'FAIL',
                'error': 'Connection refused - Backend not running'
            }
            logger.error("❌ Backend is not running! Start with: cd backend && python -m uvicorn app.main:app --reload")
            
        except Exception as e:
            self.results['backend_health'] = {
                'status': 'FAIL',
                'error': str(e)
            }
            logger.error(f"❌ Backend health check error: {e}")
    
    async def test_database_connection(self):
        """Test database connectivity"""
        logger.info("\n2️⃣  Testing Database Connection...")
        
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                db_status = data.get('database', {}).get('status')
                
                if db_status == 'healthy':
                    self.results['database'] = {'status': 'PASS'}
                    logger.info("✅ Database connection is healthy")
                else:
                    self.results['database'] = {
                        'status': 'FAIL', 
                        'error': 'Database unhealthy'
                    }
                    logger.error("❌ Database connection is unhealthy")
            else:
                self.results['database'] = {
                    'status': 'UNKNOWN',
                    'error': 'Cannot determine database status'
                }
                
        except Exception as e:
            self.results['database'] = {
                'status': 'FAIL',
                'error': str(e)
            }
            logger.error(f"❌ Database check error: {e}")
    
    async def test_api_endpoints(self):
        """Test critical API endpoints"""
        logger.info("\n3️⃣  Testing API Endpoints...")
        
        endpoints = [
            '/api/v1/auth/test',
            '/api/v1/patients',
            '/api/v1/reports/health',
            '/api/v1/health'
        ]
        
        endpoint_results = {}
        
        for endpoint in endpoints:
            try:
                response = requests.get(f"{self.base_url}{endpoint}", timeout=5)
                if response.status_code in [200, 401]:  # 401 is OK for auth endpoints
                    endpoint_results[endpoint] = 'PASS'
                    logger.info(f"✅ {endpoint} - Available")
                else:
                    endpoint_results[endpoint] = f'FAIL - HTTP {response.status_code}'
                    logger.warning(f"⚠️  {endpoint} - HTTP {response.status_code}")
                    
            except requests.exceptions.ConnectionError:
                endpoint_results[endpoint] = 'FAIL - Connection Error'
                logger.error(f"❌ {endpoint} - Not reachable")
            except Exception as e:
                endpoint_results[endpoint] = f'FAIL - {str(e)}'
                logger.error(f"❌ {endpoint} - Error: {e}")
        
        self.results['api_endpoints'] = endpoint_results
    
    async def test_websocket_connection(self):
        """Test WebSocket connectivity"""
        logger.info("\n4️⃣  Testing WebSocket Connection...")
        
        try:
            # Test WebSocket connection to a mock session
            test_session_id = "test-session-123"
            ws_url = f"{self.ws_url}/ws/consultation/{test_session_id}"
            
            async with websockets.connect(ws_url, timeout=5) as websocket:
                # Send a test message
                test_message = {"type": "ping", "timestamp": datetime.now().isoformat()}
                await websocket.send(json.dumps(test_message))
                
                # Try to receive a response (with timeout)
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=3.0)
                    self.results['websocket'] = {
                        'status': 'PASS',
                        'response': response
                    }
                    logger.info("✅ WebSocket connection successful")
                    
                except asyncio.TimeoutError:
                    self.results['websocket'] = {
                        'status': 'PARTIAL',
                        'note': 'Connected but no response (expected for test session)'
                    }
                    logger.info("✅ WebSocket connected (no response expected)")
                    
        except websockets.exceptions.WebSocketException as e:
            self.results['websocket'] = {
                'status': 'FAIL',
                'error': f'WebSocket error: {str(e)}'
            }
            logger.error(f"❌ WebSocket connection failed: {e}")
            
        except Exception as e:
            self.results['websocket'] = {
                'status': 'FAIL',
                'error': str(e)
            }
            logger.error(f"❌ WebSocket test error: {e}")
    
    async def test_stt_configuration(self):
        """Test Google Cloud STT configuration"""
        logger.info("\n5️⃣  Testing STT Configuration...")
        
        # Check if credentials file exists
        cred_files = ['gcp-credentials.json', 'backend/gcp-credentials.json']
        cred_found = False
        
        for cred_file in cred_files:
            if os.path.exists(cred_file):
                cred_found = True
                file_size = os.path.getsize(cred_file)
                if file_size > 100:  # Reasonable size check
                    logger.info(f"✅ Found credentials file: {cred_file} ({file_size} bytes)")
                else:
                    logger.warning(f"⚠️  Credentials file too small: {cred_file}")
                break
        
        if not cred_found:
            logger.error("❌ Google Cloud credentials file not found")
            logger.info("   Create gcp-credentials.json with your service account key")
        
        # Check environment variables
        env_vars = ['GOOGLE_APPLICATION_CREDENTIALS']
        env_status = {}
        
        for var in env_vars:
            value = os.getenv(var)
            if value:
                env_status[var] = 'SET'
                logger.info(f"✅ {var} is set")
            else:
                env_status[var] = 'NOT_SET'
                logger.warning(f"⚠️  {var} not set")
        
        self.results['stt_config'] = {
            'credentials_found': cred_found,
            'environment_vars': env_status
        }
    
    async def test_environment_config(self):
        """Test environment configuration"""
        logger.info("\n6️⃣  Testing Environment Configuration...")
        
        required_env_vars = [
            'DATABASE_URL',
            'REDIS_URL', 
            'SECRET_KEY',
            'ENCRYPTION_KEY'
        ]
        
        env_status = {}
        
        for var in required_env_vars:
            value = os.getenv(var)
            if value:
                env_status[var] = 'SET'
                logger.info(f"✅ {var} is configured")
            else:
                env_status[var] = 'MISSING'
                logger.error(f"❌ {var} is missing")
        
        self.results['environment'] = env_status
        
        # Check if .env file exists
        env_files = ['.env', 'backend/.env']
        env_file_found = False
        
        for env_file in env_files:
            if os.path.exists(env_file):
                env_file_found = True
                logger.info(f"✅ Found environment file: {env_file}")
                break
        
        if not env_file_found:
            logger.error("❌ No .env file found")
            logger.info("   Create a .env file with required environment variables")
    
    async def test_frontend_config(self):
        """Test frontend configuration"""
        logger.info("\n7️⃣  Testing Frontend Configuration...")
        
        frontend_checks = {}
        
        # Check if frontend is running
        try:
            response = requests.get("http://localhost:3000", timeout=5)
            if response.status_code == 200:
                frontend_checks['running'] = 'PASS'
                logger.info("✅ Frontend is running on port 3000")
            else:
                frontend_checks['running'] = f'FAIL - HTTP {response.status_code}'
                logger.warning(f"⚠️  Frontend responded with {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            frontend_checks['running'] = 'FAIL - Not running'
            logger.error("❌ Frontend is not running on port 3000")
            logger.info("   Start with: cd frontend && npm run dev")
            
        # Check package.json dependencies
        package_json_path = 'frontend/package.json'
        if os.path.exists(package_json_path):
            with open(package_json_path, 'r') as f:
                package_data = json.load(f)
                dependencies = package_data.get('dependencies', {})
                
                required_deps = ['react', 'next', '@heroicons/react', 'react-hot-toast']
                missing_deps = [dep for dep in required_deps if dep not in dependencies]
                
                if not missing_deps:
                    frontend_checks['dependencies'] = 'PASS'
                    logger.info("✅ All required frontend dependencies found")
                else:
                    frontend_checks['dependencies'] = f'MISSING: {missing_deps}'
                    logger.error(f"❌ Missing dependencies: {missing_deps}")
        else:
            frontend_checks['package_json'] = 'NOT_FOUND'
            logger.error("❌ Frontend package.json not found")
        
        self.results['frontend'] = frontend_checks
    
    async def generate_report(self):
        """Generate comprehensive debugging report"""
        logger.info("\n" + "=" * 60)
        logger.info("📋 LIVE TRANSCRIPTS DEBUGGING REPORT")
        logger.info("=" * 60)
        
        # Count issues
        total_tests = len(self.results)
        passed_tests = sum(1 for result in self.results.values() 
                          if isinstance(result, dict) and result.get('status') == 'PASS')
        failed_tests = sum(1 for result in self.results.values() 
                          if isinstance(result, dict) and result.get('status') == 'FAIL')
        
        logger.info(f"Tests Run: {total_tests} | Passed: {passed_tests} | Failed: {failed_tests}")
        logger.info("")
        
        # Detailed results
        for test_name, result in self.results.items():
            logger.info(f"🔍 {test_name.upper()}:")
            if isinstance(result, dict):
                for key, value in result.items():
                    logger.info(f"   {key}: {value}")
            else:
                logger.info(f"   Result: {result}")
            logger.info("")
        
        # Provide specific recommendations
        logger.info("🚀 RECOMMENDATIONS:")
        logger.info("=" * 30)
        
        if self.results.get('backend_health', {}).get('status') == 'FAIL':
            logger.info("1. START BACKEND SERVER:")
            logger.info("   cd backend")
            logger.info("   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
            logger.info("")
        
        if self.results.get('frontend', {}).get('running') != 'PASS':
            logger.info("2. START FRONTEND SERVER:")
            logger.info("   cd frontend")
            logger.info("   npm install")
            logger.info("   npm run dev")
            logger.info("")
        
        env_issues = any(status == 'MISSING' for status in 
                        self.results.get('environment', {}).values())
        if env_issues:
            logger.info("3. CONFIGURE ENVIRONMENT:")
            logger.info("   Create backend/.env file with:")
            logger.info("   DATABASE_URL=postgresql://...")
            logger.info("   REDIS_URL=redis://localhost:6379")
            logger.info("   SECRET_KEY=your-secret-key")
            logger.info("   ENCRYPTION_KEY=your-32-char-key")
            logger.info("")
        
        if not self.results.get('stt_config', {}).get('credentials_found'):
            logger.info("4. SETUP GOOGLE CLOUD STT:")
            logger.info("   Download service account key from Google Cloud Console")
            logger.info("   Save as 'gcp-credentials.json' in project root")
            logger.info("   Enable Speech-to-Text API in your GCP project")
            logger.info("")
        
        logger.info("🎯 QUICK START CHECKLIST:")
        logger.info("□ Backend running on localhost:8000")
        logger.info("□ Frontend running on localhost:3000") 
        logger.info("□ Database connected and healthy")
        logger.info("□ Environment variables configured")
        logger.info("□ Google Cloud credentials available")
        logger.info("□ WebSocket endpoints accessible")
        logger.info("")
        
        logger.info("For detailed setup instructions, see GETTING_STARTED.md")

async def main():
    """Main debugging function"""
    debugger = LiveTranscriptDebugger()
    await debugger.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())
