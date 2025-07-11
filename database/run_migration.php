<?php
// Migration script to fix application constraint issue

require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Starting migration to fix application constraint...\n";
    
    // Check if the unique constraint exists first
    $query = "SHOW INDEX FROM applications WHERE Key_name = 'unique_application'";
    $stmt = $db->query($query);
    
    if ($stmt->rowCount() > 0) {
        echo "Found unique_application constraint, removing it...\n";
        
        // Drop the existing unique constraint
        $query = "ALTER TABLE applications DROP INDEX unique_application";
        $db->exec($query);
        
        echo "✅ Successfully removed unique_application constraint.\n";
    } else {
        echo "ℹ️  Unique constraint not found, it may have been already removed.\n";
    }
    
    // Add comment to document this decision
    $query = "ALTER TABLE applications COMMENT = 'Applications table - allows re-applying after withdrawal'";
    $db->exec($query);
    
    echo "✅ Migration completed successfully!\n";
    echo "Candidates can now re-apply for jobs after withdrawing their applications.\n";
    
} catch (PDOException $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>