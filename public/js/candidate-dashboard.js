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

// Function to update application count badge
async function updateApplicationBadge() {
    const applicationsBadge = document.getElementById('applications-badge');
    
    if (!applicationsBadge) return;
    
    try {
        const applicationsResult = await RecruitmentApp.apiCall('../../api/applications.php?candidate_applications=1');
        
        if (applicationsResult.success) {
            const allApplications = applicationsResult.data;
            // Filter out withdrawn applications for display consistency
            const activeApplications = allApplications.filter(app => app.status !== 'withdrawn');
            applicationsBadge.textContent = activeApplications.length;
            
            // Add visual feedback for count change
            applicationsBadge.classList.add('updated');
            setTimeout(() => {
                applicationsBadge.classList.remove('updated');
            }, 1000);
        }
    } catch (error) {
        console.error('Error updating application badge:', error);
    }
}

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
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    const quickActionCards = document.querySelectorAll('.quick-action-item[data-section]');
    const viewAllLinks = document.querySelectorAll('.view-all-link[data-section]');
    
    // Setup nav items - immediate response on click
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            if (section) {
                // Immediate visual feedback
                updateNavActiveState(section);
                // Then switch content
                switchSection(section);
            }
        });
        
        // Add hover effects for better UX
        item.addEventListener('mouseenter', function() {
            if (!this.classList.contains('active')) {
                this.style.transform = 'translateX(4px)';
            }
        });
        
        item.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active')) {
                this.style.transform = 'translateX(0)';
            }
        });
    });
    
    // Setup quick action cards
    quickActionCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            if (section) {
                updateNavActiveState(section);
                switchSection(section);
            }
        });
    });
    
    // Setup view all links
    viewAllLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            if (section) {
                updateNavActiveState(section);
                switchSection(section);
            }
        });
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', function(e) {
        if (e.state && e.state.section) {
            updateNavActiveState(e.state.section);
            switchSection(e.state.section, false);
        }
    });
}

function updateNavActiveState(activeSection) {
    // Immediately update active states for visual feedback
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === activeSection) {
            item.classList.add('active');
        }
    });
}

