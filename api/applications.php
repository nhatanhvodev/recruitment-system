diff --git a/api/applications.php b/api/applications.php
--- a/api/applications.php
+++ b/api/applications.php
@@ -0,0 +1,185 @@
+<?php
+session_start();
+header('Content-Type: application/json');
+
+include_once '../config/database.php';
+include_once '../classes/Application.php';
+include_once '../classes/Job.php';
+
+$database = new Database();
+$db = $database->getConnection();
+$application = new Application($db);
+$job = new Job($db);
+
+if($_SERVER['REQUEST_METHOD'] == 'POST') {
+    // Submit application
+    if(!isset($_SESSION['logged_in']) || $_SESSION['user_type'] != 'candidate') {
+        echo json_encode([
+            'success' => false,
+            'message' => 'Bạn cần đăng nhập với tài khoản ứng viên'
+        ]);
+        exit;
+    }
+    
+    $data = json_decode(file_get_contents("php://input"));
+    
+    if(isset($data->job_id)) {
+        // Get candidate_id from session
+        $user_id = $_SESSION['user_id'];
+        $query = "SELECT candidate_id FROM candidates WHERE user_id = :user_id";
+        $stmt = $db->prepare($query);
+        $stmt->bindParam(':user_id', $user_id);
+        $stmt->execute();
+        
+        if($stmt->rowCount() > 0) {
+            $row = $stmt->fetch(PDO::FETCH_ASSOC);
+            $candidate_id = $row['candidate_id'];
+            
+            $application->job_id = $data->job_id;
+            $application->candidate_id = $candidate_id;
+            $application->cover_letter = $data->cover_letter ?? '';
+            
+            if($application->create()) {
+                // Increment job application count
+                $job->job_id = $data->job_id;
+                $job->incrementApplicationCount();
+                
+                // Record statistics
+                $query = "INSERT INTO statistics (entity_type, entity_id, metric_type, value, date) 
+                         VALUES ('job', :job_id, 'application', 1, CURDATE())
+                         ON DUPLICATE KEY UPDATE value = value + 1";
+                $stmt = $db->prepare($query);
+                $stmt->bindParam(':job_id', $data->job_id);
+                $stmt->execute();
+                
+                echo json_encode([
+                    'success' => true,
+                    'message' => 'Nộp đơn thành công'
+                ]);
+            } else {
+                echo json_encode([
+                    'success' => false,
+                    'message' => 'Bạn đã nộp đơn cho công việc này rồi'
+                ]);
+            }
+        } else {
+            echo json_encode([
+                'success' => false,
+                'message' => 'Không tìm thấy thông tin ứng viên'
+            ]);
+        }
+    } else {
+        echo json_encode([
+            'success' => false,
+            'message' => 'Thiếu thông tin job_id'
+        ]);
+    }
+    
+} elseif($_SERVER['REQUEST_METHOD'] == 'GET') {
+    if(!isset($_SESSION['logged_in'])) {
+        echo json_encode([
+            'success' => false,
+            'message' => 'Bạn cần đăng nhập'
+        ]);
+        exit;
+    }
+    
+    if(isset($_GET['candidate_applications'])) {
+        // Get applications by candidate
+        if($_SESSION['user_type'] != 'candidate') {
+            echo json_encode([
+                'success' => false,
+                'message' => 'Không có quyền truy cập'
+            ]);
+            exit;
+        }
+        
+        $user_id = $_SESSION['user_id'];
+        $query = "SELECT candidate_id FROM candidates WHERE user_id = :user_id";
+        $stmt = $db->prepare($query);
+        $stmt->bindParam(':user_id', $user_id);
+        $stmt->execute();
+        
+        if($stmt->rowCount() > 0) {
+            $row = $stmt->fetch(PDO::FETCH_ASSOC);
+            $candidate_id = $row['candidate_id'];
+            
+            $stmt = $application->getApplicationsByCandidate($candidate_id);
+            $applications = [];
+            
+            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
+                $applications[] = $row;
+            }
+            
+            echo json_encode([
+                'success' => true,
+                'data' => $applications
+            ]);
+        } else {
+            echo json_encode([
+                'success' => false,
+                'message' => 'Không tìm thấy thông tin ứng viên'
+            ]);
+        }
+        
+    } elseif(isset($_GET['job_id'])) {
+        // Get applications for a job (for recruiters)
+        if(!in_array($_SESSION['user_type'], ['recruiter', 'admin'])) {
+            echo json_encode([
+                'success' => false,
+                'message' => 'Không có quyền truy cập'
+            ]);
+            exit;
+        }
+        
+        $stmt = $application->getApplicationsByJob($_GET['job_id']);
+        $applications = [];
+        
+        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
+            $applications[] = $row;
+        }
+        
+        echo json_encode([
+            'success' => true,
+            'data' => $applications
+        ]);
+    }
+    
+} elseif($_SERVER['REQUEST_METHOD'] == 'PUT') {
+    // Update application status
+    if(!isset($_SESSION['logged_in']) || !in_array($_SESSION['user_type'], ['recruiter', 'admin'])) {
+        echo json_encode([
+            'success' => false,
+            'message' => 'Không có quyền truy cập'
+        ]);
+        exit;
+    }
+    
+    $data = json_decode(file_get_contents("php://input"));
+    
+    if(isset($data->application_id) && isset($data->status)) {
+        if($application->updateStatus($data->application_id, $data->status)) {
+            echo json_encode([
+                'success' => true,
+                'message' => 'Cập nhật trạng thái thành công'
+            ]);
+        } else {
+            echo json_encode([
+                'success' => false,
+                'message' => 'Có lỗi xảy ra khi cập nhật'
+            ]);
+        }
+    } else {
+        echo json_encode([
+            'success' => false,
+            'message' => 'Thiếu thông tin'
+        ]);
+    }
+    
+} else {
+    echo json_encode([
+        'success' => false,
+        'message' => 'Phương thức không được hỗ trợ'
+    ]);
+}
+?>