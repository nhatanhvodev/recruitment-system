<?php
session_start();
header('Content-Type: application/json');

include_once '../config/database.php';
include_once '../classes/Application.php';
include_once '../classes/Job.php';

$database = new Database();
$db = $database->getConnection();
$application = new Application($db);
$job = new Job($db);

if($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Submit application
    if(!isset($_SESSION['logged_in']) || $_SESSION['user_type'] != 'candidate') {
        echo json_encode([
            'success' => false,
            'message' => 'Bạn cần đăng nhập với tài khoản ứng viên'
        ]);
        exit;
    }
    
    $data = json_decode(file_get_contents("php://input"));
    
    if(isset($data->job_id)) {
        // Get candidate_id from session
        $user_id = $_SESSION['user_id'];
        $query = "SELECT candidate_id FROM candidates WHERE user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $candidate_id = $row['candidate_id'];
            
            $application->job_id = $data->job_id;
            $application->candidate_id = $candidate_id;
            $application->cover_letter = $data->cover_letter ?? '';
            
            if($application->create()) {
                // Increment job application count
                $job->job_id = $data->job_id;
                $job->incrementApplicationCount();
                
                // Record statistics
                $query = "INSERT INTO statistics (entity_type, entity_id, metric_type, value, date) 
                         VALUES ('job', :job_id, 'application', 1, CURDATE())
                         ON DUPLICATE KEY UPDATE value = value + 1";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':job_id', $data->job_id);
                $stmt->execute();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Nộp đơn thành công'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Bạn đã nộp đơn cho công việc này rồi'
                ]);
            }
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Không tìm thấy thông tin ứng viên'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Thiếu thông tin job_id'
        ]);
    }
    
} elseif($_SERVER['REQUEST_METHOD'] == 'GET') {
    if(!isset($_SESSION['logged_in'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Bạn cần đăng nhập'
        ]);
        exit;
    }
    
    if(isset($_GET['candidate_applications'])) {
        // Get applications by candidate
        if($_SESSION['user_type'] != 'candidate') {
            echo json_encode([
                'success' => false,
                'message' => 'Không có quyền truy cập'
            ]);
            exit;
        }
        
        $user_id = $_SESSION['user_id'];
        $query = "SELECT candidate_id FROM candidates WHERE user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $candidate_id = $row['candidate_id'];
            
            $stmt = $application->getApplicationsByCandidate($candidate_id);
            $applications = [];
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $applications[] = $row;
            }
            
            echo json_encode([
                'success' => true,
                'data' => $applications
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Không tìm thấy thông tin ứng viên'
            ]);
        }
        
    } elseif(isset($_GET['recruiter_applications'])) {
        // Get all applications for recruiter's jobs
        if(!in_array($_SESSION['user_type'], ['recruiter', 'admin'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Không có quyền truy cập'
            ]);
            exit;
        }
        
        $user_id = $_SESSION['user_id'];
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
        
        // Get recruiter's company
        $query = "SELECT company_id FROM recruiters WHERE user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $company_id = $row['company_id'];
            
            if ($company_id) {
                // Get applications for all jobs of this company
                $query = "SELECT a.*, j.title as job_title, j.location as job_location, j.salary,
                                 u.full_name as candidate_name, u.email as candidate_email, u.phone as candidate_phone,
                                 c.name as company_name
                          FROM applications a
                          JOIN jobs j ON a.job_id = j.job_id
                          JOIN candidates cd ON a.candidate_id = cd.candidate_id
                          JOIN users u ON cd.user_id = u.user_id
                          JOIN companies c ON j.company_id = c.company_id
                          WHERE j.company_id = :company_id
                          ORDER BY a.applied_at DESC
                          LIMIT :limit";
                
                $stmt = $db->prepare($query);
                $stmt->bindParam(':company_id', $company_id);
                $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
                $stmt->execute();
                
                $applications = [];
                while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    $applications[] = $row;
                }
                
                echo json_encode([
                    'success' => true,
                    'data' => $applications
                ]);
            } else {
                // Recruiter hasn't been assigned to a company yet
                echo json_encode([
                    'success' => true,
                    'data' => [],
                    'message' => 'Chưa được gán vào công ty nào. Vui lòng liên hệ admin để cập nhật thông tin công ty.'
                ]);
            }
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Không tìm thấy thông tin recruiter'
            ]);
        }
        
    } elseif(isset($_GET['job_id'])) {
        // Get applications for a job (for recruiters)
        if(!in_array($_SESSION['user_type'], ['recruiter', 'admin'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Không có quyền truy cập'
            ]);
            exit;
        }
        
        $stmt = $application->getApplicationsByJob($_GET['job_id']);
        $applications = [];
        
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $applications[] = $row;
        }
        
        echo json_encode([
            'success' => true,
            'data' => $applications
        ]);
    }
    
} elseif($_SERVER['REQUEST_METHOD'] == 'PUT') {
    // Update application status
    if(!isset($_SESSION['logged_in'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Bạn cần đăng nhập'
        ]);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"));

    if(isset($data->application_id) && isset($data->status)) {
        // Nếu là ứng viên thì chỉ cho phép rút đơn của chính mình
        if($_SESSION['user_type'] == 'candidate' && $data->status == 'withdrawn') {
            $user_id = $_SESSION['user_id'];
            // Lấy candidate_id từ user_id
            $query = "SELECT candidate_id FROM candidates WHERE user_id = :user_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            if($stmt->rowCount() > 0) {
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                $candidate_id = $row['candidate_id'];
                // Kiểm tra đơn này có phải của ứng viên không
                $query = "SELECT * FROM applications WHERE application_id = :application_id AND candidate_id = :candidate_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':application_id', $data->application_id);
                $stmt->bindParam(':candidate_id', $candidate_id);
                $stmt->execute();
                if($stmt->rowCount() > 0) {
                    if($application->updateStatus($data->application_id, 'withdrawn')) {
                        // Lấy job_id của đơn ứng tuyển này
                        $query = "SELECT job_id FROM applications WHERE application_id = :application_id";
                        $stmt = $db->prepare($query);
                        $stmt->bindParam(':application_id', $data->application_id);
                        $stmt->execute();
                        if($stmt->rowCount() > 0) {
                            $row = $stmt->fetch(PDO::FETCH_ASSOC);
                            $job->job_id = $row['job_id'];
                            $job->decrementApplicationCount();
                        }
                        echo json_encode([
                            'success' => true,
                            'message' => 'Đã rút đơn thành công'
                        ]);
                    } else {
                        echo json_encode([
                            'success' => false,
                            'message' => 'Có lỗi xảy ra khi rút đơn'
                        ]);
                    }
                } else {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Bạn không có quyền rút đơn này'
                    ]);
                }
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Không tìm thấy thông tin ứng viên'
                ]);
            }
        }
        // Nếu là recruiter hoặc admin thì giữ nguyên logic cũ
        else if(in_array($_SESSION['user_type'], ['recruiter', 'admin'])) {
            if($application->updateStatus($data->application_id, $data->status)) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Cập nhật trạng thái thành công'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Có lỗi xảy ra khi cập nhật'
                ]);
            }
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Không có quyền thực hiện thao tác này'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Thiếu thông tin'
        ]);
    }
}
?>