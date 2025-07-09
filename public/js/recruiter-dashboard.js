// Recruiter Dashboard JavaScript

let currentUser = null;
let currentTab = 'overview';
let jobsData = [];
let applicantsData = [];
let notificationsData = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

async function initializeDashboard() {
    // Check authentication
    if (!checkRecruiterAuth()) {
        return;
    }
    
    // Setup UI components
    setupTabs();
    setupModals();
    setupNotifications();
    setupUserMenu();
    setupQuickActions();
    
    // Load initial data
    await loadDashboardData();
    
    // Setup auto-refresh
    setInterval(refreshNotifications, 30000); // Every 30 seconds
}

function checkRecruiterAuth() {
    currentUser = RecruitmentApp.getCurrentUser();
    
    if (!currentUser) {
        RecruitmentApp.showAlert('Bạn cần đăng nhập để truy cập trang này', 'error');
        window.location.href = 'login.html';
        return false;
    }
    
    if (currentUser.user_type !== 'recruiter') {
        RecruitmentApp.showAlert('Chỉ nhà tuyển dụng mới có thể truy cập trang này', 'error');
        window.location.href = 'dashboard.html';
        return false;
    }
    
    // Update user info in header
    document.getElementById('user-name').textContent = currentUser.full_name;
    
    return true;
}

// Tab Management
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            switchTab(targetTab);
        });
    });
    
    // Handle view-all links
    document.querySelectorAll('.view-all').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetTab = this.dataset.tab;
            if (targetTab) {
                switchTab(targetTab);
            }
        });
    });
}

function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    currentTab = tabName;
    
    // Load tab-specific data
    loadTabData(tabName);
}

async function loadTabData(tabName) {
    showLoading();
    
    try {
        switch (tabName) {
            case 'overview':
                await loadOverviewData();
                break;
            case 'jobs':
                await loadJobsData();
                break;
            case 'applicants':
                await loadApplicantsData();
                break;
            case 'analytics':
                await loadAnalyticsData();
                break;
            case 'profile':
                await loadProfileData();
                break;
        }
    } catch (error) {
        console.error(`Error loading ${tabName} data:`, error);
        RecruitmentApp.showAlert('Có lỗi xảy ra khi tải dữ liệu', 'error');
    } finally {
        hideLoading();
    }
}

// Dashboard Data Loading
async function loadDashboardData() {
    showLoading();
    
    try {
        // Load all data in parallel
        const [jobsResult, applicantsResult] = await Promise.all([
            RecruitmentApp.apiCall('../api/jobs.php?recruiter_jobs=1'),
            RecruitmentApp.apiCall('../api/applications.php?recruiter_applications=1')
        ]);
        
        if (jobsResult.success) {
            jobsData = jobsResult.data;
            updateJobsBadge();
        }
        
        if (applicantsResult.success) {
            applicantsData = applicantsResult.data;
            updateApplicantsBadge();
        }
        
        // Load initial tab data
        await loadTabData(currentTab);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    } finally {
        hideLoading();
    }
}

function updateJobsBadge() {
    document.getElementById('jobs-count').textContent = jobsData.length;
}

function updateApplicantsBadge() {
    const pendingCount = applicantsData.filter(app => app.status === 'pending').length;
    document.getElementById('pending-applicants').textContent = pendingCount;
}

// Overview Tab
async function loadOverviewData() {
    // Calculate stats
    const totalJobs = jobsData.length;
    const activeJobs = jobsData.filter(job => job.status === 'active').length;
    const totalViews = jobsData.reduce((sum, job) => sum + (parseInt(job.view_count) || 0), 0);
    const totalApplicants = applicantsData.length;
    const hiredCount = applicantsData.filter(app => app.status === 'accepted').length;
    
    // Update stats cards
    document.getElementById('total-jobs').textContent = totalJobs;
    document.getElementById('total-views').textContent = totalViews.toLocaleString();
    document.getElementById('total-applicants').textContent = totalApplicants;
    document.getElementById('total-hired').textContent = hiredCount;
    
    // Load recent applicants
    loadRecentApplicants();
    
    // Load hot jobs
    loadHotJobs();
    
    // Load performance chart
    loadPerformanceChart();
}

