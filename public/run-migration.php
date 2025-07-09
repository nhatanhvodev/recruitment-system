<?php
// Simple migration runner to fix database constraints
// Access this file via browser to run necessary database migrations

// Security: Only allow this in development/local environment
$allowed_hosts = ['localhost', '127.0.0.1', '::1'];
$current_host = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? 'unknown';

// Remove port number if present
$current_host = explode(':', $current_host)[0];

if (!in_array($current_host, $allowed_hosts)) {
    die('Migration can only be run on localhost for security reasons.');
}

?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Migration Runner</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .alert {
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
        }
        .alert-info { background-color: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        .alert-success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .alert-danger { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .alert-warning { background-color: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .btn {
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 5px;
        }
        .btn:hover { background-color: #0056b3; }
        .btn-success { background-color: #28a745; }
        .btn-success:hover { background-color: #218838; }
        pre {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border: 1px solid #dee2e6;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Database Migration Runner</h1>
        
        <div class="alert alert-info">
            <strong>Mục đích:</strong> Script này sửa lỗi constraint trong database để cho phép đăng ký tài khoản nhà tuyển dụng thành công.
        </div>

        <?php
        if (isset($_POST['run_migration'])) {
            echo '<h2>🚀 Đang chạy migration...</h2>';
            
            try {
                // Include database config
                require_once '../config/database.php';
                
                $database = new Database();
                $db = $database->getConnection();
                
                if (!$db) {
                    throw new Exception('Không thể kết nối database');
                }
                
                echo '<div class="alert alert-info">✅ Kết nối database thành công</div>';
                
                // Run the migration SQL
                $migration_file = '../database/migration_remove_company_requirement.sql';
                
                if (!file_exists($migration_file)) {
                    throw new Exception('Không tìm thấy file migration');
                }
                
                $sql_content = file_get_contents($migration_file);
                
                // Remove comments and split by semicolons
                $sql_statements = array_filter(
                    array_map('trim', explode(';', $sql_content)),
                    function($stmt) {
                        return !empty($stmt) && !str_starts_with($stmt, '--') && !str_starts_with($stmt, 'USE');
                    }
                );
                
                echo '<div class="alert alert-info">📝 Tìm thấy ' . count($sql_statements) . ' câu lệnh SQL</div>';
                
                $success_count = 0;
                $errors = [];
                
                foreach ($sql_statements as $sql) {
                    try {
                        $stmt = $db->prepare($sql);
                        $stmt->execute();
                        $success_count++;
                        echo '<div class="alert alert-success">✅ Thực hiện thành công: ' . substr($sql, 0, 50) . '...</div>';
                    } catch (Exception $e) {
                        $errors[] = 'Lỗi SQL: ' . $e->getMessage() . ' | SQL: ' . substr($sql, 0, 100);
                        echo '<div class="alert alert-warning">⚠️ SQL đã chạy hoặc bỏ qua: ' . substr($sql, 0, 50) . '...</div>';
                    }
                }
                
                // Test the fix by trying to create a test recruiter (dry run)
                echo '<h3>🧪 Testing the fix...</h3>';
                
                try {
                    $test_sql = "INSERT INTO recruiters (user_id, company_id, position) VALUES (999999, NULL, 'Test Position')";
                    $stmt = $db->prepare($test_sql);
                    $stmt->execute();
                    
                    // Immediately delete the test record
                    $delete_sql = "DELETE FROM recruiters WHERE user_id = 999999";
                    $stmt = $db->prepare($delete_sql);
                    $stmt->execute();
                    
                    echo '<div class="alert alert-success">✅ Migration thành công! Bây giờ có thể đăng ký tài khoản nhà tuyển dụng với company_id = NULL</div>';
                    
                } catch (Exception $e) {
                    echo '<div class="alert alert-danger">❌ Vẫn còn lỗi: ' . $e->getMessage() . '</div>';
                    echo '<div class="alert alert-info">💡 Hãy thử chạy migration một lần nữa hoặc kiểm tra quyền database</div>';
                }
                
                if (empty($errors)) {
                    echo '<div class="alert alert-success"><strong>🎉 Migration hoàn thành thành công!</strong><br>Bây giờ bạn có thể quay lại trang đăng ký và thử đăng ký tài khoản nhà tuyển dụng.</div>';
                } else {
                    echo '<div class="alert alert-warning"><strong>⚠️ Migration hoàn thành với một số cảnh báo:</strong><br>' . implode('<br>', $errors) . '</div>';
                }
                
            } catch (Exception $e) {
                echo '<div class="alert alert-danger"><strong>❌ Lỗi nghiêm trọng:</strong> ' . $e->getMessage() . '</div>';
                echo '<div class="alert alert-info">💡 Hãy kiểm tra:</div>';
                echo '<ul>';
                echo '<li>Database có tồn tại và đang chạy không?</li>';
                echo '<li>Thông tin kết nối database trong config/database.php có đúng không?</li>';
                echo '<li>User database có quyền ALTER TABLE không?</li>';
                echo '</ul>';
            }
        } else {
        ?>
            <h2>📋 Thông tin</h2>
            <div class="alert alert-warning">
                <strong>Vấn đề hiện tại:</strong> 
                Khi đăng ký tài khoản nhà tuyển dụng, hệ thống báo lỗi: 
                <code>SQLSTATE[23000]: Integrity constraint violation: 1048 Column 'company_id' cannot be null</code>
            </div>
            
            <div class="alert alert-info">
                <strong>Giải pháp:</strong> 
                Migration này sẽ sửa đổi bảng <code>recruiters</code> để cho phép <code>company_id</code> có thể NULL, 
                cho phép nhà tuyển dụng đăng ký mà chưa cần được phân công vào công ty cụ thể.
            </div>

            <h2>🎯 Hành động</h2>
            <form method="POST" onsubmit="return confirm('Bạn có chắc chắn muốn chạy migration? Điều này sẽ thay đổi cấu trúc database.')">
                <button type="submit" name="run_migration" class="btn btn-success">
                    🚀 Chạy Migration Ngay
                </button>
            </form>
            
            <div style="margin-top: 20px;">
                <a href="register.html" class="btn">🔙 Quay lại trang đăng ký</a>
                <a href="index.html" class="btn">🏠 Trang chủ</a>
            </div>

            <h2>📝 Chi tiết kỹ thuật</h2>
            <p>Migration này sẽ thực hiện:</p>
            <ul>
                <li>✅ Sửa đổi cột <code>company_id</code> trong bảng <code>recruiters</code> để có thể NULL</li>
                <li>✅ Cập nhật foreign key constraint để SET NULL khi company bị xóa</li>
                <li>✅ Cho phép nhà tuyển dụng đăng ký mà chưa thuộc công ty nào</li>
                <li>✅ Admin có thể phân công công ty cho nhà tuyển dụng sau</li>
            </ul>
        <?php } ?>
    </div>
</body>
</html>