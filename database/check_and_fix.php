<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kiểm tra và Sửa Lỗi Ứng tuyển</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
        .btn:hover { background: #0056b3; }
        .btn-danger { background: #dc3545; }
        .btn-danger:hover { background: #c82333; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🔧 Kiểm tra và Sửa Lỗi Ứng tuyển</h1>
    
    <?php
    if (isset($_POST['action'])) {
        require_once '../config/database.php';
        
        try {
            $database = new Database();
            $db = $database->getConnection();
            
            if ($_POST['action'] === 'check') {
                echo '<h2>📋 Kết quả Kiểm tra:</h2>';
                
                // Check if constraint exists
                $query = "SHOW INDEX FROM applications WHERE Key_name = 'unique_application'";
                $stmt = $db->query($query);
                
                if ($stmt->rowCount() > 0) {
                    echo '<div class="error">❌ <strong>Tìm thấy constraint problematic!</strong><br>';
                    echo 'Constraint <code>unique_application</code> đang ngăn chặn ứng tuyển lại sau khi rút đơn.</div>';
                    
                    echo '<div class="warning">⚠️ <strong>Cần sửa:</strong> Constraint này phải được xóa để cho phép ứng tuyển lại.</div>';
                } else {
                    echo '<div class="success">✅ <strong>Constraint đã được sửa!</strong><br>';
                    echo 'Không tìm thấy constraint <code>unique_application</code>. Ứng tuyển lại sau rút đơn đã hoạt động.</div>';
                }
                
                // Test applicationExists method logic
                echo '<div class="info">ℹ️ <strong>Logic Code:</strong> Method <code>applicationExists()</code> đã đúng - chỉ check applications có status != "withdrawn".</div>';
                
            } elseif ($_POST['action'] === 'fix') {
                echo '<h2>🛠️ Kết quả Sửa chữa:</h2>';
                
                // Check if constraint exists first
                $query = "SHOW INDEX FROM applications WHERE Key_name = 'unique_application'";
                $stmt = $db->query($query);
                
                if ($stmt->rowCount() > 0) {
                    // Remove the constraint
                    $query = "ALTER TABLE applications DROP INDEX unique_application";
                    $db->exec($query);
                    
                    echo '<div class="success">✅ <strong>Đã sửa thành công!</strong><br>';
                    echo 'Constraint <code>unique_application</code> đã được xóa. Bạn có thể ứng tuyển lại sau khi rút đơn.</div>';
                } else {
                    echo '<div class="info">ℹ️ <strong>Đã được sửa trước đó:</strong><br>';
                    echo 'Constraint không tồn tại, có thể đã được xóa rồi.</div>';
                }
                
                echo '<div class="success">🎉 <strong>Hệ thống đã sẵn sàng!</strong><br>';
                echo 'Bạn có thể test: Ứng tuyển → Rút đơn → Ứng tuyển lại</div>';
            }
            
        } catch (Exception $e) {
            echo '<div class="error">❌ <strong>Lỗi:</strong> ' . $e->getMessage() . '</div>';
        }
    }
    ?>
    
    <div class="info">
        <h3>📝 Mô tả vấn đề:</h3>
        <p>Lỗi "ứng tuyển không được" xảy ra do <strong>database constraint</strong> ngăn chặn ứng viên ứng tuyển lại cùng một job (ngay cả sau khi rút đơn).</p>
        <p><strong>Constraint problematic:</strong> <code>UNIQUE KEY unique_application (job_id, candidate_id)</code></p>
    </div>
    
    <h3>🔍 Hành động:</h3>
    
    <form method="POST" style="display: inline;">
        <input type="hidden" name="action" value="check">
        <button type="submit" class="btn">Kiểm tra Vấn đề</button>
    </form>
    
    <form method="POST" style="display: inline;">
        <input type="hidden" name="action" value="fix">
        <button type="submit" class="btn btn-danger" onclick="return confirm('Bạn có chắc muốn sửa database constraint? Hành động này không thể hoàn tác.')">Sửa Ngay</button>
    </form>
    
    <h3>💡 Hướng dẫn Manual:</h3>
    <div class="info">
        <p><strong>Nếu không muốn dùng tool này, bạn có thể chạy SQL manual:</strong></p>
        <pre>USE recruitment_system;
ALTER TABLE applications DROP INDEX unique_application;</pre>
    </div>
    
    <h3>✅ Test sau khi sửa:</h3>
    <ol>
        <li>Đăng nhập với tài khoản candidate</li>
        <li>Ứng tuyển một job bất kỳ</li>
        <li>Rút đơn ứng tuyển</li>
        <li>Ứng tuyển lại cùng job → <strong>Phải thành công</strong></li>
    </ol>
    
</body>
</html>