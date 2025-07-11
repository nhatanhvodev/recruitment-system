-- Fix Application Constraint to Allow Re-applying After Withdrawal
-- This migration removes the problematic unique constraint that prevents candidates 
-- from re-applying to jobs after withdrawing their applications

USE recruitment_system;

-- Drop the existing unique constraint
ALTER TABLE applications DROP INDEX unique_application;

-- Create a new constraint that only prevents duplicate active applications
-- This allows withdrawn applications to be followed by new applications
-- We'll handle this logic in the application code instead of at database level

-- Note: The applicationExists() method in Application.php already handles this correctly
-- by checking WHERE status != 'withdrawn', so removing the constraint is safe

-- Optional: Add a comment to document this decision
ALTER TABLE applications COMMENT = 'Applications table - allows re-applying after withdrawal';