function loadRecentApplicants() {
    const recentApplicants = applicantsData
        .sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at))
        .slice(0, 5);
    
    const container = document.getElementById('recent-applicants');
    
    if (recentApplicants.length === 0) {
        container.innerHTML = `
            <div class="empty-state-small">
                <i class="fas fa-user-plus"></i>
                <p>Chưa có ứng viên mới</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentApplicants.map(applicant => `
        <div class="recent-item" onclick="viewApplicantDetail(${applicant.application_id})">
            <div class="recent-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="recent-info">
                <h5>${applicant.candidate_name}</h5>
                <p>${applicant.job_title}</p>
                <span class="recent-time">${RecruitmentApp.timeAgo(applicant.applied_at)}</span>
            </div>
            <div class="recent-status status-${applicant.status}">
                ${getStatusText(applicant.status)}
            </div>
        </div>
    `).join('');
}

function loadHotJobs() {
    const hotJobs = jobsData
        .filter(job => job.status === 'active')
        .sort((a, b) => (parseInt(b.application_count) || 0) - (parseInt(a.application_count) || 0))
        .slice(0, 5);
    
    const container = document.getElementById('hot-jobs');
    
    if (hotJobs.length === 0) {
        container.innerHTML = `
            <div class="empty-state-small">
                <i class="fas fa-briefcase"></i>
                <p>Chưa có tin tuyển dụng</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = hotJobs.map(job => `
        <div class="hot-job-item" onclick="editJob(${job.job_id})">
            <div class="hot-job-info">
                <h5>${job.title}</h5>
                <p><i class="fas fa-users"></i> ${job.application_count || 0} ứng viên</p>
                <p><i class="fas fa-eye"></i> ${job.view_count || 0} lượt xem</p>
            </div>
            <div class="hot-job-trend">
                <i class="fas fa-fire text-danger"></i>
            </div>
        </div>
    `).join('');
}

function loadPerformanceChart() {
    // Simple chart implementation
    const container = document.getElementById('performance-chart');
    
    // Generate sample data for the last 7 days
    const days = [];
    const applications = [];
    const views = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toLocaleDateString('vi-VN', { weekday: 'short' }));
        
        // Sample data - in real app, this would come from API
        applications.push(Math.floor(Math.random() * 10) + 5);
        views.push(Math.floor(Math.random() * 50) + 20);
    }
    
    container.innerHTML = `
        <div class="chart-placeholder">
            <div class="chart-legend">
                <div class="legend-item">
                    <div class="legend-color" style="background: var(--primary-color)"></div>
                    <span>Ứng viên</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: var(--success-color)"></div>
                    <span>Lượt xem</span>
                </div>
            </div>
            <div class="chart-message">
                <i class="fas fa-chart-line"></i>
                <p>Biểu đồ hiệu suất 7 ngày qua</p>
            </div>
        </div>
    `;
}

