-- =====================================================
-- ADMIN SETUP & APPROVAL SYSTEM
-- =====================================================
-- Run this to set up admin approval system
-- =====================================================

-- =====================================================
-- STEP 1: ADD APPROVAL FIELDS TO USERS TABLE
-- =====================================================

-- Add approval-related columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS application_notes TEXT;

-- =====================================================
-- STEP 2: SET DEFAULT APPROVAL STATUS
-- =====================================================

-- Auto-approve all existing users
UPDATE users 
SET approved = true, 
    approved_at = created_at
WHERE approved IS NULL OR approved = false;

-- =====================================================
-- STEP 3: CREATE TRIGGER FOR AUTO-APPROVAL
-- =====================================================

-- Function to auto-approve donors, but not partners
CREATE OR REPLACE FUNCTION auto_approve_donors()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-approve donors
    IF NEW.role = 'donor' THEN
        NEW.approved := true;
        NEW.approved_at := NOW();
    -- Partners need manual approval
    ELSIF NEW.role = 'partner' THEN
        NEW.approved := false;
        NEW.approved_at := NULL;
    -- Admins are auto-approved (created by other admins)
    ELSIF NEW.role = 'admin' THEN
        NEW.approved := true;
        NEW.approved_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS auto_approve_users_trigger ON users;

-- Create trigger
CREATE TRIGGER auto_approve_users_trigger
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION auto_approve_donors();

-- =====================================================
-- STEP 4: CREATE FIRST ADMIN
-- =====================================================

-- Replace 'your-email@example.com' with your actual email
-- This makes YOU the first admin

UPDATE users 
SET role = 'admin',
    approved = true,
    approved_at = NOW()
WHERE email = 'abhiramdumpala2104@gmail.com';  -- CHANGE THIS!

-- If you don't have a user yet, create one:
-- (Uncomment and modify these lines)

/*
INSERT INTO users (id, email, name, role, approved, approved_at, created_at)
VALUES (
    'your-user-id-from-auth-users',  -- Get this from auth.users table
    'admin@example.com',
    'Admin User',
    'admin',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    approved = true,
    approved_at = NOW();
*/

-- =====================================================
-- STEP 5: VERIFICATION
-- =====================================================

-- Check admin was created
SELECT 
    id,
    email,
    name,
    role,
    approved,
    approved_at,
    'ADMIN CREATED ✅' as status
FROM users 
WHERE role = 'admin';

-- Check approval fields exist
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('approved', 'approved_at', 'approved_by', 'rejection_reason')
ORDER BY column_name;

-- Check trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    'TRIGGER EXISTS ✅' as status
FROM information_schema.triggers
WHERE trigger_name = 'auto_approve_users_trigger';

-- =====================================================
-- STEP 6: TEST DATA (OPTIONAL)
-- =====================================================

-- Show pending partners (should be empty initially)
SELECT 
    COUNT(*) as pending_partners,
    'Pending partner applications' as description
FROM users 
WHERE role = 'partner' 
AND approved = false;

-- Show all users by role and approval status
SELECT 
    role,
    approved,
    COUNT(*) as count
FROM users
GROUP BY role, approved
ORDER BY role, approved;

SELECT '✅ ADMIN SETUP COMPLETE!

Next steps:
1. Verify your email is now admin (see results above)
2. Log in with your admin account
3. Go to /dashboard/admin
4. You can now approve partners and manage the platform!' as message;
