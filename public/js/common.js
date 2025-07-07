(cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF'
diff --git a/public/js/common.js b/public/js/common.js
--- a/public/js/common.js
+++ b/public/js/common.js
@@ -0,0 +1,266 @@
+// Common JavaScript functions for the recruitment system
+
+// API base URL
+const API_BASE = '../api/';
+const AUTH_BASE = '../auth/';
+
+// Utility functions
+function showAlert(message, type = 'info') {
+    const alertClass = type === 'error' ? 'alert-error' : 
+                      type === 'success' ? 'alert-success' : 'alert-info';
+    
+    const alertHtml = `
+        <div class="alert ${alertClass}">
+            ${message}
+        </div>
+    `;
+    
+    // Find or create alert container
+    let alertContainer = document.getElementById('alert-container');
+    if (!alertContainer) {
+        alertContainer = document.createElement('div');
+        alertContainer.id = 'alert-container';
+        alertContainer.style.position = 'fixed';
+        alertContainer.style.top = '20px';
+        alertContainer.style.right = '20px';
+        alertContainer.style.zIndex = '9999';
+        alertContainer.style.maxWidth = '400px';
+        document.body.appendChild(alertContainer);
+    }
+    
+    alertContainer.innerHTML = alertHtml;
+    
+    // Auto hide after 5 seconds
+    setTimeout(() => {
+        alertContainer.innerHTML = '';
+    }, 5000);
+}
+
+// Format currency
+function formatCurrency(amount) {
+    if (!amount) return 'Thỏa thuận';
+    return new Intl.NumberFormat('vi-VN', {
+        style: 'currency',
+        currency: 'VND'
+    }).format(amount);
+}
+
+// Format date
+function formatDate(dateString) {
+    const date = new Date(dateString);
+    return date.toLocaleDateString('vi-VN', {
+        year: 'numeric',
+        month: 'long',
+        day: 'numeric'
+    });
+}
+
+// Format relative time
+function formatRelativeTime(dateString) {
+    const date = new Date(dateString);
+    const now = new Date();
+    const diffTime = Math.abs(now - date);
+    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
+    
+    if (diffDays === 1) return 'Hôm qua';
+    if (diffDays < 7) return `${diffDays} ngày trước`;
+    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} tuần trước`;
+    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} tháng trước`;
+    return `${Math.ceil(diffDays / 365)} năm trước`;
+}
+
+// API call wrapper
+async function apiCall(endpoint, options = {}) {
+    try {
+        const response = await fetch(endpoint, {
+            credentials: 'include', // Include cookies for session
+            headers: {
+                'Content-Type': 'application/json',
+                ...options.headers
+            },
+            ...options
+        });
+        
+        const data = await response.json();
+        return data;
+    } catch (error) {
+        console.error('API call failed:', error);
+        showAlert('Có lỗi xảy ra khi kết nối với server', 'error');
+        return { success: false, message: 'Network error' };
+    }
+}
+
+// Authentication functions
+async function login(email, password) {
+    const result = await apiCall(AUTH_BASE + 'login.php', {
+        method: 'POST',
+        body: JSON.stringify({ email, password })
+    });
+    
+    if (result.success) {
+        localStorage.setItem('user', JSON.stringify(result.user));
+        updateAuthUI(result.user);
+        showAlert(result.message, 'success');
+    } else {
+        showAlert(result.message, 'error');
+    }
+    
+    return result;
+}
+
+async function register(userData) {
+    const result = await apiCall(AUTH_BASE + 'register.php', {
+        method: 'POST',
+        body: JSON.stringify(userData)
+    });
+    
+    if (result.success) {
+        showAlert(result.message, 'success');
+    } else {
+        showAlert(result.message, 'error');
+    }
+    
+    return result;
+}
+
+async function logout() {
+    const result = await apiCall(AUTH_BASE + 'logout.php', {
+        method: 'POST'
+    });
+    
+    localStorage.removeItem('user');
+    updateAuthUI(null);
+    showAlert('Đăng xuất thành công', 'success');
+    
+    // Redirect to home page
+    if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
+        window.location.href = 'index.html';
+    }
+    
+    return result;
+}
+
+// Update authentication UI
+function updateAuthUI(user) {
+    const loggedOutMenu = document.getElementById('logged-out-menu');
+    const loggedInMenu = document.getElementById('logged-in-menu');
+    const userName = document.getElementById('user-name');
+    
+    if (user) {
+        if (loggedOutMenu) loggedOutMenu.style.display = 'none';
+        if (loggedInMenu) loggedInMenu.style.display = 'flex';
+        if (userName) userName.textContent = `Xin chào, ${user.full_name}`;
+    } else {
+        if (loggedOutMenu) loggedOutMenu.style.display = 'flex';
+        if (loggedInMenu) loggedInMenu.style.display = 'none';
+    }
+}
+
+// Check authentication status
+function checkAuth() {
+    const user = localStorage.getItem('user');
+    if (user) {
+        try {
+            const userData = JSON.parse(user);
+            updateAuthUI(userData);
+            return userData;
+        } catch (error) {
+            localStorage.removeItem('user');
+        }
+    }
+    updateAuthUI(null);
+    return null;
+}
+
+// Require authentication
+function requireAuth(userType = null) {
+    const user = checkAuth();
+    if (!user) {
+        showAlert('Bạn cần đăng nhập để truy cập trang này', 'error');
+        window.location.href = 'login.html';
+        return false;
+    }
+    
+    if (userType && user.user_type !== userType) {
+        showAlert('Bạn không có quyền truy cập trang này', 'error');
+        window.location.href = 'index.html';
+        return false;
+    }
+    
+    return user;
+}
+
+// Get current user
+function getCurrentUser() {
+    return checkAuth();
+}
+
+// Job functions
+async function getJobs(page = 1, filters = {}) {
+    const params = new URLSearchParams({
+        page: page,
+        ...filters
+    });
+    
+    return await apiCall(API_BASE + 'jobs.php?' + params);
+}
+
+async function getJob(jobId) {
+    return await apiCall(API_BASE + 'jobs.php?job_id=' + jobId);
+}
+
+async function applyForJob(jobId, coverLetter = '') {
+    return await apiCall(API_BASE + 'applications.php', {
+        method: 'POST',
+        body: JSON.stringify({ job_id: jobId, cover_letter: coverLetter })
+    });
+}
+
+async function getCandidateApplications() {
+    return await apiCall(API_BASE + 'applications.php?candidate_applications=1');
+}
+
+// Initialize common functionality
+document.addEventListener('DOMContentLoaded', function() {
+    // Check authentication status
+    checkAuth();
+    
+    // Setup logout button
+    const logoutBtn = document.getElementById('logout-btn');
+    if (logoutBtn) {
+        logoutBtn.addEventListener('click', logout);
+    }
+    
+    // Setup mobile menu toggle (if needed)
+    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
+    const navMenu = document.querySelector('.nav-menu');
+    if (mobileMenuToggle && navMenu) {
+        mobileMenuToggle.addEventListener('click', function() {
+            navMenu.classList.toggle('active');
+        });
+    }
+});
+
+// Global error handler
+window.addEventListener('error', function(e) {
+    console.error('Global error:', e.error);
+});
+
+// Export functions for use in other scripts
+window.RecruitmentApp = {
+    showAlert,
+    formatCurrency,
+    formatDate,
+    formatRelativeTime,
+    apiCall,
+    login,
+    register,
+    logout,
+    checkAuth,
+    requireAuth,
+    getCurrentUser,
+    getJobs,
+    getJob,
+    applyForJob,
+    getCandidateApplications
+};
EOF
)