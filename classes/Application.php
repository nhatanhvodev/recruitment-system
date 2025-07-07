diff --git a/classes/Application.php b/classes/Application.php
--- a/classes/Application.php
+++ b/classes/Application.php
@@ -0,0 +1,127 @@
+<?php
+require_once '../config/database.php';
+
+class Application {
+    private $conn;
+    private $table_name = "applications";
+
+    public $application_id;
+    public $job_id;
+    public $candidate_id;
+    public $cover_letter;
+    public $status;
+    public $applied_at;
+    public $reviewed_at;
+
+    public function __construct($db) {
+        $this->conn = $db;
+    }
+
+    public function create() {
+        // Check if application already exists
+        if($this->applicationExists()) {
+            return false;
+        }
+
+        $query = "INSERT INTO " . $this->table_name . " 
+                  SET job_id = :job_id, candidate_id = :candidate_id, cover_letter = :cover_letter";
+
+        $stmt = $this->conn->prepare($query);
+
+        $this->cover_letter = htmlspecialchars(strip_tags($this->cover_letter));
+
+        $stmt->bindParam(":job_id", $this->job_id);
+        $stmt->bindParam(":candidate_id", $this->candidate_id);
+        $stmt->bindParam(":cover_letter", $this->cover_letter);
+
+        if($stmt->execute()) {
+            $this->application_id = $this->conn->lastInsertId();
+            return true;
+        }
+        return false;
+    }
+
+    public function applicationExists() {
+        $query = "SELECT application_id FROM " . $this->table_name . " 
+                  WHERE job_id = :job_id AND candidate_id = :candidate_id";
+        
+        $stmt = $this->conn->prepare($query);
+        $stmt->bindParam(":job_id", $this->job_id);
+        $stmt->bindParam(":candidate_id", $this->candidate_id);
+        $stmt->execute();
+
+        return $stmt->rowCount() > 0;
+    }
+
+    public function getApplicationsByCandidate($candidate_id) {
+        $query = "SELECT a.*, j.title as job_title, j.location, j.salary, 
+                         c.name as company_name, j.posted_at, j.job_type
+                  FROM " . $this->table_name . " a
+                  LEFT JOIN jobs j ON a.job_id = j.job_id
+                  LEFT JOIN companies c ON j.company_id = c.company_id
+                  WHERE a.candidate_id = :candidate_id
+                  ORDER BY a.applied_at DESC";
+
+        $stmt = $this->conn->prepare($query);
+        $stmt->bindParam(":candidate_id", $candidate_id);
+        $stmt->execute();
+
+        return $stmt;
+    }
+
+    public function getApplicationsByJob($job_id) {
+        $query = "SELECT a.*, u.full_name, u.email, u.phone, p.summary, p.skills
+                  FROM " . $this->table_name . " a
+                  LEFT JOIN candidates can ON a.candidate_id = can.candidate_id
+                  LEFT JOIN users u ON can.user_id = u.user_id
+                  LEFT JOIN profiles p ON can.profile_id = p.profile_id
+                  WHERE a.job_id = :job_id
+                  ORDER BY a.applied_at DESC";
+
+        $stmt = $this->conn->prepare($query);
+        $stmt->bindParam(":job_id", $job_id);
+        $stmt->execute();
+
+        return $stmt;
+    }
+
+    public function updateStatus($application_id, $status) {
+        $query = "UPDATE " . $this->table_name . " 
+                  SET status = :status, reviewed_at = NOW() 
+                  WHERE application_id = :application_id";
+
+        $stmt = $this->conn->prepare($query);
+        $stmt->bindParam(":status", $status);
+        $stmt->bindParam(":application_id", $application_id);
+
+        return $stmt->execute();
+    }
+
+    public function readOne() {
+        $query = "SELECT a.*, j.title as job_title, j.description as job_description,
+                         c.name as company_name, u.full_name, u.email
+                  FROM " . $this->table_name . " a
+                  LEFT JOIN jobs j ON a.job_id = j.job_id
+                  LEFT JOIN companies c ON j.company_id = c.company_id
+                  LEFT JOIN candidates can ON a.candidate_id = can.candidate_id
+                  LEFT JOIN users u ON can.user_id = u.user_id
+                  WHERE a.application_id = :application_id";
+
+        $stmt = $this->conn->prepare($query);
+        $stmt->bindParam(":application_id", $this->application_id);
+        $stmt->execute();
+
+        if($stmt->rowCount() > 0) {
+            $row = $stmt->fetch(PDO::FETCH_ASSOC);
+            $this->job_id = $row['job_id'];
+            $this->candidate_id = $row['candidate_id'];
+            $this->cover_letter = $row['cover_letter'];
+            $this->status = $row['status'];
+            $this->applied_at = $row['applied_at'];
+            $this->reviewed_at = $row['reviewed_at'];
+            return $row;
+        }
+        return false;
+    }
+}
+?>