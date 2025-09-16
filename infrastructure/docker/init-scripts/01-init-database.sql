-- Database initialization script for EMR system
-- This script sets up the initial database configuration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create additional schemas if needed
-- CREATE SCHEMA IF NOT EXISTS audit;
-- CREATE SCHEMA IF NOT EXISTS analytics;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE emr_db TO emr_user;
GRANT USAGE ON SCHEMA public TO emr_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO emr_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO emr_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO emr_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO emr_user;