// Jobs Tab
async function loadJobsData() {
    const container = document.getElementById('jobs-list');
    
    if (jobsData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-briefcase"></i>
                <h3>Chưa có tin tuyển dụng nào</h3>
                <p>Bắt đầu bằng cách đăng tin tuyển dụng đầu tiên</p>
                <button class="btn btn-primary" onclick="openJobModal()">
                    <i class="fas fa-plus"></i> Đăng tin ngay
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = jobsData.map(job => createJobCard(job)).join('');
    
    // Setup filters
    setupJobsFilters();
}

function createJobCard(job) {
    const statusClass = `status-${job.status}`;
    const statusText = getStatusText(job.status);
    
    return `
        <div class="job-card" data-job-id="${job.job_id}" data-status="${job.status}">
            <div class="job-card-header">
                <div>
                    <h3 class="job-title">${job.title}</h3>
                    <div class="job-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                        <span><i class="fas fa-briefcase"></i> ${job.job_type}</span>
                        ${job.salary ? `<span><i class="fas fa-money-bill"></i> ${RecruitmentApp.formatCurrency(job.salary)}</span>` : ''}
                        <span><i class="fas fa-calendar"></i> ${RecruitmentApp.formatDate(job.posted_at)}</span>
                    </div>
                </div>
                <div class="job-status ${statusClass}">${statusText}</div>
            </div>
            
            <div class="job-stats">
                <div class="stat-item">
                    <i class="fas fa-eye"></i>
                    <span>${job.view_count || 0} lượt xem</span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-users"></i>
                    <span>${job.application_count || 0} ứng viên</span>
                </div>
            </div>
            
            <div class="job-actions">
                <button class="btn btn-outline btn-sm" onclick="viewJob(${job.job_id})">
                    <i class="fas fa-eye"></i> Xem
                </button>
                <button class="btn btn-primary btn-sm" onclick="editJob(${job.job_id})">
                    <i class="fas fa-edit"></i> Sửa
                </button>
                ${job.application_count > 0 ? `
                    <button class="btn btn-success btn-sm" onclick="viewJobApplicants(${job.job_id})">
                        <i class="fas fa-users"></i> Ứng viên
                    </button>
                ` : ''}
                ${job.status === 'draft' ? `
                    <button class="btn btn-success btn-sm" onclick="publishJob(${job.job_id})">
                        <i class="fas fa-paper-plane"></i> Đăng
                    </button>
                ` : ''}
                <button class="btn btn-danger btn-sm" onclick="deleteJob(${job.job_id})">
                    <i class="fas fa-trash"></i> Xóa
                </button>
            </div>
        </div>
    `;
}

function setupJobsFilters() {
    const statusFilter = document.getElementById('jobs-status-filter');
    const searchInput = document.getElementById('jobs-search');
    
    statusFilter.addEventListener('change', filterJobs);
    searchInput.addEventListener('input', filterJobs);
}

function filterJobs() {
    const statusFilter = document.getElementById('jobs-status-filter').value;
    const searchTerm = document.getElementById('jobs-search').value.toLowerCase();
    
    const jobCards = document.querySelectorAll('.job-card');
    
    jobCards.forEach(card => {
        const status = card.dataset.status;
        const title = card.querySelector('.job-title').textContent.toLowerCase();
        
        const statusMatch = statusFilter === 'all' || status === statusFilter;
        const searchMatch = title.includes(searchTerm);
        
        card.style.display = statusMatch && searchMatch ? 'block' : 'none';
    });
}

// Applicants Tab
async function loadApplicantsData() {
    const container = document.getElementById('applicants-list');
    
    if (applicantsData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>Chưa có ứng viên nào</h3>
                <p>Ứng viên sẽ xuất hiện ở đây khi họ ứng tuyển vào tin tuyển dụng của bạn</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = applicantsData.map(applicant => createApplicantCard(applicant)).join('');
    
    // Setup filters
    setupApplicantsFilters();
}

function createApplicantCard(applicant) {
    const statusClass = `status-${applicant.status}`;
    const statusText = getStatusText(applicant.status);
    
    return `
        <div class="applicant-card" data-applicant-id="${applicant.application_id}" data-status="${applicant.status}">
            <div class="applicant-header">
                <div class="applicant-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="applicant-info">
                    <h4>${applicant.candidate_name}</h4>
                    <p>${applicant.candidate_email}</p>
                    ${applicant.candidate_phone ? `<p><i class="fas fa-phone"></i> ${applicant.candidate_phone}</p>` : ''}
                </div>
                <div class="applicant-status ${statusClass}">${statusText}</div>
            </div>
            
            <div class="applicant-job">
                <strong>Ứng tuyển:</strong> ${applicant.job_title}
                <br>
                <small><i class="fas fa-calendar"></i> ${RecruitmentApp.formatDate(applicant.applied_at)}</small>
            </div>
            
            ${applicant.cover_letter ? `
                <div class="applicant-cover-letter">
                    <strong>Thư xin việc:</strong>
                    <p>${applicant.cover_letter.length > 100 ? applicant.cover_letter.substring(0, 100) + '...' : applicant.cover_letter}</p>
                </div>
            ` : ''}
            
            <div class="applicant-actions">
                <button class="btn btn-outline btn-sm" onclick="viewApplicantDetail(${applicant.application_id})">
                    <i class="fas fa-eye"></i> Chi tiết
                </button>
                ${applicant.status === 'pending' ? `
                    <button class="btn btn-primary btn-sm" onclick="updateApplicationStatus(${applicant.application_id}, 'reviewed')">
                        <i class="fas fa-check"></i> Đã xem
                    </button>
                ` : ''}
                ${['pending', 'reviewed'].includes(applicant.status) ? `
                    <button class="btn btn-success btn-sm" onclick="updateApplicationStatus(${applicant.application_id}, 'interview')">
                        <i class="fas fa-calendar-check"></i> Phỏng vấn
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="updateApplicationStatus(${applicant.application_id}, 'accepted')">
                        <i class="fas fa-handshake"></i> Nhận
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="updateApplicationStatus(${applicant.application_id}, 'rejected')">
                        <i class="fas fa-times"></i> Từ chối
                    </button>
                ` : ''}
                <button class="btn btn-info btn-sm" onclick="contactApplicant('${applicant.candidate_email}', '${applicant.candidate_name}')">
                    <i class="fas fa-envelope"></i> Liên hệ
                </button>
            </div>
        </div>
    `;
}

function setupApplicantsFilters() {
    const jobFilter = document.getElementById('applicants-job-filter');
    const statusFilter = document.getElementById('applicants-status-filter');
    const searchInput = document.getElementById('applicants-search');
    
    // Populate job filter
    const uniqueJobs = [...new Set(applicantsData.map(app => app.job_title))];
    jobFilter.innerHTML = '<option value="all">Tất cả tin tuyển dụng</option>' +
        uniqueJobs.map(job => `<option value="${job}">${job}</option>`).join('');
    
    jobFilter.addEventListener('change', filterApplicants);
    statusFilter.addEventListener('change', filterApplicants);
    searchInput.addEventListener('input', filterApplicants);
}

function filterApplicants() {
    const jobFilter = document.getElementById('applicants-job-filter').value;
    const statusFilter = document.getElementById('applicants-status-filter').value;
    const searchTerm = document.getElementById('applicants-search').value.toLowerCase();
    
    const applicantCards = document.querySelectorAll('.applicant-card');
    
    applicantCards.forEach(card => {
        const status = card.dataset.status;
        const name = card.querySelector('.applicant-info h4').textContent.toLowerCase();
        const jobTitle = card.querySelector('.applicant-job').textContent.toLowerCase();
        
        const statusMatch = statusFilter === 'all' || status === statusFilter;
        const jobMatch = jobFilter === 'all' || jobTitle.includes(jobFilter.toLowerCase());
        const searchMatch = name.includes(searchTerm) || jobTitle.includes(searchTerm);
        
        card.style.display = statusMatch && jobMatch && searchMatch ? 'block' : 'none';
    });
}

// Modal Management
function setupModals() {
    // Close modals when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAllModals();
            }
        });
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('active');
    });
}

