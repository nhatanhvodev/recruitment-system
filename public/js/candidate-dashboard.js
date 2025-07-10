// Candidate Dashboard JavaScript functionality

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
        window.location.href = '../login.html';
        return false;
    }
    
    // Ensure user is candidate
    if (currentUser.user_type !== 'candidate') {
        RecruitmentApp.showAlert('Bạn không có quyền truy cập trang này', 'error');
        window.location.href = '../index.html';
        return false;
    }
    
    return true;
}

function setupUserInterface() {
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const userName = document.getElementById('user-name');
    
    // Update user info
    profileName.textContent = currentUser.full_name || currentUser.email;
    profileEmail.textContent = currentUser.email;
    userName.textContent = currentUser.full_name || currentUser.email;
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const quickActionCards = document.querySelectorAll('.quick-action-card[data-section]');
    
    // Setup nav items
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            if (section) {
                switchSection(section);
            }
        });
    });
    
    // Setup quick action cards
    quickActionCards.forEach(card => {
        card.addEventListener('click', function(e) {
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
            await loadApplicationsData();
            break;
        case 'saved-jobs':
            await loadSavedJobsData();
            break;
        case 'job-search':
            await setupJobSearch();
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
        statsGrid.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i><p>Đang tải thống kê...</p></div>';
        activityList.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i><p>Đang tải hoạt động...</p></div>';
        
        await loadCandidateStats();
        await loadCandidateActivity();
        
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
                <div class="stat-card blue">
                    <i class="fas fa-check-circle"></i>
                    <h3>${acceptedCount}</h3>
                    <p>Được nhận việc</p>
                </div>
            `;
        } else {
            // Show default stats if no data
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <i class="fas fa-file-text"></i>
                    <h3>0</h3>
                    <p>Tổng đơn ứng tuyển</p>
                </div>
                <div class="stat-card orange">
                    <i class="fas fa-clock"></i>
                    <h3>0</h3>
                    <p>Đang chờ phản hồi</p>
                </div>
                <div class="stat-card green">
                    <i class="fas fa-calendar-check"></i>
                    <h3>0</h3>
                    <p>Lịch phỏng vấn</p>
                </div>
                <div class="stat-card blue">
                    <i class="fas fa-check-circle"></i>
                    <h3>0</h3>
                    <p>Được nhận việc</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading candidate stats:', error);
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
                    <a href="../index.html" class="btn btn-primary">Tìm việc làm</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading candidate activity:', error);
        activityList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Có lỗi xảy ra</h3></div>';
    }
}

async function loadApplicationsData() {
    const applicationsList = document.getElementById('applications-list');
    const statusFilter = document.getElementById('application-status-filter');
    
    try {
        applicationsList.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i><p>Đang tải đơn ứng tuyển...</p></div>';
        
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
                    <p>Bắt đầu tìm kiếm và ứng tuyển công việc phù hợp</p>
                    <a href="../index.html" class="btn btn-primary">Tìm việc làm</a>
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
                    <a href="../job-detail.html?id=${app.job_id}" class="btn btn-outline btn-sm">
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

async function loadSavedJobsData() {
    const savedJobsList = document.getElementById('saved-jobs-list');
    
    try {
        savedJobsList.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i><p>Đang tải việc làm đã lưu...</p></div>';
        
        // This would be an API call to get saved jobs
        // For now, show placeholder
        setTimeout(() => {
            savedJobsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bookmark"></i>
                    <h3>Chưa có việc làm đã lưu</h3>
                    <p>Lưu các công việc bạn quan tâm để xem lại sau</p>
                    <a href="../index.html" class="btn btn-primary">Khám phá việc làm</a>
                </div>
            `;
        }, 1000);
        
    } catch (error) {
        console.error('Error loading saved jobs:', error);
        savedJobsList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Có lỗi xảy ra</h3></div>';
    }
}

async function setupJobSearch() {
    const searchBtn = document.getElementById('search-jobs-btn');
    const keywordInput = document.getElementById('job-search-keyword');
    const locationSelect = document.getElementById('job-search-location');
    const categorySelect = document.getElementById('job-search-category');
    const resultsContainer = document.getElementById('search-results');
    
    searchBtn.addEventListener('click', async function() {
        const keyword = keywordInput.value.trim();
        const location = locationSelect.value;
        const category = categorySelect.value;
        
        await searchJobs(keyword, location, category);
    });
    
    // Enable search on Enter key
    keywordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
}

