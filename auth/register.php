<?php
// Prevent any output before JSON
ob_start();

// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Error reporting for debugging (but don't display errors)
error_reporting(E_ALL);
ini_set('display_errors', 0);

try {
    // Only allow POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Chỉ chấp nhận phương thức POST');
    }

    // Get and validate JSON input
    $input = file_get_contents("php://input");
    
    if (empty($input)) {
        throw new Exception('Không có dữ liệu được gửi');
    }
    
    $data = json_decode($input);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Dữ liệu JSON không hợp lệ: ' . json_last_error_msg());
    }
    
    if (!$data) {
        throw new Exception('Dữ liệu nhận được không hợp lệ');
    }

    // Validate required fields
    $required_fields = ['email', 'password', 'full_name', 'user_type'];
    $missing_fields = [];
    
    foreach ($required_fields as $field) {
        if (!isset($data->$field) || trim($data->$field) === '') {
            $missing_fields[] = $field;
        }
    }
    
    if (!empty($missing_fields)) {
        throw new Exception('Thiếu thông tin bắt buộc: ' . implode(', ', $missing_fields));
    }

    // Validate user_type
    $allowed_types = ['admin', 'recruiter', 'candidate'];
    if (!in_array($data->user_type, $allowed_types)) {
        throw new Exception('Loại tài khoản không hợp lệ');
    }
    
    // Validate email format
    if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Định dạng email không hợp lệ');
    }
    
    // Validate password length
    if (strlen($data->password) < 6) {
        throw new Exception('Mật khẩu phải có ít nhất 6 ký tự');
    }
    
    // For recruiters, position is required
    if ($data->user_type === 'recruiter' && (!isset($data->position) || trim($data->position) === '')) {
        throw new Exception('Vị trí công việc là bắt buộc cho nhà tuyển dụng');
    }

    // Include dependencies with error checking
    $database_file = '../config/database.php';
    $user_file = '../classes/User.php';
    
    if (!file_exists($database_file)) {
        throw new Exception('Không tìm thấy file cấu hình database');
    }
    
    if (!file_exists($user_file)) {
        throw new Exception('Không tìm thấy file class User');
    }
    
    require_once $database_file;
    require_once $user_file;
    
    // Initialize database connection
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception('Không thể kết nối cơ sở dữ liệu');
    }
    
    // Initialize user object
    $user = new User($db);
    $user->email = trim(strtolower($data->email));
    $user->password = $data->password;  // Will be hashed in User class
    $user->full_name = trim($data->full_name);
    $user->phone = isset($data->phone) ? trim($data->phone) : '';
    $user->user_type = $data->user_type;
    
    // Check if email already exists
    if ($user->emailExists()) {
        throw new Exception('Email này đã được sử dụng. Vui lòng chọn email khác.');
    }
    
    // Start database transaction
    $db->beginTransaction();
    
    try {
        // Create user account
        if (!$user->create()) {
            throw new Exception('Không thể tạo tài khoản người dùng');
        }
        
        $user_id = $user->user_id;
        
        if (!$user_id) {
            throw new Exception('Không lấy được ID người dùng sau khi tạo');
        }
        
        // Create specific user type record
        switch ($data->user_type) {
            case 'candidate':
                $query = "INSERT INTO candidates (user_id) VALUES (:user_id)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
                
                if (!$stmt->execute()) {
                    throw new Exception('Không thể tạo hồ sơ ứng viên');
                }
                break;
                
            case 'recruiter':
                $position = trim($data->position);
                
                // Check if we need to create/use a default company
                $default_company_id = null;
                
                // First, try to check if recruiters table allows NULL company_id
                try {
                    // Try to insert with NULL company_id first
                    $query = "INSERT INTO recruiters (user_id, company_id, position) VALUES (:user_id, NULL, :position)";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
                    $stmt->bindParam(':position', $position, PDO::PARAM_STR);
                    
                    if (!$stmt->execute()) {
                        throw new Exception('NULL company_id not allowed');
                    }
                } catch (Exception $e) {
                    // If NULL company_id is not allowed, create or use a default company
                    
                    // Check if there's a default company for new recruiters
                    $query = "SELECT company_id FROM companies WHERE name = 'Chờ phân công' ORDER BY company_id LIMIT 1";
                    $stmt = $db->prepare($query);
                    $stmt->execute();
                    
                    if ($stmt->rowCount() > 0) {
                        $row = $stmt->fetch(PDO::FETCH_ASSOC);
                        $default_company_id = $row['company_id'];
                    } else {
                        // Create a default company for new recruiters
                        $query = "INSERT INTO companies (name, description, address, industry, size, is_verified) 
                                 VALUES ('Chờ phân công', 'Công ty tạm thời cho nhà tuyển dụng mới đăng ký', 'Chưa xác định', 'Khác', 1, FALSE)";
                        $stmt = $db->prepare($query);
                        
                        if ($stmt->execute()) {
                            $default_company_id = $db->lastInsertId();
                        } else {
                            throw new Exception('Không thể tạo công ty mặc định');
                        }
                    }
                    
                    // Now insert recruiter with the default company_id
                    $query = "INSERT INTO recruiters (user_id, company_id, position) VALUES (:user_id, :company_id, :position)";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
                    $stmt->bindParam(':company_id', $default_company_id, PDO::PARAM_INT);
                    $stmt->bindParam(':position', $position, PDO::PARAM_STR);
                    
                    if (!$stmt->execute()) {
                        throw new Exception('Không thể tạo hồ sơ nhà tuyển dụng');
                    }
                }
                break;
                
            case 'admin':
                $default_permissions = json_encode([
                    "manage_users", 
                    "approve_jobs", 
                    "generate_reports", 
                    "view_statistics"
                ]);
                
                $query = "INSERT INTO admins (user_id, permissions) VALUES (:user_id, :permissions)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
                $stmt->bindParam(':permissions', $default_permissions, PDO::PARAM_STR);
                
                if (!$stmt->execute()) {
                    throw new Exception('Không thể tạo hồ sơ quản trị viên');
                }
                break;
        }
        
        // Commit transaction if everything succeeded
        $db->commit();
        
        // Prepare success message based on user type
        $success_message = 'Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.';
        
        if ($data->user_type === 'recruiter') {
            $success_message = 'Đăng ký tài khoản nhà tuyển dụng thành công! ' . 
                             'Admin sẽ phân công công ty cho bạn trong thời gian sớm nhất. ' . 
                             'Bạn có thể đăng nhập để cập nhật thông tin cá nhân.';
        }
        
        // Clear output buffer and send success response
        ob_clean();
        echo json_encode([
            'success' => true,
            'message' => $success_message,
            'data' => [
                'user_id' => $user_id,
                'email' => $user->email,
                'user_type' => $user->user_type
            ]
        ]);
        
    } catch (Exception $e) {
        // Rollback transaction on any error
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        throw $e;
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
        'message' => $e->getMessage(),
        'error_code' => $e->getCode()
    ]);
}

// End output buffering
ob_end_flush();
?>