function switchSection(section, pushState = true) {
    if (section === currentSection) return;
    
    // Add smooth transition effect
    const contentArea = document.querySelector('.dashboard-content');
    contentArea.style.opacity = '0.7';
    
    // Update content sections with smooth transition
    document.querySelectorAll('.content-section').forEach(contentSection => {
        contentSection.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        // Small delay for smooth transition effect
        setTimeout(() => {
            targetSection.classList.add('active');
            contentArea.style.opacity = '1';
        }, 150);
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

async function checkAccountStatus(helpNotice) {
    try {
        // Try to refresh user session to check for sync issues
        const refreshedUser = await RecruitmentApp.refreshUserSession();
        
        // Check if session was out of sync
        if (refreshedUser && refreshedUser.user_type !== currentUser.user_type) {
            // Session was out of sync but now fixed
            currentUser = refreshedUser;
            setupUserInterface(); // Update UI with correct info
            
            // Show help notice for a moment
            if (helpNotice) {
                helpNotice.style.display = 'flex';
                setTimeout(() => {
                    helpNotice.style.display = 'none';
                }, 5000);
            }
        }
        
        // Try a small test API call to check if everything is working
        const testResult = await RecruitmentApp.apiCall('../../api/applications.php?candidate_applications=1&limit=1');
        
        if (!testResult.success && testResult.message && testResult.message.includes('user_type')) {
            // User might have application issues, show help notice
            if (helpNotice) {
                helpNotice.style.display = 'flex';
            }
        }
    } catch (error) {
        console.log('Account status check failed:', error);
        // Don't show notice for network errors
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
    const helpNotice = document.getElementById('help-notice');
    
    try {
        // Show loading
        statsGrid.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i><p>Đang tải thống kê...</p></div>';
        activityList.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i><p>Đang tải hoạt động...</p></div>';
        
        // Check if user might have account issues and show help notice
        await checkAccountStatus(helpNotice);
        
        await loadCandidateStats();
        await loadCandidateActivity();
        
    } catch (error) {
        console.error('Error loading overview data:', error);
        statsGrid.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Có lỗi xảy ra</h3><p>Không thể tải dữ liệu thống kê</p></div>';
    }
}

async function loadCandidateStats() {
    const statsGrid = document.getElementById('stats-grid');
    const totalApplicationsEl = document.getElementById('total-applications');
    const pendingApplicationsEl = document.getElementById('pending-applications');
    const savedJobsEl = document.getElementById('saved-jobs');
    const applicationsBadge = document.getElementById('applications-badge');
    
    try {
        // Get candidate applications
        const applicationsResult = await RecruitmentApp.apiCall('../../api/applications.php?candidate_applications=1');
        
        if (applicationsResult.success) {
            const allApplications = applicationsResult.data;
            // Filter out withdrawn applications for display consistency
            const activeApplications = allApplications.filter(app => app.status !== 'withdrawn');
            const pendingCount = activeApplications.filter(app => app.status === 'pending').length;
            const interviewCount = activeApplications.filter(app => app.status === 'interview').length;
            const acceptedCount = activeApplications.filter(app => app.status === 'accepted').length;
            
            // Update profile header stats
            if (totalApplicationsEl) totalApplicationsEl.textContent = activeApplications.length;
            if (pendingApplicationsEl) pendingApplicationsEl.textContent = pendingCount;
            if (savedJobsEl) savedJobsEl.textContent = '0'; // This would be from saved jobs API
            if (applicationsBadge) applicationsBadge.textContent = activeApplications.length;
            
            // Update stats grid in overview
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <i class="fas fa-file-text"></i>
                    <h3>${activeApplications.length}</h3>
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
            if (totalApplicationsEl) totalApplicationsEl.textContent = '0';
            if (pendingApplicationsEl) pendingApplicationsEl.textContent = '0';
            if (savedJobsEl) savedJobsEl.textContent = '0';
            if (applicationsBadge) applicationsBadge.textContent = '0';
            
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
        const result = await RecruitmentApp.apiCall('../../api/applications.php?candidate_applications=1&limit=5');
        
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
        
        const result = await RecruitmentApp.apiCall('../../api/applications.php?candidate_applications=1');
        
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
    applications = applications.filter(app => app.status !== 'withdrawn');
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
                <div class="table-cell">
                    <div class="item-title">${app.job_title}</div>
                    <div class="item-company">${app.company_name}</div>
                </div>
                <div class="table-cell">${app.company_name}</div>
                <div class="table-cell">${RecruitmentApp.formatDate(app.applied_at)}</div>
                <div class="table-cell">
                    <span class="item-status ${statusClass}">${statusText}</span>
                </div>
                <div class="table-cell">
                    <div class="item-actions">
                        <a href="../job-detail.html?id=${app.job_id}" class="btn btn-outline btn-sm view-detail-btn" data-job-id="${app.job_id}">
                            <i class="fas fa-eye"></i> Xem chi tiết
                        </a>
                        ${app.status === 'pending' ? `
                            <button class="btn btn-danger btn-sm withdraw-btn" data-application-id="${app.application_id}">
                                <i class="fas fa-times"></i> Rút
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    applicationsList.innerHTML = html;
    
    // Setup event listeners for applications
    setupApplicationsEventListeners();
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
        
        const result = await RecruitmentApp.apiCall(`../../api/jobs.php?${params.toString()}`);
        
        if (result.success && result.data.length > 0) {
            const jobsHtml = result.data.map(job => `
                <div class="job-search-item" data-job-id="${job.job_id}">
                    <div class="job-header">
                        <h3><a href="../job-detail.html?id=${job.job_id}" class="job-title-link" data-job-id="${job.job_id}">${job.title}</a></h3>
                        <p class="company">${job.company_name}</p>
                    </div>
                    <div class="job-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                        ${job.salary ? `<span><i class="fas fa-money-bill"></i> ${RecruitmentApp.formatCurrency(job.salary)}</span>` : ''}
                        <span><i class="fas fa-clock"></i> ${RecruitmentApp.formatDate(job.posted_at)}</span>
                    </div>
                    <div class="job-description">
                        <p>${job.description.substring(0, 150)}...</p>
                    </div>
                    <div class="job-actions">
                        <a href="../job-detail.html?id=${job.job_id}" class="btn btn-outline btn-sm view-detail-btn" data-job-id="${job.job_id}">
                            <i class="fas fa-eye"></i> Xem chi tiết
                        </a>
                        <button class="btn btn-primary btn-sm apply-btn" data-job-id="${job.job_id}">
                            <i class="fas fa-paper-plane"></i> Ứng tuyển ngay
                        </button>
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
            
            // Add event listeners after HTML is created
            setupJobSearchEventListeners();
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
    const updateData = Object.fromEntries(formData);
    
    try {
        const result = await RecruitmentApp.apiCall('../../api/profile.php', {
            method: 'POST',
            body: JSON.stringify(updateData),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (result.success) {
            RecruitmentApp.showAlert('Cập nhật hồ sơ thành công', 'success');
            // Update current user data
            currentUser = { ...currentUser, ...updateData };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            setupUserInterface();
        } else {
            RecruitmentApp.showAlert(result.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        RecruitmentApp.showAlert('Có lỗi xảy ra khi cập nhật', 'error');
    }
}

async function withdrawApplication(applicationId) {
    if (!confirm('Bạn có chắc chắn muốn rút đơn ứng tuyển này?')) {
        return;
    }
    
    try {
        const result = await RecruitmentApp.apiCall('../../api/applications.php', {
            method: 'PUT', // Đổi từ DELETE sang PUT
            body: JSON.stringify({ application_id: applicationId, status: 'withdrawn' }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (result.success) {
            RecruitmentApp.showAlert('Đã rút đơn ứng tuyển', 'success');
            loadApplicationsData(); // Reload applications
            updateApplicationBadge(); // Update badge count
            if (currentSection === 'overview') {
                loadCandidateStats(); // Update overview stats if currently viewing overview
            }
        } else {
            RecruitmentApp.showAlert(result.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Error withdrawing application:', error);
        RecruitmentApp.showAlert('Có lỗi xảy ra', 'error');
    }
}

async function quickApply(jobId, buttonElement = null) {
    console.log('quickApply called with jobId:', jobId, 'buttonElement:', buttonElement);
    
    try {
        // Validate jobId
        if (!jobId) {
            console.error('Job ID is missing');
            RecruitmentApp.showAlert('Không tìm thấy thông tin công việc', 'error');
            return;
        }
        
        // Find the button element if not provided
        if (!buttonElement) {
            buttonElement = document.querySelector(`button.apply-btn[data-job-id="${jobId}"]`);
            console.log('Found button element:', buttonElement);
        }
        
        // Show confirmation dialog
        console.log('Showing apply confirmation modal...');
        const confirmed = await showQuickApplyModal(jobId);
        if (!confirmed) {
            console.log('User cancelled application');
            return;
        }
        
        // Check if already applied
        try {
            const checkResult = await RecruitmentApp.apiCall(`../../api/applications.php?check_applied=1&job_id=${jobId}`);
            if (checkResult.success && checkResult.already_applied) {
                RecruitmentApp.showAlert('Bạn đã ứng tuyển công việc này rồi', 'warning');
                return;
            }
        } catch (error) {
            console.error('Error checking application status:', error);
        }
        
        // Update button to loading state
        const originalText = buttonElement ? buttonElement.innerHTML : '';
        if (buttonElement) {
            buttonElement.disabled = true;
            buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang ứng tuyển...';
            buttonElement.classList.add('loading');
        }
        
        try {
            const result = await RecruitmentApp.apiCall('../../api/applications.php', {
                method: 'POST',
                body: JSON.stringify({ job_id: jobId }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (result.success) {
                // Success feedback
                if (buttonElement) {
                    buttonElement.innerHTML = '<i class="fas fa-check"></i> Đã ứng tuyển';
                    buttonElement.classList.remove('btn-primary');
                    buttonElement.classList.add('btn-success');
                    
                    // Auto reset after 3 seconds
                    setTimeout(() => {
                        buttonElement.innerHTML = '<i class="fas fa-eye"></i> Xem đơn';
                        buttonElement.classList.remove('btn-success');
                        buttonElement.classList.add('btn-outline');
                        buttonElement.onclick = () => switchSection('applications');
                    }, 3000);
                }
                
                RecruitmentApp.showAlert('Ứng tuyển thành công! 🎉', 'success');
                updateApplicationBadge(); // Update badge count
                if (currentSection === 'overview') {
                    loadCandidateStats(); // Update overview stats if currently viewing overview
                    loadCandidateActivity(); // Refresh activity
                }
                
                // Show success modal with next steps
                showApplicationSuccessModal(result.application_id);
                
            } else {
                throw new Error(result.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error applying for job:', error);
            RecruitmentApp.showAlert(error.message || 'Có lỗi xảy ra khi ứng tuyển', 'error');
            
            // Reset button on error
            if (buttonElement) {
                buttonElement.disabled = false;
                buttonElement.innerHTML = originalText;
                buttonElement.classList.remove('loading');
            }
        }
    } catch (error) {
        console.error('Error in quickApply function:', error);
        RecruitmentApp.showAlert('Có lỗi xảy ra', 'error');
    }
}

async function showQuickApplyModal(jobId) {
    return new Promise((resolve) => {
        // Create modal HTML
        const modalHtml = `
            <div id="quick-apply-modal" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-paper-plane"></i> Xác nhận ứng tuyển</h3>
                        <button class="modal-close" onclick="closeQuickApplyModal(false)">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="apply-confirmation">
                            <div class="confirmation-icon">
                                <i class="fas fa-briefcase"></i>
                            </div>
                            <h4>Bạn có muốn ứng tuyển công việc này không?</h4>
                            <p>Đơn ứng tuyển sẽ được gửi đến nhà tuyển dụng với thông tin hồ sơ hiện tại của bạn.</p>
                            <div class="profile-preview">
                                <div class="preview-item">
                                    <i class="fas fa-user"></i>
                                    <span>${currentUser.full_name || 'Chưa cập nhật'}</span>
                                </div>
                                <div class="preview-item">
                                    <i class="fas fa-envelope"></i>
                                    <span>${currentUser.email}</span>
                                </div>
                                <div class="preview-item">
                                    <i class="fas fa-phone"></i>
                                    <span>${currentUser.phone || 'Chưa cập nhật'}</span>
                                </div>
                            </div>
                            ${(!currentUser.full_name || !currentUser.phone) ? 
                                '<div class="warning-note"><i class="fas fa-exclamation-triangle"></i> Khuyến nghị hoàn thiện hồ sơ để tăng cơ hội được nhận.</div>' 
                                : ''
                            }
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-outline" onclick="closeQuickApplyModal(false)">
                            <i class="fas fa-times"></i> Hủy
                        </button>
                        ${(!currentUser.full_name || !currentUser.phone) ? 
                            `<button class="btn btn-secondary" onclick="closeQuickApplyModal(false); switchSection('profile');">
                                <i class="fas fa-edit"></i> Hoàn thiện hồ sơ
                            </button>`
                            : ''
                        }
                        <button class="btn btn-primary" onclick="closeQuickApplyModal(true)">
                            <i class="fas fa-paper-plane"></i> Xác nhận ứng tuyển
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Store resolve function globally
        window.quickApplyResolve = resolve;
        
        // Show modal with animation
        setTimeout(() => {
            document.getElementById('quick-apply-modal').classList.add('show');
        }, 10);
    });
}

function closeQuickApplyModal(confirmed) {
    const modal = document.getElementById('quick-apply-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
            if (window.quickApplyResolve) {
                window.quickApplyResolve(confirmed);
                delete window.quickApplyResolve;
            }
        }, 300);
    }
}

function showApplicationSuccessModal(applicationId) {
    const modalHtml = `
        <div id="success-modal" class="modal-overlay show">
            <div class="modal-content success-modal">
                <div class="modal-header success">
                    <h3><i class="fas fa-check-circle"></i> Ứng tuyển thành công!</h3>
                </div>
                <div class="modal-body">
                    <div class="success-content">
                        <div class="success-animation">
                            <div class="checkmark">
                                <i class="fas fa-check"></i>
                            </div>
                        </div>
                        <h4>Đơn ứng tuyển đã được gửi đi!</h4>
                        <p>Nhà tuyển dụng sẽ xem xét đơn của bạn và phản hồi trong thời gian sớm nhất.</p>
                        <div class="next-steps">
                            <h5>Bước tiếp theo:</h5>
                            <ul>
                                <li><i class="fas fa-bell"></i> Chúng tôi sẽ thông báo khi có cập nhật</li>
                                <li><i class="fas fa-search"></i> Tiếp tục tìm kiếm cơ hội khác</li>
                                <li><i class="fas fa-user-edit"></i> Hoàn thiện hồ sơ để tăng cơ hội</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-outline" onclick="closeSuccessModal()">
                        <i class="fas fa-search"></i> Tiếp tục tìm việc
                    </button>
                    <button class="btn btn-primary" onclick="closeSuccessModal(); switchSection('applications');">
                        <i class="fas fa-list"></i> Xem đơn ứng tuyển
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Auto close after 10 seconds
    setTimeout(() => {
        closeSuccessModal();
    }, 10000);
}

function closeSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// Setup event listeners for job search results
function setupJobSearchEventListeners() {
    console.log('Setting up job search event listeners...');
    
    // View detail buttons - let href handle navigation naturally
    const viewDetailButtons = document.querySelectorAll('.view-detail-btn, .job-title-link');
    console.log(`Found ${viewDetailButtons.length} view detail buttons`);
    
    viewDetailButtons.forEach(link => {
        link.addEventListener('click', function(e) {
            // Store current search context for back navigation
            sessionStorage.setItem('returnToSearch', JSON.stringify({
                section: currentSection,
                timestamp: Date.now()
            }));
            
            // Let the href handle navigation naturally
            // No preventDefault() to allow normal link behavior
            console.log('View detail clicked for job:', this.dataset.jobId);
        });
    });
    
    // Apply buttons
    const applyButtons = document.querySelectorAll('.apply-btn');
    console.log(`Found ${applyButtons.length} apply buttons`);
    
    applyButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const jobId = this.dataset.jobId;
            console.log('Apply clicked for job:', jobId);
            quickApply(jobId, this);
        });
    });
}

// Setup event listeners for applications section
function setupApplicationsEventListeners() {
    // View detail buttons - let href handle navigation naturally
    document.querySelectorAll('.applications-list .view-detail-btn').forEach(link => {
        link.addEventListener('click', function(e) {
            // Store current search context for back navigation
            sessionStorage.setItem('returnToSearch', JSON.stringify({
                section: currentSection,
                timestamp: Date.now()
            }));
            
            // Let the href handle navigation naturally
            // No preventDefault() to allow normal link behavior
        });
    });
    
    // Withdraw buttons
    document.querySelectorAll('.withdraw-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const applicationId = this.dataset.applicationId;
            withdrawApplication(applicationId);
        });
    });
}

// Simple view details function for compatibility
function viewJobDetail(jobId) {
    if (!jobId) {
        RecruitmentApp.showAlert('Không tìm thấy thông tin công việc', 'error');
        return;
    }
    
    // Store current search context for back navigation
    sessionStorage.setItem('returnToSearch', JSON.stringify({
        section: currentSection,
        timestamp: Date.now()
    }));
    
    // Direct navigation
    window.location.href = `../job-detail.html?id=${jobId}`;
}

function cancelEdit() {
    loadProfileData();
}

// Global functions
window.withdrawApplication = withdrawApplication;
window.quickApply = quickApply;
window.cancelEdit = cancelEdit;
window.viewJobDetail = viewJobDetail;
window.closeQuickApplyModal = closeQuickApplyModal;
window.closeSuccessModal = closeSuccessModal;
window.setupJobSearchEventListeners = setupJobSearchEventListeners;
window.setupApplicationsEventListeners = setupApplicationsEventListeners;
window.updateApplicationBadge = updateApplicationBadge;