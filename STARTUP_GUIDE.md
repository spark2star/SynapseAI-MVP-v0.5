# SynapseAI EMR - Single File Startup Guide

## 🚀 Quick Start

### Start Everything with One Command
```bash
./start-all.sh
```

### Stop Everything with One Command  
```bash
./stop-all.sh
```

## 📋 What the Startup Script Does

The `start-all.sh` script is a comprehensive orchestrator that handles:

### 1. **Prerequisites Check** ✅
- Verifies Docker is installed and running
- Checks for Python 3.11 and Node.js
- Ensures all required tools are available

### 2. **Infrastructure Setup** 🏗️
- Starts PostgreSQL database (port 5432)
- Starts Redis cache (port 6379)
- Waits for services to be fully ready

### 3. **Backend Setup** 🖥️
- Creates Python 3.11 virtual environment (if needed)
- Installs all Python dependencies
- Sets up environment variables
- Runs database migrations
- Starts FastAPI server on port 8000 with hot reload

### 4. **Frontend Setup** 🌐
- Installs Node.js dependencies
- Starts Next.js development server on port 3001
- Enables hot reload for development

### 5. **Health Monitoring** 🔍
- Performs comprehensive health checks
- Monitors all services continuously
- Provides real-time status updates

## 🎯 Access Points

Once started, you can access:

| Service | URL | Description |
|---------|-----|-------------|
| **Main App** | http://localhost:3001 | Frontend application |
| **API** | http://localhost:8000 | Backend REST API |
| **API Docs** | http://localhost:8000/docs | Interactive API documentation |
| **Database** | localhost:5432 | PostgreSQL (emr_user/emr_password) |
| **Cache** | localhost:6379 | Redis cache |

## 🔐 Demo Credentials

- **Email:** doctor@demo.com
- **Password:** password123

## 📊 Service Status

The script provides real-time monitoring of:
- ✅ PostgreSQL Database
- ✅ Redis Cache  
- ✅ FastAPI Backend
- ✅ Next.js Frontend

## 📄 Logs

Logs are automatically created:
- Backend: `backend.log`
- Frontend: `frontend.log`

## 🛑 Graceful Shutdown

Press `Ctrl+C` in the terminal running the script to:
- Stop all background processes
- Shutdown Docker containers
- Clean up resources
- Remove log files

## 🔧 Advanced Usage

### Environment Variables

The script automatically sets these development variables:
- `DATABASE_URL`: PostgreSQL connection
- `REDIS_URL`: Redis connection  
- `ENVIRONMENT`: development
- `DEBUG`: true
- JWT and encryption keys for development

### Customization

You can modify the script to:
- Change port numbers
- Add additional services
- Customize environment variables
- Add deployment configurations

## 🚨 Troubleshooting

### Docker Issues
```bash
# Start Docker Desktop
open -a Docker

# Or check Docker status
docker info
```

### Port Conflicts
If ports are already in use:
```bash
# Check what's using the ports
lsof -i :3001  # Frontend
lsof -i :8000  # Backend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
```

### Clean Restart
```bash
./stop-all.sh  # Stop everything
./start-all.sh # Start everything fresh
```

## 💡 Features

- **🔄 Hot Reload**: Both frontend and backend auto-reload on changes
- **📊 Health Monitoring**: Continuous service monitoring
- **🎯 One Command**: Start entire stack with single command
- **🛡️ Error Handling**: Graceful error handling and recovery
- **📝 Logging**: Comprehensive logging for debugging
- **🧹 Clean Shutdown**: Proper cleanup on exit

## 📝 Development Workflow

1. **Start Development:**
   ```bash
   ./start-all.sh
   ```

2. **Make Changes:**
   - Edit backend code → Auto-reload
   - Edit frontend code → Auto-reload

3. **Stop Development:**
   - Press `Ctrl+C` or run `./stop-all.sh`

This single-file approach makes development much more efficient and eliminates the need to manage multiple terminal windows and service startup sequences.