function openJobModal(jobId = null) {
    const modal = document.getElementById('job-posting-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('job-posting-form');
    
    modalTitle.textContent = jobId ? 'Chỉnh sửa tin tuyển dụng' : 'Đăng tin tuyển dụng';
    
    // Generate job form
    form.innerHTML = generateJobForm(jobId);
    
    modal.classList.add('active');
    
    if (jobId) {
        loadJobDataToForm(jobId);
    }
}

function closeJobModal() {
    document.getElementById('job-posting-modal').classList.remove('active');
}

function generateJobForm(jobId = null) {
    return `
        <div class="form-section">
            <h4><i class="fas fa-info-circle"></i> Thông tin cơ bản</h4>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-job-title">Tiêu đề công việc *</label>
                    <input type="text" id="modal-job-title" name="title" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-job-type">Loại công việc *</label>
                    <select id="modal-job-type" name="job_type" required>
                        <option value="full-time">Toàn thời gian</option>
                        <option value="part-time">Bán thời gian</option>
                        <option value="contract">Hợp đồng</option>
                        <option value="internship">Thực tập</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="modal-job-location">Địa điểm *</label>
                    <input type="text" id="modal-job-location" name="location" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-job-salary">Mức lương (VNĐ)</label>
                    <input type="number" id="modal-job-salary" name="salary" min="1000000">
                </div>
                <div class="form-group">
                    <label for="modal-job-expires">Hạn nộp hồ sơ</label>
                    <input type="date" id="modal-job-expires" name="expires_at">
                </div>
            </div>
            
            <div class="form-group">
                <label for="modal-job-description">Mô tả công việc *</label>
                <textarea id="modal-job-description" name="description" rows="4" required></textarea>
            </div>
            
            <div class="form-group">
                <label for="modal-job-requirements">Yêu cầu ứng viên *</label>
                <textarea id="modal-job-requirements" name="requirements" rows="4" required></textarea>
            </div>
        </div>
        
        <div class="form-actions">
            <button type="button" class="btn btn-outline" onclick="closeJobModal()">Hủy</button>
            <button type="button" class="btn btn-secondary" onclick="saveJobDraft()">Lưu nháp</button>
            <button type="submit" class="btn btn-primary" onclick="submitJobForm(${jobId})">
                ${jobId ? 'Cập nhật' : 'Đăng tin'}
            </button>
        </div>
    `;
}

// Quick Actions
function setupQuickActions() {
    document.getElementById('quick-post-job').addEventListener('click', function() {
        openQuickJobModal();
    });
    
    document.getElementById('detailed-post-job').addEventListener('click', function() {
        openJobModal();
    });
    
    document.getElementById('create-job-btn').addEventListener('click', function() {
        openJobModal();
    });
}

function openQuickJobModal() {
    // For quick job posting, we'll use a simplified form
    openJobModal();
}

// Utility Functions
function getStatusText(status) {
    const statusMap = {
        'pending': 'Đang chờ',
        'reviewed': 'Đã xem',
        'interview': 'Phỏng vấn',
        'accepted': 'Đã nhận',
        'rejected': 'Từ chối',
        'active': 'Hoạt động',
        'draft': 'Nháp',
        'expired': 'Hết hạn'
    };
    return statusMap[status] || status;
}

function showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

// Event Handlers for existing functions
async function updateApplicationStatus(applicationId, status) {
    try {
        const result = await RecruitmentApp.apiCall('../api/applications.php', {
            method: 'PUT',
            body: JSON.stringify({
                application_id: applicationId,
                status: status
            })
        });
        
        if (result.success) {
            RecruitmentApp.showAlert('Đã cập nhật trạng thái thành công', 'success');
            await loadDashboardData();
        } else {
            RecruitmentApp.showAlert(result.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Error updating application status:', error);
        RecruitmentApp.showAlert('Có lỗi xảy ra', 'error');
    }
}

function contactApplicant(email, name) {
    const subject = encodeURIComponent(`Phản hồi đơn ứng tuyển - ${name}`);
    const body = encodeURIComponent(`Xin chào ${name},\n\nCảm ơn bạn đã ứng tuyển vào công ty chúng tôi.`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
}

function viewJob(jobId) {
    window.open(`job-detail.html?id=${jobId}`, '_blank');
}

function editJob(jobId) {
    openJobModal(jobId);
}

function viewJobApplicants(jobId) {
    switchTab('applicants');
    // Filter applicants by job
    setTimeout(() => {
        const jobFilter = document.getElementById('applicants-job-filter');
        const job = jobsData.find(j => j.job_id == jobId);
        if (job && jobFilter) {
            jobFilter.value = job.title;
            filterApplicants();
        }
    }, 100);
}

async function publishJob(jobId) {
    try {
        const result = await RecruitmentApp.apiCall('../api/jobs.php', {
            method: 'PUT',
            body: JSON.stringify({
                job_id: jobId,
                status: 'pending'
            })
        });
        
        if (result.success) {
            RecruitmentApp.showAlert('Đã gửi tin để duyệt', 'success');
            await loadDashboardData();
        } else {
            RecruitmentApp.showAlert(result.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Error publishing job:', error);
        RecruitmentApp.showAlert('Có lỗi xảy ra', 'error');
    }
}

async function deleteJob(jobId) {
    if (!confirm('Bạn có chắc muốn xóa tin tuyển dụng này?')) return;
    
    try {
        const result = await RecruitmentApp.apiCall(`../api/jobs.php?id=${jobId}`, {
            method: 'DELETE'
        });
        
        if (result.success) {
            RecruitmentApp.showAlert('Đã xóa tin tuyển dụng', 'success');
            await loadDashboardData();
        } else {
            RecruitmentApp.showAlert(result.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Error deleting job:', error);
        RecruitmentApp.showAlert('Có lỗi xảy ra', 'error');
    }
}

// Notifications
function setupNotifications() {
    const notificationBtn = document.getElementById('notification-btn');
    const dropdown = document.getElementById('notification-dropdown');
    
    notificationBtn.addEventListener('click', function() {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!notificationBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

function setupUserMenu() {
    const userMenuBtn = document.getElementById('user-menu-btn');
    const dropdown = userMenuBtn.nextElementSibling;
    
    userMenuBtn.addEventListener('click', function() {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!userMenuBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
    
    // Setup logout
    document.getElementById('logout-btn').addEventListener('click', function() {
        RecruitmentApp.logout();
    });
}

async function refreshNotifications() {
    // Implementation for refreshing notifications
    const pendingCount = applicantsData.filter(app => app.status === 'pending').length;
    document.getElementById('notification-count').textContent = pendingCount;
}

// Placeholder functions for missing data loading
async function loadAnalyticsData() {
    const container = document.querySelector('#analytics-tab .analytics-grid');
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-chart-bar"></i>
            <h3>Tính năng thống kê</h3>
            <p>Sẽ được cập nhật trong phiên bản tiếp theo</p>
        </div>
    `;
}

async function loadProfileData() {
    const container = document.getElementById('profile-content');
    container.innerHTML = `
        <div class="profile-form">
            <div class="form-row">
                <div class="form-group">
                    <label>Họ và tên</label>
                    <input type="text" value="${currentUser.full_name || ''}" id="profile-fullname">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" value="${currentUser.email}" readonly>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Số điện thoại</label>
                    <input type="tel" value="${currentUser.phone || ''}" id="profile-phone">
                </div>
                <div class="form-group">
                    <label>Chức vụ</label>
                    <input type="text" value="${currentUser.position || ''}" id="profile-position">
                </div>
            </div>
            <div class="form-actions">
                <button class="btn btn-primary" onclick="updateProfile()">
                    <i class="fas fa-save"></i> Lưu thay đổi
                </button>
            </div>
        </div>
    `;
}

// Global functions
window.updateApplicationStatus = updateApplicationStatus;
window.contactApplicant = contactApplicant;
window.viewJob = viewJob;
window.editJob = editJob;
window.viewJobApplicants = viewJobApplicants;
window.publishJob = publishJob;
window.deleteJob = deleteJob;
window.openJobModal = openJobModal;
window.closeJobModal = closeJobModal;
window.closeApplicantModal = () => closeAllModals();
window.viewApplicantDetail = (id) => console.log('View applicant:', id);