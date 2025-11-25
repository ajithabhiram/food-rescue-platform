-- ⚡ QUICK FIX - Run This Entire Script in Supabase SQL Editor
-- This will fix the approval system issue

-- ============================================
-- STEP 1: Add the columns if they don't exist
-- ============================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approved BOOLEAN,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS application_notes TEXT;

-- ============================================
-- STEP 2: Set correct initial values
-- ============================================

-- Auto-approve donors, admins, volunteers
UPDATE users 
SET approved = TRUE 
WHERE role IN ('donor', 'admin', 'volunteer') 
  AND approved IS NULL;

-- Set partners to pending
UPDATE users 
SET approved = NULL 
WHERE role = 'partner' 
  AND approved IS NULL;

-- ============================================
-- STEP 3: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_approved ON users(approved);
CREATE INDEX IF NOT EXISTS idx_users_role_approved ON users(role, approved);

-- ============================================
-- STEP 4: Add foreign key constraint (if needed)
-- ============================================

-- Drop existing constraint if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_approved_by_fkey;

-- Add constraint with ON DELETE SET NULL
ALTER TABLE users 
ADD CONSTRAINT users_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- STEP 5: Verify it worked
-- ============================================

-- Check columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('approved', 'approved_at', 'approved_by', 'rejection_reason', 'application_notes')
ORDER BY column_name;

-- Check user states
SELECT 
  email,
  role,
  CASE 
    WHEN approved IS NULL THEN '⏳ PENDING'
    WHEN approved = TRUE THEN '✅ APPROVED'
    WHEN approved = FALSE THEN '❌ REJECTED'
    ELSE 'ERROR'
  END as status,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- Check partners specifically
SELECT 
  email,
  CASE 
    WHEN approved IS NULL THEN '⏳ PENDING'
    WHEN approved = TRUE THEN '✅ APPROVED'
    WHEN approved = FALSE THEN '❌ REJECTED'
  END as status,
  rejection_reason,
  approved_at
FROM users
WHERE role = 'partner'
ORDER BY created_at DESC;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Approval system columns added successfully!';
  RAISE NOTICE '✅ Existing users updated with correct approval states';
  RAISE NOTICE '✅ Indexes created for performance';
  RAISE NOTICE '✅ Foreign key constraint added';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next steps:';
  RAISE NOTICE '1. Refresh your admin applications page';
  RAISE NOTICE '2. Try approving/rejecting a partner';
  RAISE NOTICE '3. Check browser console for any errors';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Check the query results above to verify states';
END $$;
