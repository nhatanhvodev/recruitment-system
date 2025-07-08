// Dashboard JavaScript functionality

let currentUser = null;
let currentSection = 'overview';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuthentication()) {
        return;
    }
    
    setupNavigation();
    setupUserInterface();
    loadDashboardData();
});

function checkAuthentication() {
    currentUser = RecruitmentApp.getCurrentUser();
    
    if (!currentUser) {
        RecruitmentApp.showAlert('Bạn cần đăng nhập để truy cập trang này', 'error');
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

function setupUserInterface() {
    const container = document.querySelector('.dashboard-container');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileType = document.getElementById('profile-type');
    const userName = document.getElementById('user-name');
    
    // Update user info
    profileName.textContent = currentUser.full_name || currentUser.email;
    profileEmail.textContent = currentUser.email;
    userName.textContent = currentUser.full_name || currentUser.email;
    
    // Set user type and show appropriate sections
    if (currentUser.user_type === 'candidate') {
        container.classList.add('candidate');
        profileType.textContent = 'Ứng viên';
        profileType.classList.remove('recruiter');
        
        document.getElementById('dashboard-title').textContent = 'Dashboard Ứng viên';
        document.getElementById('dashboard-subtitle').textContent = 'Quản lý đơn ứng tuyển và hồ sơ cá nhân';
    } else if (currentUser.user_type === 'recruiter') {
        container.classList.add('recruiter');
        profileType.textContent = 'Nhà tuyển dụng';
        profileType.classList.add('recruiter');
        
        document.getElementById('dashboard-title').textContent = 'Dashboard Nhà tuyển dụng';
        document.getElementById('dashboard-subtitle').textContent = 'Quản lý tin tuyển dụng và ứng viên';
    }
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const section = this.dataset.section;
            if (section) {
                switchSection(section);
            }
        });
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', function(e) {
        if (e.state && e.state.section) {
            switchSection(e.state.section, false);
        }
    });
}

function switchSection(section, pushState = true) {
    if (section === currentSection) return;
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === section) {
            item.classList.add('active');
        }
    });
    
    // Update content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update URL
    if (pushState) {
        history.pushState({ section }, '', `#${section}`);
    }
    
    currentSection = section;
    
    // Load section-specific data
    loadSectionData(section);
}

function loadDashboardData() {
    // Load initial section based on URL hash
    const hash = window.location.hash.substring(1);
    if (hash && document.getElementById(`${hash}-section`)) {
        switchSection(hash, false);
    } else {
        loadSectionData('overview');
    }
}

async function loadSectionData(section) {
    switch (section) {
        case 'overview':
            await loadOverviewData();
            break;
        case 'applications':
            if (currentUser.user_type === 'candidate') {
                await loadApplicationsData();
            }
            break;
        case 'my-jobs':
            if (currentUser.user_type === 'recruiter') {
                await loadMyJobsData();
            }
            break;
        case 'applicants':
            if (currentUser.user_type === 'recruiter') {
                await loadApplicantsData();
            }
            break;
        case 'profile':
            await loadProfileData();
            break;
    }
}

async function loadOverviewData() {
    const statsGrid = document.getElementById('stats-grid');
    const activityList = document.getElementById('recent-activity-list');
    
    try {
        // Show loading
        statsGrid.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner"></i><p>Đang tải thống kê...</p></div>';
        activityList.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner"></i><p>Đang tải hoạt động...</p></div>';
        
        // Load stats based on user type
        if (currentUser.user_type === 'candidate') {
            await loadCandidateStats();
            await loadCandidateActivity();
        } else if (currentUser.user_type === 'recruiter') {
            await loadRecruiterStats();
            await loadRecruiterActivity();
        }
        
    } catch (error) {
        console.error('Error loading overview data:', error);
        statsGrid.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Có lỗi xảy ra</h3><p>Không thể tải dữ liệu thống kê</p></div>';
    }
}

