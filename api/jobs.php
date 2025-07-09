<?php
session_start();
header('Content-Type: application/json');

include_once '../config/database.php';
include_once '../classes/Job.php';

$database = new Database();
$db = $database->getConnection();
$job = new Job($db);

if($_SERVER['REQUEST_METHOD'] == 'GET') {
    // Get jobs with pagination and filters
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    $location = isset($_GET['location']) ? $_GET['location'] : '';
    $job_type = isset($_GET['job_type']) ? $_GET['job_type'] : '';
    $offset = ($page - 1) * $limit;
    
    if(isset($_GET['recruiter_jobs'])) {
        // Get jobs for current recruiter
        if(!in_array($_SESSION['user_type'], ['recruiter', 'admin'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Không có quyền truy cập'
            ]);
            exit;
        }
        
        $user_id = $_SESSION['user_id'];
        
        // Get recruiter's company
        $query = "SELECT company_id FROM recruiters WHERE user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $company_id = $row['company_id'];
            
            if ($company_id) {
                // Get all jobs for this company
                $query = "SELECT j.*, c.name as company_name, 
                                 (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.job_id) as application_count
                          FROM jobs j
                          JOIN companies c ON j.company_id = c.company_id
                          WHERE j.company_id = :company_id
                          ORDER BY j.posted_at DESC";
                
                $stmt = $db->prepare($query);
                $stmt->bindParam(':company_id', $company_id);
                $stmt->execute();
                
                $jobs = [];
                while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    $jobs[] = $row;
                }
                
                echo json_encode([
                    'success' => true,
                    'data' => $jobs
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
        
    } elseif(isset($_GET['job_id']) || isset($_GET['id'])) {
        // Get single job
        $job->job_id = $_GET['job_id'] ?? $_GET['id'];
        $job_data = $job->readOne();
        
        if($job_data) {
            // Increment view count
            $job->incrementViewCount();
            
            echo json_encode([
                'success' => true,
                'data' => $job_data
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Không tìm thấy công việc'
            ]);
        }
    } else {
        // Get all jobs
        $stmt = $job->readAll($limit, $offset, $search, $location, $job_type);
        $jobs = [];
        
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $jobs[] = $row;
        }
        
        echo json_encode([
            'success' => true,
            'data' => $jobs,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => count($jobs)
            ]
        ]);
    }
    
} elseif($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Create new job (requires recruiter/admin authentication)
    if(!isset($_SESSION['logged_in']) || !in_array($_SESSION['user_type'], ['recruiter', 'admin'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Không có quyền truy cập'
        ]);
        exit;
    }
    
    $data = json_decode(file_get_contents("php://input"));
    
    // Get recruiter's company_id
    $user_id = $_SESSION['user_id'];
    $query = "SELECT company_id FROM recruiters WHERE user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    
    if($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $company_id = $row['company_id'];
        
        if (!$company_id) {
            echo json_encode([
                'success' => false,
                'message' => 'Bạn chưa được gán vào công ty nào. Vui lòng liên hệ admin để cập nhật thông tin công ty.'
            ]);
            exit;
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Không tìm thấy thông tin recruiter'
        ]);
        exit;
    }
    
    if(isset($data->title) && isset($data->description)) {
        $job->company_id = $company_id;  // Use recruiter's company_id
        $job->title = $data->title;
        $job->description = $data->description;
        $job->requirements = $data->requirements ?? '';
        $job->salary = $data->salary ?? null;
        $job->location = $data->location ?? '';
        $job->job_type = $data->job_type ?? 'full-time';
        $job->expires_at = $data->expires_at ?? null;
        
        if($job->create()) {
            echo json_encode([
                'success' => true,
                'message' => 'Tạo công việc thành công',
                'job_id' => $job->job_id
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi tạo công việc'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Vui lòng nhập đầy đủ thông tin'
        ]);
    }
    
} elseif($_SERVER['REQUEST_METHOD'] == 'PUT') {
    // Update job
    if(!isset($_SESSION['logged_in']) || !in_array($_SESSION['user_type'], ['recruiter', 'admin'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Không có quyền truy cập'
        ]);
        exit;
    }
    
    $data = json_decode(file_get_contents("php://input"));
    
    if(isset($data->job_id)) {
        $job->job_id = $data->job_id;
        $job->title = $data->title;
        $job->description = $data->description;
        $job->requirements = $data->requirements;
        $job->salary = $data->salary;
        $job->location = $data->location;
        $job->job_type = $data->job_type;
        $job->status = $data->status ?? 'active';
        $job->expires_at = $data->expires_at;
        
        if($job->update()) {
            echo json_encode([
                'success' => true,
                'message' => 'Cập nhật công việc thành công'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi cập nhật công việc'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Thiếu thông tin job_id'
        ]);
    }
    
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Phương thức không được hỗ trợ'
    ]);
}
?>