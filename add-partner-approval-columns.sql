-- Migration: Add Partner Approval Columns
-- Run this in Supabase SQL Editor to add approval functionality

-- Add approval columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approved BOOLEAN, -- NULL = pending, TRUE = approved, FALSE = rejected
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS application_notes TEXT;

-- Auto-approve existing donors and admins (they don't need approval)
UPDATE users 
SET approved = TRUE 
WHERE role IN ('donor', 'admin', 'volunteer');

-- Set existing partners to pending (NULL) if not already set
UPDATE users 
SET approved = NULL 
WHERE role = 'partner' AND approved IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_approved ON users(approved);
CREATE INDEX IF NOT EXISTS idx_users_role_approved ON users(role, approved);

-- Add comments
COMMENT ON COLUMN users.approved IS 'NULL = pending review, TRUE = approved, FALSE = rejected';
COMMENT ON COLUMN users.approved_at IS 'Timestamp when partner was approved/rejected';
COMMENT ON COLUMN users.approved_by IS 'Admin user who approved/rejected the application';
COMMENT ON COLUMN users.rejection_reason IS 'Reason provided if application was rejected';
COMMENT ON COLUMN users.application_notes IS 'Additional notes from partner application';
