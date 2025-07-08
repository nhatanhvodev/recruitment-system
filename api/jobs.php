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
    
    if(isset($_GET['job_id'])) {
        // Get single job
        $job->job_id = $_GET['job_id'];
        $job_data = $job->readone();
        
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
    
    if(isset($data->title) && isset($data->description) && isset($data->company_id)) {
        $job->company_id = $data->company_id;
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