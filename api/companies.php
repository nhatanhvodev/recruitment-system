<?php
header('Content-Type: application/json');

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

if($_SERVER['REQUEST_METHOD'] == 'GET') {
    try {
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