async function searchJobs(keyword, location, category) {
    const resultsContainer = document.getElementById('search-results');
    
    try {
        resultsContainer.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i><p>Đang tìm kiếm...</p></div>';
        
        // Build query params
        const params = new URLSearchParams();
        if (keyword) params.append('keyword', keyword);
        if (location) params.append('location', location);
        if (category) params.append('category', category);
        
        const result = await RecruitmentApp.apiCall(`../api/jobs.php?${params.toString()}`);
        
        if (result.success && result.data.length > 0) {
            const jobsHtml = result.data.map(job => `
                <div class="job-search-item">
                    <div class="job-header">
                        <h3><a href="../job-detail.html?id=${job.id}">${job.title}</a></h3>
                        <p class="company">${job.company_name}</p>
                    </div>
                    <div class="job-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                        ${job.salary ? `<span><i class="fas fa-money-bill"></i> ${RecruitmentApp.formatCurrency(job.salary)}</span>` : ''}
                        <span><i class="fas fa-clock"></i> ${RecruitmentApp.formatDate(job.created_at)}</span>
                    </div>
                    <div class="job-description">
                        <p>${job.description.substring(0, 150)}...</p>
                    </div>
                    <div class="job-actions">
                        <a href="../job-detail.html?id=${job.id}" class="btn btn-outline btn-sm">Xem chi tiết</a>
                        <button class="btn btn-primary btn-sm" onclick="quickApply(${job.id})">Ứng tuyển ngay</button>
                    </div>
                </div>
            `).join('');
            
            resultsContainer.innerHTML = `
                <div class="search-results-header">
                    <h3>Tìm thấy ${result.data.length} việc làm</h3>
                </div>
                <div class="search-results-list">
                    ${jobsHtml}
                </div>
            `;
        } else {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>Không tìm thấy việc làm phù hợp</h3>
                    <p>Thử thay đổi từ khóa tìm kiếm hoặc mở rộng phạm vi tìm kiếm</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error searching jobs:', error);
        resultsContainer.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Có lỗi xảy ra khi tìm kiếm</h3></div>';
    }
}

async function loadProfileData() {
    const profileContent = document.getElementById('profile-content');
    const editBtn = document.getElementById('edit-profile-btn');
    
    try {
        profileContent.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i><p>Đang tải hồ sơ...</p></div>';
        
        // Load current user profile
        profileContent.innerHTML = `
            <form id="profile-form" class="profile-form">
                <div class="form-section">
                    <h3>Thông tin cá nhân</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="full_name">Họ và tên</label>
                            <input type="text" id="full_name" value="${currentUser.full_name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" value="${currentUser.email}" readonly>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="phone">Số điện thoại</label>
                            <input type="tel" id="phone" value="${currentUser.phone || ''}">
                        </div>
                        <div class="form-group">
                            <label for="location">Địa chỉ</label>
                            <input type="text" id="location" value="${currentUser.location || ''}">
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>Thông tin nghề nghiệp</h3>
                    <div class="form-group">
                        <label for="experience">Kinh nghiệm làm việc</label>
                        <textarea id="experience" rows="4" placeholder="Mô tả kinh nghiệm làm việc của bạn...">${currentUser.experience || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="skills">Kỹ năng</label>
                        <textarea id="skills" rows="3" placeholder="Liệt kê các kỹ năng của bạn...">${currentUser.skills || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="education">Học vấn</label>
                        <textarea id="education" rows="3" placeholder="Thông tin về trình độ học vấn...">${currentUser.education || ''}</textarea>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="cancelEdit()">Hủy</button>
                    <button type="submit" class="btn btn-primary">Lưu thay đổi</button>
                </div>
            </form>
        `;
        
        // Setup form submission
        document.getElementById('profile-form').addEventListener('submit', updateProfile);
        
    } catch (error) {
        console.error('Error loading profile:', error);
        profileContent.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Có lỗi xảy ra</h3></div>';
    }
}

async function updateProfile(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const profileData = {
        full_name: document.getElementById('full_name').value,
        phone: document.getElementById('phone').value,
        location: document.getElementById('location').value,
        experience: document.getElementById('experience').value,
        skills: document.getElementById('skills').value,
        education: document.getElementById('education').value
    };
    
    try {
        const result = await RecruitmentApp.apiCall('../api/users.php', 'PUT', profileData);
        
        if (result.success) {
            RecruitmentApp.showAlert('Cập nhật hồ sơ thành công!', 'success');
            // Update current user data
            Object.assign(currentUser, profileData);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            setupUserInterface(); // Refresh UI
        } else {
            RecruitmentApp.showAlert(result.message || 'Có lỗi xảy ra khi cập nhật hồ sơ', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        RecruitmentApp.showAlert('Có lỗi xảy ra khi cập nhật hồ sơ', 'error');
    }
}

async function withdrawApplication(applicationId) {
    if (!confirm('Bạn có chắc chắn muốn rút đơn ứng tuyển này?')) {
        return;
    }
    
    try {
        const result = await RecruitmentApp.apiCall(`../api/applications.php?id=${applicationId}`, 'DELETE');
        
        if (result.success) {
            RecruitmentApp.showAlert('Đã rút đơn ứng tuyển thành công', 'success');
            // Reload applications
            await loadApplicationsData();
            // Refresh overview if currently viewing
            if (currentSection === 'overview') {
                await loadOverviewData();
            }
        } else {
            RecruitmentApp.showAlert(result.message || 'Có lỗi xảy ra khi rút đơn', 'error');
        }
    } catch (error) {
        console.error('Error withdrawing application:', error);
        RecruitmentApp.showAlert('Có lỗi xảy ra khi rút đơn', 'error');
    }
}

async function quickApply(jobId) {
    try {
        const result = await RecruitmentApp.apiCall('../api/applications.php', 'POST', {
            job_id: jobId
        });
        
        if (result.success) {
            RecruitmentApp.showAlert('Ứng tuyển thành công!', 'success');
            // Refresh search results or redirect to applications
            switchSection('applications');
        } else {
            RecruitmentApp.showAlert(result.message || 'Có lỗi xảy ra khi ứng tuyển', 'error');
        }
    } catch (error) {
        console.error('Error applying for job:', error);
        RecruitmentApp.showAlert('Có lỗi xảy ra khi ứng tuyển', 'error');
    }
}

function cancelEdit() {
    // Reload profile data
    loadProfileData();
}

// Global functions
window.withdrawApplication = withdrawApplication;
window.quickApply = quickApply;
window.cancelEdit = cancelEdit;