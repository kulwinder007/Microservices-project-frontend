/*
  # Task Management System Database Setup

  1. Database Creation
    - Creates a new database for the task management system
    - Sets up the required extensions

  2. Tables
    - `tasks` table for storing task information
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `due_date` (timestamp with timezone)
      - `status` (text)
      - `created_at` (timestamp with timezone)
      - `updated_at` (timestamp with timezone)

  3. Indexes
    - Index on due_date for efficient date-based queries
    - Index on status for status-based filtering
*/

-- Create database (run this command separately as superuser)
CREATE DATABASE taskdb;

-- Connect to the database
\c taskdb

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample tasks (optional)
INSERT INTO tasks (title, description, due_date, status)
VALUES 
    ('Complete Project Proposal', 'Draft and submit the initial project proposal', CURRENT_TIMESTAMP + INTERVAL '1 day', 'pending'),
    ('Review Documentation', 'Review and update system documentation', CURRENT_TIMESTAMP + INTERVAL '2 days', 'pending'),
    ('Team Meeting', 'Weekly team sync meeting', CURRENT_TIMESTAMP + INTERVAL '1 day', 'pending');

-- Grant permissions (adjust username as needed)
-- GRANT ALL PRIVILEGES ON DATABASE taskdb TO username;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO username;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO username;

/*
  Instructions to run:

  1. As superuser (postgres):
     createdb taskdb
     
  2. Connect to database and run the commands:
     psql -d taskdb -f sqlcommands.sql

  3. Set up user permissions (replace 'username' with actual username):
     GRANT ALL PRIVILEGES ON DATABASE taskdb TO username;
     GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO username;
     GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO username;
*/