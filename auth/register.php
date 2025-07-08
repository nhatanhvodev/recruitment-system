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
        
        if($user->emailExists()) {
            echo json_encode([
                'success' => false,
                'message' => 'Email đã được sử dụng'
            ]);
        } else {
            if($user->create()) {
                // Create specific user type record
                $user_id = $user->user_id;
                
                if($data->user_type == 'candidate') {
                    $query = "INSERT INTO candidates (user_id) VALUES (:user_id)";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':user_id', $user_id);
                    $stmt->execute();
                } elseif($data->user_type == 'recruiter') {
                    // For recruiter, we need company_id which should be provided
                    if(isset($data->company_id)) {
                        $query = "INSERT INTO recruiters (user_id, company_id, position) VALUES (:user_id, :company_id, :position)";
                        $stmt = $db->prepare($query);
                        $stmt->bindParam(':user_id', $user_id);
                        $stmt->bindParam(':company_id', $data->company_id);
                        $stmt->bindParam(':position', $data->position ?? '');
                        $stmt->execute();
                    }
                }
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Đăng ký thành công'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Có lỗi xảy ra khi tạo tài khoản'
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