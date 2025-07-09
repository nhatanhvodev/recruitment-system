-- Migration to remove company requirement for recruiters
-- Execute this if you already have the database set up

USE recruitment_system;

-- Update recruiters table to allow NULL company_id
ALTER TABLE recruiters 
MODIFY COLUMN company_id INT NULL;

-- Update foreign key constraint to SET NULL on delete
ALTER TABLE recruiters 
DROP FOREIGN KEY recruiters_ibfk_2;

ALTER TABLE recruiters
ADD CONSTRAINT recruiters_ibfk_2 
FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE SET NULL;

-- Note: This migration allows recruiters to exist without being assigned to a company
-- They will need to be assigned to a company by admin before they can post jobs