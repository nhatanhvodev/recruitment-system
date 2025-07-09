<?php
// Prevent any output before JSON
ob_start();

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to prevent HTML output

try {
    if($_SERVER['REQUEST_METHOD'] == 'POST') {
        // Get and validate JSON input
        $input = file_get_contents("php://input");
        $data = json_decode($input);
        
        if(!$data) {
            throw new Exception('Invalid JSON data received');
        }
        
        // Check required fields
        if(!isset($data->email) || !isset($data->password) || !isset($data->full_name) || !isset($data->user_type)) {
            throw new Exception('Vui lòng nhập đầy đủ thông tin');
        }
        
        // Validate user_type
        if(!in_array($data->user_type, ['admin', 'recruiter', 'candidate'])) {
            throw new Exception('Loại tài khoản không hợp lệ');
        }
        
        // Include dependencies with error checking
        $database_file = '../config/database.php';
        $user_file = '../classes/User.php';
        
        if (!file_exists($database_file)) {
            throw new Exception('Database configuration file not found');
        }
        
        if (!file_exists($user_file)) {
            throw new Exception('User class file not found');
        }
        
        include_once $database_file;
        include_once $user_file;
        
        // Initialize database
        $database = new Database();
        $db = $database->getConnection();
        
        if (!$db) {
            throw new Exception('Database connection failed');
        }
        
        // Initialize user
        $user = new User($db);
        $user->email = trim($data->email);
        $user->password = $data->password;
        $user->full_name = trim($data->full_name);
        $user->phone = isset($data->phone) ? trim($data->phone) : '';
        $user->user_type = $data->user_type;
        
        // Check if email exists
        if($user->emailExists()) {
            throw new Exception('Email đã được sử dụng');
        }
        
        // Start database transaction
        $db->beginTransaction();
        
        try {
            // Create user
            if(!$user->create()) {
                throw new Exception('Không thể tạo tài khoản user');
            }
            
            $user_id = $user->user_id;
            
            // Create specific user type record
            if($data->user_type == 'candidate') {
                $query = "INSERT INTO candidates (user_id) VALUES (:user_id)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                
                if(!$stmt->execute()) {
                    throw new Exception('Không thể tạo record candidate');
                }
                
            } elseif($data->user_type == 'recruiter') {
                $position = isset($data->position) ? trim($data->position) : '';
                $query = "INSERT INTO recruiters (user_id, company_id, position) VALUES (:user_id, NULL, :position)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->bindParam(':position', $position);
                
                if(!$stmt->execute()) {
                    throw new Exception('Không thể tạo record recruiter');
                }
                
            } elseif($data->user_type == 'admin') {
                $default_permissions = '["manage_users", "approve_jobs", "generate_reports", "view_statistics"]';
                $query = "INSERT INTO admins (user_id, permissions) VALUES (:user_id, :permissions)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->bindParam(':permissions', $default_permissions);
                
                if(!$stmt->execute()) {
                    throw new Exception('Không thể tạo record admin');
                }
            }
            
            // Commit transaction
            $db->commit();
            
            // Clear output buffer and send success response
            ob_clean();
            echo json_encode([
                'success' => true,
                'message' => 'Đăng ký thành công'
            ]);
            
        } catch (Exception $e) {
            // Rollback transaction
            $db->rollBack();
            throw $e;
        }
        
    } else {
        throw new Exception('Phương thức không được hỗ trợ');
    }
    
} catch (Exception $e) {
    // Rollback transaction if still active
    if (isset($db) && $db && $db->inTransaction()) {
        $db->rollBack();
    }
    
    // Clear output buffer and send error response
    ob_clean();
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

// End output buffering
ob_end_flush();
?>