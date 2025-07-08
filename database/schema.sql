-- Database Schema for Recruitment System
-- Create database
CREATE DATABASE IF NOT EXISTS recruitment_system;
USE recruitment_system;

-- User table (base table for all user types)
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Admin table
CREATE TABLE admins (
    admin_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    permissions VARCHAR(500) DEFAULT '["manage_users", "approve_jobs", "generate_reports", "view_statistics"]',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Company table
CREATE TABLE companies (
    company_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address VARCHAR(500),
    logo VARCHAR(255),
    website VARCHAR(255),
    industry VARCHAR(100),
    size INT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Recruiter table
CREATE TABLE recruiters (
    recruiter_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    company_id INT NOT NULL,
    position VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

-- Job table
CREATE TABLE jobs (
    job_id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    salary DECIMAL(15,2),
    location VARCHAR(255),
    job_type VARCHAR(50) DEFAULT 'full-time',
    status VARCHAR(20) DEFAULT 'active',
    view_count INT DEFAULT 0,
    application_count INT DEFAULT 0,
    posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

-- Candidate table
CREATE TABLE candidates (
    candidate_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    profile_id INT,
    resume VARCHAR(255),
    is_profile_public BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Profile table
CREATE TABLE profiles (
    profile_id INT PRIMARY KEY AUTO_INCREMENT,
    candidate_id INT NOT NULL,
    summary TEXT,
    skills TEXT, -- JSON format: ["skill1", "skill2"]
    experience TEXT,
    education TEXT,
    view_count INT DEFAULT 0,
    last_viewed_at DATETIME,
    FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id) ON DELETE CASCADE
);

-- Update candidate table with foreign key to profile
ALTER TABLE candidates ADD FOREIGN KEY (profile_id) REFERENCES profiles(profile_id);

-- Application table
CREATE TABLE applications (
    application_id INT PRIMARY KEY AUTO_INCREMENT,
    job_id INT NOT NULL,
    candidate_id INT NOT NULL,
    cover_letter TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id) ON DELETE CASCADE,
    UNIQUE KEY unique_application (job_id, candidate_id)
);

-- Payment table
CREATE TABLE payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    recruiter_id INT NOT NULL,
    package_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    paid_at DATETIME,
    FOREIGN KEY (recruiter_id) REFERENCES recruiters(recruiter_id) ON DELETE CASCADE
);

-- Message table
CREATE TABLE messages (
    message_id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Statistics table
CREATE TABLE statistics (
    stat_id INT PRIMARY KEY AUTO_INCREMENT,
    entity_type VARCHAR(50) NOT NULL, -- 'job', 'user', 'application', etc.
    entity_id INT NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'view', 'click', 'apply', etc.
    value INT NOT NULL,
    date DATE NOT NULL,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_date (date)
);

-- Insert default admin user
INSERT INTO users (email, password, full_name, phone) VALUES 
('admin@recruitment.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', '0123456789');

INSERT INTO admins (user_id) VALUES (1);

-- Insert sample companies
INSERT INTO companies (name, description, address, website, industry, size, is_verified) VALUES 
('TechCorp Vietnam', 'Leading technology company in Vietnam', '123 Nguyen Hue, District 1, Ho Chi Minh City', 'https://techcorp.vn', 'Technology', 500, TRUE),
('VietBank', 'Top banking institution in Vietnam', '456 Le Loi, Hanoi', 'https://vietbank.vn', 'Banking', 1000, TRUE);

-- Insert sample jobs
INSERT INTO jobs (company_id, title, description, requirements, salary, location, job_type) VALUES 
(1, 'Senior PHP Developer', 'We are looking for an experienced PHP developer to join our team.', 'PHP, MySQL, Laravel, 3+ years experience', 25000000, 'Ho Chi Minh City', 'full-time'),
(1, 'Frontend Developer', 'Join our frontend team to build amazing user interfaces.', 'HTML, CSS, JavaScript, React, 2+ years experience', 20000000, 'Ho Chi Minh City', 'full-time'),
(2, 'Business Analyst', 'Analyze business requirements and processes.', 'Business Analysis, SQL, Excel, 2+ years experience', 18000000, 'Hanoi', 'full-time');