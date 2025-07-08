<?php
session_start();
header('Content-Type: application/json');

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

if($_SERVER['REQUEST_METHOD'] == 'GET') {
    try {
        if(isset($_GET['user_companies'])) {
            // Get companies for current user (recruiter)
            if(!isset($_SESSION['logged_in']) || $_SESSION['user_type'] !== 'recruiter') {
                echo json_encode([
                    'success' => false,
                    'message' => 'Không có quyền truy cập'
                ]);
                exit;
            }
            
            $query = "SELECT c.company_id, c.name, c.description, c.website, c.size, c.industry, c.logo, c.email 
                      FROM companies c 
                      INNER JOIN recruiters r ON c.company_id = r.company_id 
                      WHERE r.user_id = :user_id";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $_SESSION['user_id']);
            $stmt->execute();
            
            $companies = [];
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $companies[] = $row;
            }
            
            echo json_encode([
                'success' => true,
                'data' => $companies
            ]);
        } else {
            // Get all verified companies
            $query = "SELECT company_id, name, description, logo, website, industry, size, is_verified 
                      FROM companies 
                      WHERE is_verified = 1 
                      ORDER BY name ASC";
            
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $companies = [];
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $companies[] = $row;
            }
            
            echo json_encode([
                'success' => true,
                'data' => $companies
            ]);
        }
        
    } catch(Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Có lỗi xảy ra khi tải danh sách công ty'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Phương thức không được hỗ trợ'
    ]);
}
?>