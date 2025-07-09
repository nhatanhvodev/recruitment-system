<?php
header('Content-Type: application/json');

include_once '../config/database.php';
include_once '../classes/User.php';

$database = new Database();
$db = $database->getConnection();
$user = new User($db);

if($_SERVER['REQUEST_METHOD'] == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if(isset($data->email) && isset($data->password) && isset($data->full_name) && isset($data->user_type)) {
        $user->email = $data->email;
        $user->password = $data->password;
        $user->full_name = $data->full_name;
        $user->phone = isset($data->phone) ? $data->phone : '';
        $user->user_type = $data->user_type;
        
        // Validate user_type
        if(!in_array($data->user_type, ['admin', 'recruiter', 'candidate'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Loại tài khoản không hợp lệ'
            ]);
            exit;
        }
        
        if($user->emailExists()) {
            echo json_encode([
                'success' => false,
                'message' => 'Email đã được sử dụng'
            ]);
        } else {
            // Start transaction
            $db->beginTransaction();
            
            try {
                if($user->create()) {
                    $user_id = $user->user_id;
                    
                    // Create specific user type record
                    if($data->user_type == 'candidate') {
                        $query = "INSERT INTO candidates (user_id) VALUES (:user_id)";
                        $stmt = $db->prepare($query);
                        $stmt->bindParam(':user_id', $user_id);
                        $stmt->execute();
                        
                    } elseif($data->user_type == 'recruiter') {
                        // Create recruiter record without company (can be updated later)
                        $query = "INSERT INTO recruiters (user_id, company_id, position) VALUES (:user_id, NULL, :position)";
                        $stmt = $db->prepare($query);
                        $stmt->bindParam(':user_id', $user_id);
                        $stmt->bindParam(':position', $data->position ?? '');
                        $stmt->execute();
                        
                    } elseif($data->user_type == 'admin') {
                        // Create admin record with default permissions
                        $default_permissions = '["manage_users", "approve_jobs", "generate_reports", "view_statistics"]';
                        $query = "INSERT INTO admins (user_id, permissions) VALUES (:user_id, :permissions)";
                        $stmt = $db->prepare($query);
                        $stmt->bindParam(':user_id', $user_id);
                        $stmt->bindParam(':permissions', $default_permissions);
                        $stmt->execute();
                    }
                    
                    // Commit transaction
                    $db->commit();
                    
                    echo json_encode([
                        'success' => true,
                        'message' => 'Đăng ký thành công'
                    ]);
                } else {
                    // Rollback transaction
                    $db->rollBack();
                    
                    echo json_encode([
                        'success' => false,
                        'message' => 'Có lỗi xảy ra khi tạo tài khoản'
                    ]);
                }
            } catch (Exception $e) {
                // Rollback transaction on error
                $db->rollBack();
                
                echo json_encode([
                    'success' => false,
                    'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
                ]);
            }
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Vui lòng nhập đầy đủ thông tin'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Phương thức không được hỗ trợ'
    ]);
}
?>