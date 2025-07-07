diff --git a/classes/Job.php b/classes/Job.php
--- a/classes/Job.php
+++ b/classes/Job.php
@@ -0,0 +1,165 @@
+<?php
+require_once '../config/database.php';
+
+class Job {
+    private $conn;
+    private $table_name = "jobs";
+
+    public $job_id;
+    public $company_id;
+    public $title;
+    public $description;
+    public $requirements;
+    public $salary;
+    public $location;
+    public $job_type;
+    public $status;
+    public $view_count;
+    public $application_count;
+    public $posted_at;
+    public $expires_at;
+
+    public function __construct($db) {
+        $this->conn = $db;
+    }
+
+    public function create() {
+        $query = "INSERT INTO " . $this->table_name . " 
+                  SET company_id = :company_id, title = :title, description = :description, 
+                      requirements = :requirements, salary = :salary, location = :location, 
+                      job_type = :job_type, expires_at = :expires_at";
+
+        $stmt = $this->conn->prepare($query);
+
+        $this->title = htmlspecialchars(strip_tags($this->title));
+        $this->description = htmlspecialchars(strip_tags($this->description));
+        $this->requirements = htmlspecialchars(strip_tags($this->requirements));
+        $this->location = htmlspecialchars(strip_tags($this->location));
+
+        $stmt->bindParam(":company_id", $this->company_id);
+        $stmt->bindParam(":title", $this->title);
+        $stmt->bindParam(":description", $this->description);
+        $stmt->bindParam(":requirements", $this->requirements);
+        $stmt->bindParam(":salary", $this->salary);
+        $stmt->bindParam(":location", $this->location);
+        $stmt->bindParam(":job_type", $this->job_type);
+        $stmt->bindParam(":expires_at", $this->expires_at);
+
+        if($stmt->execute()) {
+            $this->job_id = $this->conn->lastInsertId();
+            return true;
+        }
+        return false;
+    }
+
+    public function readAll($limit = 10, $offset = 0, $search = '', $location = '', $job_type = '') {
+        $query = "SELECT j.*, c.name as company_name, c.logo as company_logo 
+                  FROM " . $this->table_name . " j
+                  LEFT JOIN companies c ON j.company_id = c.company_id
+                  WHERE j.status = 'active' AND (j.expires_at IS NULL OR j.expires_at > NOW())";
+
+        if(!empty($search)) {
+            $query .= " AND (j.title LIKE :search OR j.description LIKE :search OR c.name LIKE :search)";
+        }
+        if(!empty($location)) {
+            $query .= " AND j.location LIKE :location";
+        }
+        if(!empty($job_type)) {
+            $query .= " AND j.job_type = :job_type";
+        }
+
+        $query .= " ORDER BY j.posted_at DESC LIMIT :limit OFFSET :offset";
+
+        $stmt = $this->conn->prepare($query);
+
+        if(!empty($search)) {
+            $search_param = "%{$search}%";
+            $stmt->bindParam(':search', $search_param);
+        }
+        if(!empty($location)) {
+            $location_param = "%{$location}%";
+            $stmt->bindParam(':location', $location_param);
+        }
+        if(!empty($job_type)) {
+            $stmt->bindParam(':job_type', $job_type);
+        }
+
+        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
+        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
+        $stmt->execute();
+
+        return $stmt;
+    }
+
+    public function readOne() {
+        $query = "SELECT j.*, c.name as company_name, c.description as company_description, 
+                         c.logo as company_logo, c.website as company_website
+                  FROM " . $this->table_name . " j
+                  LEFT JOIN companies c ON j.company_id = c.company_id
+                  WHERE j.job_id = :job_id";
+
+        $stmt = $this->conn->prepare($query);
+        $stmt->bindParam(":job_id", $this->job_id);
+        $stmt->execute();
+
+        if($stmt->rowCount() > 0) {
+            $row = $stmt->fetch(PDO::FETCH_ASSOC);
+            $this->company_id = $row['company_id'];
+            $this->title = $row['title'];
+            $this->description = $row['description'];
+            $this->requirements = $row['requirements'];
+            $this->salary = $row['salary'];
+            $this->location = $row['location'];
+            $this->job_type = $row['job_type'];
+            $this->status = $row['status'];
+            $this->view_count = $row['view_count'];
+            $this->application_count = $row['application_count'];
+            $this->posted_at = $row['posted_at'];
+            $this->expires_at = $row['expires_at'];
+            return $row;
+        }
+        return false;
+    }
+
+    public function incrementViewCount() {
+        $query = "UPDATE " . $this->table_name . " SET view_count = view_count + 1 WHERE job_id = :job_id";
+        $stmt = $this->conn->prepare($query);
+        $stmt->bindParam(":job_id", $this->job_id);
+        return $stmt->execute();
+    }
+
+    public function incrementApplicationCount() {
+        $query = "UPDATE " . $this->table_name . " SET application_count = application_count + 1 WHERE job_id = :job_id";
+        $stmt = $this->conn->prepare($query);
+        $stmt->bindParam(":job_id", $this->job_id);
+        return $stmt->execute();
+    }
+
+    public function update() {
+        $query = "UPDATE " . $this->table_name . " 
+                  SET title = :title, description = :description, requirements = :requirements,
+                      salary = :salary, location = :location, job_type = :job_type, 
+                      status = :status, expires_at = :expires_at
+                  WHERE job_id = :job_id";
+
+        $stmt = $this->conn->prepare($query);
+
+        $this->title = htmlspecialchars(strip_tags($this->title));
+        $this->description = htmlspecialchars(strip_tags($this->description));
+        $this->requirements = htmlspecialchars(strip_tags($this->requirements));
+        $this->location = htmlspecialchars(strip_tags($this->location));
+
+        $stmt->bindParam(":title", $this->title);
+        $stmt->bindParam(":description", $this->description);
+        $stmt->bindParam(":requirements", $this->requirements);
+        $stmt->bindParam(":salary", $this->salary);
+        $stmt->bindParam(":location", $this->location);
+        $stmt->bindParam(":job_type", $this->job_type);
+        $stmt->bindParam(":status", $this->status);
+        $stmt->bindParam(":expires_at", $this->expires_at);
+        $stmt->bindParam(":job_id", $this->job_id);
+
+        return $stmt->execute();
+    }
+}
+?>