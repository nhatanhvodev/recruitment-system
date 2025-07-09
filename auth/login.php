<?php
session_start();
header('Content-Type: application/json');

include_once '../config/database.php';
include_once '../classes/User.php';

$database = new Database();
$db = $database->getConnection();
$user = new User($db);

if($_SERVER['REQUEST_METHOD'] == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if(isset($data->email) && isset($data->password)) {
        if($user->login($data->email, $data->password)) {
            // User type is now available directly from login
            $_SESSION['user_id'] = $user->user_id;
            $_SESSION['email'] = $user->email;
            $_SESSION['full_name'] = $user->full_name;
            $_SESSION['phone'] = $user->phone;
            $_SESSION['user_type'] = $user->user_type;
            $_SESSION['logged_in'] = true;
            
            echo json_encode([
                'success' => true,
                'message' => 'Đăng nhập thành công',
                'user' => [
                    'user_id' => $user->user_id,
                    'email' => $user->email,
                    'full_name' => $user->full_name,
                    'phone' => $user->phone,
                    'user_type' => $user->user_type
                ]
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Email hoặc mật khẩu không chính xác'
            ]);
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