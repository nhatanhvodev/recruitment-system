-- Migration: Add user_type column to users table
-- Execute this to fix the user type issue

USE recruitment_system;

-- 1. Add user_type column to users table
ALTER TABLE users 
ADD COLUMN user_type ENUM('admin', 'recruiter', 'candidate') NOT NULL DEFAULT 'candidate';

-- 2. Update existing users based on their records in other tables
-- Set user_type for admins
UPDATE users 
SET user_type = 'admin' 
WHERE user_id IN (SELECT user_id FROM admins);

-- Set user_type for recruiters  
UPDATE users 
SET user_type = 'recruiter' 
WHERE user_id IN (SELECT user_id FROM recruiters);

-- Set user_type for candidates
UPDATE users 
SET user_type = 'candidate' 
WHERE user_id IN (SELECT user_id FROM candidates);

-- 3. For any remaining users without specific type records, default to candidate
UPDATE users 
SET user_type = 'candidate' 
WHERE user_type IS NULL;

-- 4. Verify the update
SELECT 
    u.user_id,
    u.email,
    u.full_name,
    u.user_type,
    CASE 
        WHEN a.user_id IS NOT NULL THEN 'Has admin record'
        WHEN r.user_id IS NOT NULL THEN 'Has recruiter record'  
        WHEN c.user_id IS NOT NULL THEN 'Has candidate record'
        ELSE 'No specific record'
    END as table_record
FROM users u
LEFT JOIN admins a ON u.user_id = a.user_id
LEFT JOIN recruiters r ON u.user_id = r.user_id  
LEFT JOIN candidates c ON u.user_id = c.user_id
ORDER BY u.user_id;