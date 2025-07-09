<?php
require_once '../config/database.php';

class User {
    private $conn;
    private $table_name = "users";

    public $user_id;
    public $email;
    public $password;
    public $full_name;
    public $phone;
    public $user_type;
    public $created_at;
    public $is_active;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET email = :email, password = :password, full_name = :full_name, phone = :phone, user_type = :user_type";

        $stmt = $this->conn->prepare($query);

        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->full_name = htmlspecialchars(strip_tags($this->full_name));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->user_type = htmlspecialchars(strip_tags($this->user_type));
        $this->password = password_hash($this->password, PASSWORD_DEFAULT);

        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":password", $this->password);
        $stmt->bindParam(":full_name", $this->full_name);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":user_type", $this->user_type);

        if($stmt->execute()) {
            $this->user_id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    public function login($email, $password) {
        $query = "SELECT user_id, email, password, full_name, user_type, phone, is_active 
                  FROM " . $this->table_name . " 
                  WHERE email = :email AND is_active = 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if(password_verify($password, $row['password'])) {
                $this->user_id = $row['user_id'];
                $this->email = $row['email'];
                $this->full_name = $row['full_name'];
                $this->user_type = $row['user_type'];
                $this->phone = $row['phone'];
                return true;
            }
        }
        return false;
    }

    public function emailExists() {
        $query = "SELECT user_id FROM " . $this->table_name . " WHERE email = :email";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $this->email);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function getUserType($user_id) {
        // Get user_type directly from users table
        $query = "SELECT user_type FROM " . $this->table_name . " WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row['user_type'];
        }
        return null;
    }

    public function readOne() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->email = $row['email'];
            $this->full_name = $row['full_name'];
            $this->phone = $row['phone'];
            $this->user_type = $row['user_type'];
            $this->created_at = $row['created_at'];
            $this->is_active = $row['is_active'];
            return true;
        }
        return false;
    }

    public function getUserInfo($user_id) {
        $query = "SELECT user_id, email, full_name, phone, user_type, created_at, is_active 
                  FROM " . $this->table_name . " 
                  WHERE user_id = :user_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        return null;
    }
}
?>