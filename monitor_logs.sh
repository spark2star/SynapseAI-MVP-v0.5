#!/bin/bash

# Monitor both backend and frontend logs simultaneously
echo "🔍 MONITORING BOTH BACKEND AND FRONTEND LOGS"
echo "================================================"
echo "Press Ctrl+C to stop monitoring"
echo ""

# Use tail to monitor both log files
tail -f backend/backend.log frontend/frontend.log