async function loadCandidateStats() {
    const statsGrid = document.getElementById('stats-grid');
    
    try {
        // Get candidate applications
        const applicationsResult = await RecruitmentApp.apiCall('../api/applications.php?candidate_applications=1');
        
        if (applicationsResult.success) {
            const applications = applicationsResult.data;
            const pendingCount = applications.filter(app => app.status === 'pending').length;
            const interviewCount = applications.filter(app => app.status === 'interview').length;
            const acceptedCount = applications.filter(app => app.status === 'accepted').length;
            
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <i class="fas fa-file-text"></i>
                    <h3>${applications.length}</h3>
                    <p>Tổng đơn ứng tuyển</p>
                </div>
                <div class="stat-card orange">
                    <i class="fas fa-clock"></i>
                    <h3>${pendingCount}</h3>
                    <p>Đang chờ phản hồi</p>
                </div>
                <div class="stat-card green">
                    <i class="fas fa-calendar-check"></i>
                    <h3>${interviewCount}</h3>
                    <p>Lịch phỏng vấn</p>
                </div>
                <div class="stat-card green">
                    <i class="fas fa-check-circle"></i>
                    <h3>${acceptedCount}</h3>
                    <p>Được nhận việc</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading candidate stats:', error);
    }
}

async function loadRecruiterStats() {
    const statsGrid = document.getElementById('stats-grid');
    
    try {
        // Get recruiter jobs and applications
        const [jobsResult, applicationsResult] = await Promise.all([
            RecruitmentApp.apiCall('../api/jobs.php?recruiter_jobs=1'),
            RecruitmentApp.apiCall('../api/applications.php?recruiter_applications=1')
        ]);
        
        if (jobsResult.success && applicationsResult.success) {
            const jobs = jobsResult.data;
            const applications = applicationsResult.data;
            
            const activeJobs = jobs.filter(job => job.status === 'active').length;
            const totalApplications = applications.length;
            const newApplications = applications.filter(app => app.status === 'pending').length;
            
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <i class="fas fa-briefcase"></i>
                    <h3>${jobs.length}</h3>
                    <p>Tổng tin tuyển dụng</p>
                </div>
                <div class="stat-card green">
                    <i class="fas fa-check-circle"></i>
                    <h3>${activeJobs}</h3>
                    <p>Đang hoạt động</p>
                </div>
                <div class="stat-card orange">
                    <i class="fas fa-users"></i>
                    <h3>${totalApplications}</h3>
                    <p>Tổng ứng viên</p>
                </div>
                <div class="stat-card red">
                    <i class="fas fa-bell"></i>
                    <h3>${newApplications}</h3>
                    <p>Ứng viên mới</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading recruiter stats:', error);
    }
}

async function loadCandidateActivity() {
    const activityList = document.getElementById('recent-activity-list');
    
    try {
        const result = await RecruitmentApp.apiCall('../api/applications.php?candidate_applications=1&limit=5');
        
        if (result.success && result.data.length > 0) {
            const activities = result.data.map(app => {
                const statusText = {
                    'pending': 'Đã nộp đơn ứng tuyển',
                    'reviewed': 'Đơn đã được xem',
                    'interview': 'Được mời phỏng vấn',
                    'accepted': 'Được nhận việc',
                    'rejected': 'Đơn bị từ chối'
                }[app.status] || 'Cập nhật trạng thái';
                
                const iconClass = {
                    'pending': 'fas fa-paper-plane',
                    'reviewed': 'fas fa-eye',
                    'interview': 'fas fa-calendar-check',
                    'accepted': 'fas fa-check-circle',
                    'rejected': 'fas fa-times-circle'
                }[app.status] || 'fas fa-info-circle';
                
                return `
                    <div class="activity-item">
                        <div class="activity-icon">
                            <i class="${iconClass}"></i>
                        </div>
                        <div class="activity-content">
                            <h4>${statusText}</h4>
                            <p>${app.job_title} tại ${app.company_name}</p>
                        </div>
                        <div class="activity-time">
                            ${RecruitmentApp.formatDate(app.applied_at)}
                        </div>
                    </div>
                `;
            }).join('');
            
            activityList.innerHTML = activities;
        } else {
            activityList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>Chưa có hoạt động nào</h3>
                    <p>Bắt đầu ứng tuyển để xem hoạt động tại đây</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading candidate activity:', error);
    }
}

async function loadRecruiterActivity() {
    const activityList = document.getElementById('recent-activity-list');
    
    try {
        const result = await RecruitmentApp.apiCall('../api/applications.php?recruiter_applications=1&limit=5');
        
        if (result.success && result.data.length > 0) {
            const activities = result.data.map(app => {
                return `
                    <div class="activity-item">
                        <div class="activity-icon">
                            <i class="fas fa-user-plus"></i>
                        </div>
                        <div class="activity-content">
                            <h4>Ứng viên mới ứng tuyển</h4>
                            <p>${app.candidate_name} ứng tuyển vị trí ${app.job_title}</p>
                        </div>
                        <div class="activity-time">
                            ${RecruitmentApp.formatDate(app.applied_at)}
                        </div>
                    </div>
                `;
            }).join('');
            
            activityList.innerHTML = activities;
        } else {
            activityList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>Chưa có hoạt động nào</h3>
                    <p>Đăng tin tuyển dụng để nhận ứng viên</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading recruiter activity:', error);
    }
}

async function loadApplicationsData() {
    const applicationsList = document.getElementById('applications-list');
    const statusFilter = document.getElementById('application-status-filter');
    
    try {
        applicationsList.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner"></i><p>Đang tải đơn ứng tuyển...</p></div>';
        
        const result = await RecruitmentApp.apiCall('../api/applications.php?candidate_applications=1');
        
        if (result.success && result.data.length > 0) {
            renderApplications(result.data);
            
            // Setup filter
            statusFilter.addEventListener('change', function() {
                const filterValue = this.value;
                const filteredData = filterValue === 'all' 
                    ? result.data 
                    : result.data.filter(app => app.status === filterValue);
                renderApplications(filteredData);
            });
        } else {
            applicationsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-text"></i>
                    <h3>Chưa có đơn ứng tuyển nào</h3>
                    <p><a href="index.html">Tìm kiếm việc làm</a> và nộp đơn ứng tuyển</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading applications:', error);
        applicationsList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Có lỗi xảy ra</h3></div>';
    }
}

function renderApplications(applications) {
    const applicationsList = document.getElementById('applications-list');
    
    if (applications.length === 0) {
        applicationsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Không tìm thấy đơn ứng tuyển</h3>
                <p>Thử thay đổi bộ lọc hoặc tìm kiếm việc làm mới</p>
            </div>
        `;
        return;
    }
    
    const html = applications.map(app => {
        const statusClass = `status-${app.status}`;
        const statusText = {
            'pending': 'Đang chờ',
            'reviewed': 'Đã xem',
            'interview': 'Phỏng vấn',
            'accepted': 'Được nhận',
            'rejected': 'Bị từ chối'
        }[app.status] || app.status;
        
        return `
            <div class="application-item">
                <div class="item-header">
                    <div>
                        <h3 class="item-title">${app.job_title}</h3>
                        <p class="item-company">${app.company_name}</p>
                    </div>
                    <span class="item-status ${statusClass}">${statusText}</span>
                </div>
                <div class="item-meta">
                    <span><i class="fas fa-calendar"></i> Ứng tuyển: ${RecruitmentApp.formatDate(app.applied_at)}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${app.job_location}</span>
                    ${app.salary ? `<span><i class="fas fa-money-bill"></i> ${RecruitmentApp.formatCurrency(app.salary)}</span>` : ''}
                </div>
                <div class="item-actions">
                    <a href="job-detail.html?id=${app.job_id}" class="btn btn-outline btn-sm">
                        <i class="fas fa-eye"></i> Xem chi tiết
                    </a>
                    ${app.status === 'pending' ? `
                        <button class="btn btn-danger btn-sm" onclick="withdrawApplication(${app.application_id})">
                            <i class="fas fa-times"></i> Rút đơn
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    applicationsList.innerHTML = html;
}

async function loadMyJobsData() {
    const jobsList = document.getElementById('my-jobs-list');
    const statusFilter = document.getElementById('job-status-filter');
    
    try {
        jobsList.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner"></i><p>Đang tải tin tuyển dụng...</p></div>';
        
        const result = await RecruitmentApp.apiCall('../api/jobs.php?recruiter_jobs=1');
        
        if (result.success && result.data.length > 0) {
            renderJobs(result.data);
            
            // Setup filter
            statusFilter.addEventListener('change', function() {
                const filterValue = this.value;
                const filteredData = filterValue === 'all' 
                    ? result.data 
                    : result.data.filter(job => job.status === filterValue);
                renderJobs(filteredData);
            });
        } else {
            jobsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-briefcase"></i>
                    <h3>Chưa có tin tuyển dụng nào</h3>
                    <p><a href="post-job.html" class="btn btn-primary">Đăng tin tuyển dụng đầu tiên</a></p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
        jobsList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Có lỗi xảy ra</h3></div>';
    }
}

function renderJobs(jobs) {
    const jobsList = document.getElementById('my-jobs-list');
    
    if (jobs.length === 0) {
        jobsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Không tìm thấy tin tuyển dụng</h3>
                <p>Thử thay đổi bộ lọc</p>
            </div>
        `;
        return;
    }
    
    const html = jobs.map(job => {
        const statusClass = `status-${job.status}`;
        const statusText = {
            'active': 'Đang hoạt động',
            'pending': 'Chờ duyệt',
            'expired': 'Hết hạn',
            'draft': 'Nháp'
        }[job.status] || job.status;
        
        return `
            <div class="job-item">
                <div class="item-header">
                    <div>
                        <h3 class="item-title">${job.title}</h3>
                        <p class="item-company">${job.job_type} • ${job.location}</p>
                    </div>
                    <span class="item-status ${statusClass}">${statusText}</span>
                </div>
                <div class="item-meta">
                    <span><i class="fas fa-calendar"></i> Đăng: ${RecruitmentApp.formatDate(job.created_at)}</span>
                    <span><i class="fas fa-eye"></i> ${job.views || 0} lượt xem</span>
                    <span><i class="fas fa-users"></i> ${job.application_count || 0} ứng viên</span>
                    ${job.salary ? `<span><i class="fas fa-money-bill"></i> ${RecruitmentApp.formatCurrency(job.salary)}</span>` : ''}
                </div>
                <div class="item-actions">
                    <a href="job-detail.html?id=${job.job_id}" class="btn btn-outline btn-sm">
                        <i class="fas fa-eye"></i> Xem chi tiết
                    </a>
                    <button class="btn btn-primary btn-sm" onclick="editJob(${job.job_id})">
                        <i class="fas fa-edit"></i> Chỉnh sửa
                    </button>
                    ${job.status === 'draft' ? `
                        <button class="btn btn-success btn-sm" onclick="publishJob(${job.job_id})">
                            <i class="fas fa-paper-plane"></i> Đăng tin
                        </button>
                    ` : ''}
                    <button class="btn btn-danger btn-sm" onclick="deleteJob(${job.job_id})">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    jobsList.innerHTML = html;
}

async function loadApplicantsData() {
    // Implementation for loading applicants data
    const applicantsList = document.getElementById('applicants-list');
    applicantsList.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner"></i><p>Chức năng đang phát triển...</p></div>';
}

async function loadProfileData() {
    const profileContent = document.getElementById('profile-content');
    
    profileContent.innerHTML = `
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
                    <label>Địa chỉ</label>
                    <input type="text" value="${currentUser.address || ''}" id="profile-address">
                </div>
            </div>
            <div class="form-group">
                <label>Giới thiệu</label>
                <textarea rows="4" id="profile-bio">${currentUser.bio || ''}</textarea>
            </div>
            <div class="form-actions">
                <button class="btn btn-primary" onclick="updateProfile()">
                    <i class="fas fa-save"></i> Lưu thay đổi
                </button>
            </div>
        </div>
    `;
}

// Utility functions
async function withdrawApplication(applicationId) {
    if (!confirm('Bạn có chắc muốn rút đơn ứng tuyển này?')) return;
    
    try {
        const result = await RecruitmentApp.apiCall(`../api/applications.php?id=${applicationId}`, {
            method: 'DELETE'
        });
        
        if (result.success) {
            RecruitmentApp.showAlert('Đã rút đơn ứng tuyển thành công', 'success');
            loadApplicationsData();
        } else {
            RecruitmentApp.showAlert(result.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Error withdrawing application:', error);
        RecruitmentApp.showAlert('Có lỗi xảy ra', 'error');
    }
}

function editJob(jobId) {
    window.location.href = `post-job.html?edit=${jobId}`;
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
            RecruitmentApp.showAlert('Đã gửi tin đăng để duyệt', 'success');
            loadMyJobsData();
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
            loadMyJobsData();
        } else {
            RecruitmentApp.showAlert(result.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Error deleting job:', error);
        RecruitmentApp.showAlert('Có lỗi xảy ra', 'error');
    }
}

async function updateProfile() {
    const fullName = document.getElementById('profile-fullname').value.trim();
    const phone = document.getElementById('profile-phone').value.trim();
    const address = document.getElementById('profile-address').value.trim();
    const bio = document.getElementById('profile-bio').value.trim();
    
    try {
        const result = await RecruitmentApp.apiCall('../api/profile.php', {
            method: 'PUT',
            body: JSON.stringify({
                full_name: fullName,
                phone: phone,
                address: address,
                bio: bio
            })
        });
        
        if (result.success) {
            RecruitmentApp.showAlert('Đã cập nhật hồ sơ thành công', 'success');
            
            // Update currentUser data
            currentUser.full_name = fullName;
            currentUser.phone = phone;
            currentUser.address = address;
            currentUser.bio = bio;
            
            // Update session storage
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Update UI
            setupUserInterface();
        } else {
            RecruitmentApp.showAlert(result.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        RecruitmentApp.showAlert('Có lỗi xảy ra', 'error');
    }
}

// Global functions
window.withdrawApplication = withdrawApplication;
window.editJob = editJob;
window.publishJob = publishJob;
window.deleteJob = deleteJob;
window.updateProfile = updateProfile;