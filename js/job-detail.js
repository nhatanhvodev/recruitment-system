// Job Detail page JavaScript functionality

let currentJobId = null;
let currentJobData = null;

// Initialize job detail page
document.addEventListener('DOMContentLoaded', function() {
    // Get job ID from URL
    currentJobId = getJobIdFromUrl();
    
    if (currentJobId) {
        loadJobDetail(currentJobId);
    } else {
        showError('Không tìm thấy thông tin công việc');
    }
    
    setupEventListeners();
});

function getJobIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function setupEventListeners() {
    // Apply button
    const applyBtn = document.getElementById('apply-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', handleJobApply);
    }
    
    // Save job button
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveJob);
    }
    
    // Share job button
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', handleShareJob);
    }
}

async function loadJobDetail(jobId) {
    try {
        showLoading();
        
        const result = await RecruitmentApp.getJob(jobId);
        
        if (result.success) {
            currentJobData = result.data;
            displayJobDetail(result.data);
            loadRelatedJobs(result.data.company_id, jobId);
        } else {
            showError(result.message || 'Không thể tải thông tin công việc');
        }
    } catch (error) {
        console.error('Error loading job detail:', error);
        showError('Có lỗi xảy ra khi tải thông tin công việc');
    }
}

function displayJobDetail(job) {
    hideLoading();
    showContent();
    
    // Update page title
    document.title = `${job.title} - ${job.company_name} | JobPortal`;
    
    // Job header information
    document.getElementById('job-title').textContent = job.title;
    document.getElementById('job-title-breadcrumb').textContent = job.title;
    document.getElementById('company-name').textContent = job.company_name;
    document.getElementById('job-location').textContent = job.location;
    document.getElementById('job-type').textContent = getJobTypeText(job.job_type);
    document.getElementById('job-salary').textContent = RecruitmentApp.formatCurrency(job.salary);
    document.getElementById('job-posted').textContent = RecruitmentApp.formatRelativeTime(job.posted_at);
    
    // Company website
    if (job.company_website) {
        const websiteLink = document.getElementById('company-website');
        websiteLink.href = job.company_website;
        websiteLink.style.display = 'inline';
    }
    
    // Job stats
    document.getElementById('job-views').textContent = job.view_count || 0;
    document.getElementById('job-applications').textContent = job.application_count || 0;
    
    // Job deadline
    if (job.expires_at) {
        const deadline = new Date(job.expires_at);
        const now = new Date();
        if (deadline > now) {
            document.getElementById('job-deadline').textContent = RecruitmentApp.formatDate(job.expires_at);
        } else {
            document.getElementById('job-deadline').textContent = 'Đã hết hạn';
        }
    }
    
    // Job description and requirements
    document.getElementById('job-description').innerHTML = formatJobContent(job.description);
    document.getElementById('job-requirements').innerHTML = formatJobContent(job.requirements || 'Không có yêu cầu cụ thể');
    
    // Company information in sidebar
    document.getElementById('sidebar-company-name').textContent = job.company_name;
    document.getElementById('company-description').textContent = job.company_description || 'Không có mô tả công ty';
    
    // Company stats
    if (job.company_size) {
        document.getElementById('company-size').textContent = job.company_size + ' nhân viên';
    }
    if (job.company_industry) {
        document.getElementById('company-industry').textContent = job.company_industry;
    }
    
    // Company website link
    if (job.company_website) {
        const companyWebsiteLink = document.getElementById('company-website-link');
        companyWebsiteLink.href = job.company_website;
        companyWebsiteLink.style.display = 'inline-block';
    }
    
    // Job details in sidebar
    document.getElementById('sidebar-salary').textContent = RecruitmentApp.formatCurrency(job.salary);
    document.getElementById('sidebar-job-type').textContent = getJobTypeText(job.job_type);
    document.getElementById('sidebar-location').textContent = job.location;
    document.getElementById('sidebar-posted').textContent = RecruitmentApp.formatDate(job.posted_at);
}

function formatJobContent(content) {
    if (!content) return '';
    
    // Convert line breaks to HTML
    let formatted = content.replace(/\n/g, '<br>');
    
    // Convert bullet points
    formatted = formatted.replace(/•/g, '<li>');
    formatted = formatted.replace(/\*/g, '<li>');
    
    // Simple formatting for lists
    if (formatted.includes('<li>')) {
        formatted = '<ul>' + formatted.replace(/<li>/g, '<li>') + '</ul>';
    }
    
    return formatted;
}

function getJobTypeText(jobType) {
    const types = {
        'full-time': 'Toàn thời gian',
        'part-time': 'Bán thời gian',
        'contract': 'Hợp đồng',
        'internship': 'Thực tập'
    };
    return types[jobType] || jobType;
}

async function loadRelatedJobs(companyId, currentJobId) {
    try {
        const result = await RecruitmentApp.getJobs(1, { company_id: companyId, limit: 5 });
        
        if (result.success && result.data.length > 0) {
            // Filter out current job
            const relatedJobs = result.data.filter(job => job.job_id != currentJobId);
            displayRelatedJobs(relatedJobs);
        }
    } catch (error) {
        console.error('Error loading related jobs:', error);
    }
}

function displayRelatedJobs(jobs) {
    const container = document.getElementById('related-jobs');
    
    if (jobs.length === 0) {
        container.innerHTML = '<p>Không có việc làm liên quan</p>';
        return;
    }
    
    container.innerHTML = jobs.map(job => `
        <div class="related-job-item" onclick="window.location.href='job-detail.html?id=${job.job_id}'">
            <div class="related-job-title">${job.title}</div>
            <div class="related-job-company">${job.company_name}</div>
        </div>
    `).join('');
}

async function handleJobApply() {
    let user = RecruitmentApp.getCurrentUser();
    
    if (!user) {
        RecruitmentApp.showAlert('Bạn cần đăng nhập để ứng tuyển', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    // Try to refresh session if user type is not candidate
    if (user.user_type !== 'candidate') {
        RecruitmentApp.showAlert('Đang kiểm tra tài khoản...', 'info');
        user = await RecruitmentApp.refreshUserSession();
        
        if (user && user.user_type === 'candidate') {
            RecruitmentApp.showAlert('Đã cập nhật thông tin tài khoản', 'success');
        } else {
            const alertMessage = `Chỉ ứng viên mới có thể ứng tuyển. Tài khoản hiện tại: ${user ? user.user_type : 'không xác định'}. ` +
                                `Vui lòng đăng xuất và đăng nhập lại, hoặc liên hệ admin để chuyển đổi tài khoản.`;
            RecruitmentApp.showAlert(alertMessage, 'error');
            return;
        }
    }
    
    // Check application status before showing modal
    try {
        const checkResult = await RecruitmentApp.apiCall(`../api/applications.php?check_application=1&job_id=${currentJobId}`);
        console.log('Application check result:', checkResult);
        
        if (checkResult.success && checkResult.data) {
            const { applications, can_apply } = checkResult.data;
            
            if (!can_apply && applications.length > 0) {
                const activeApp = applications.find(app => app.status !== 'withdrawn');
                if (activeApp) {
                    RecruitmentApp.showAlert(
                        `Bạn đã ứng tuyển vào vị trí này rồi (Trạng thái: ${activeApp.status}, Ngày: ${RecruitmentApp.formatDate(activeApp.applied_at)}). ` +
                        `Bạn có thể xem chi tiết trong dashboard.`, 
                        'warning'
                    );
                    return;
                }
            }
        }
    } catch (error) {
        console.log('Could not check application status:', error);
        // Continue with application anyway
    }
    
    // Show application modal
    showApplicationModal(currentJobId);
}

function showApplicationModal(jobId) {
    // Create modal HTML
    const modalHTML = `
        <div id="application-modal" class="modal-overlay" onclick="closeApplicationModal()">
            <div class="modal-content application-modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>Ứng tuyển: ${currentJobData.title}</h3>
                    <button class="modal-close" onclick="closeApplicationModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="job-apply-info">
                        <div class="apply-job-summary">
                            <div class="apply-company-logo">
                                <i class="fas fa-building"></i>
                            </div>
                            <div class="apply-job-details">
                                <h4>${currentJobData.title}</h4>
                                <p>${currentJobData.company_name}</p>
                                <p><i class="fas fa-map-marker-alt"></i> ${currentJobData.location}</p>
                            </div>
                        </div>
                    </div>
                    
                    <form id="application-form">
                        <div class="form-group">
                            <label for="cover-letter">Thư xin việc:</label>
                            <textarea id="cover-letter" rows="6" placeholder="Viết thư xin việc của bạn...&#10;&#10;Ví dụ:&#10;Kính gửi quý công ty,&#10;&#10;Tôi rất quan tâm đến vị trí ${currentJobData.title} tại ${currentJobData.company_name}. Với kinh nghiệm và kỹ năng của mình, tôi tin rằng tôi sẽ đóng góp tích cực cho đội ngũ của công ty..."></textarea>
                        </div>
                        
                        <div class="application-tips">
                            <h5><i class="fas fa-lightbulb"></i> Gợi ý viết thư xin việc:</h5>
                            <ul>
                                <li>Thể hiện sự quan tâm đến vị trí và công ty</li>
                                <li>Nêu rõ kinh nghiệm và kỹ năng phù hợp</li>
                                <li>Giữ nội dung ngắn gọn, súc tích</li>
                                <li>Thể hiện thái độ chuyên nghiệp</li>
                            </ul>
                        </div>
                        
                        <div class="form-group">
                            <button type="submit" class="btn btn-primary form-submit">
                                <i class="fas fa-paper-plane"></i> Nộp đơn ứng tuyển
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup form handler
    const form = document.getElementById('application-form');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const coverLetter = document.getElementById('cover-letter').value;
        const result = await RecruitmentApp.applyForJob(jobId, coverLetter);
        
        if (result.success) {
            RecruitmentApp.showAlert(result.message, 'success');
            closeApplicationModal();
            // Update application count
            const appCount = document.getElementById('job-applications');
            appCount.textContent = parseInt(appCount.textContent) + 1;
            if (window.updateApplicationBadge && typeof window.updateApplicationBadge === 'function') {
                window.updateApplicationBadge();
            }
        } else {
            RecruitmentApp.showAlert(result.message, 'error');
        }
    });
}

function closeApplicationModal() {
    const modal = document.getElementById('application-modal');
    if (modal) {
        modal.remove();
    }
}

function handleSaveJob() {
    // Placeholder for save job functionality
    RecruitmentApp.showAlert('Tính năng lưu việc làm sẽ được phát triển sớm', 'info');
}

function handleShareJob() {
    const url = window.location.href;
    const title = currentJobData ? currentJobData.title : 'Việc làm tại JobPortal';
    
    if (navigator.share) {
        // Use native share API if available
        navigator.share({
            title: title,
            text: `Xem việc làm: ${title}`,
            url: url
        });
    } else {
        // Fallback to copy URL
        navigator.clipboard.writeText(url).then(() => {
            RecruitmentApp.showAlert('Đã copy link vào clipboard', 'success');
        }).catch(() => {
            // Create share modal
            showShareModal(url, title);
        });
    }
}

function showShareModal(url, title) {
    const modalHTML = `
        <div id="share-modal" class="modal-overlay" onclick="closeShareModal()">
            <div class="modal-content share-modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>Chia sẻ việc làm</h3>
                    <button class="modal-close" onclick="closeShareModal()">×</button>
                </div>
                <div class="modal-body">
                    <p>Chia sẻ việc làm này:</p>
                    <div class="share-options">
                        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" class="share-btn facebook">
                            <i class="fab fa-facebook"></i> Facebook
                        </a>
                        <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}" target="_blank" class="share-btn twitter">
                            <i class="fab fa-twitter"></i> Twitter
                        </a>
                        <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" target="_blank" class="share-btn linkedin">
                            <i class="fab fa-linkedin"></i> LinkedIn
                        </a>
                    </div>
                    <div class="share-url">
                        <label>Link:</label>
                        <input type="text" value="${url}" readonly onclick="this.select()">
                        <button onclick="copyToClipboard('${url}')" class="btn btn-outline btn-sm">Copy</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) {
        modal.remove();
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        RecruitmentApp.showAlert('Đã copy link', 'success');
        closeShareModal();
    });
}

function showLoading() {
    document.getElementById('loading-state').style.display = 'flex';
    document.getElementById('job-detail-content').style.display = 'none';
    document.getElementById('error-state').style.display = 'none';
}

function showContent() {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('job-detail-content').style.display = 'block';
    document.getElementById('error-state').style.display = 'none';
}

function showError(message) {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('job-detail-content').style.display = 'none';
    document.getElementById('error-state').style.display = 'flex';
    
    // Update error message if needed
    const errorContent = document.querySelector('#error-state .error-content p');
    if (errorContent && message) {
        errorContent.textContent = message;
    }
}

function hideLoading() {
    document.getElementById('loading-state').style.display = 'none';
}

// Debug function for application status
async function debugApplicationStatus() {
    const user = RecruitmentApp.getCurrentUser();
    
    if (!user) {
        alert('Vui lòng đăng nhập trước');
        return;
    }
    
    if (!currentJobId) {
        alert('Không tìm thấy ID công việc');
        return;
    }
    
    try {
        // Check application status
        const checkResult = await RecruitmentApp.apiCall(`../api/applications.php?check_application=1&job_id=${currentJobId}`);
        
        let debugInfo = `=== DEBUG THÔNG TIN ỨNG TUYỂN ===\n\n`;
        debugInfo += `User ID: ${user.user_id}\n`;
        debugInfo += `User Type: ${user.user_type}\n`;
        debugInfo += `Email: ${user.email}\n`;
        debugInfo += `Job ID: ${currentJobId}\n\n`;
        
        if (checkResult.success) {
            const data = checkResult.data;
            debugInfo += `Candidate ID: ${data.candidate_id}\n`;
            debugInfo += `Có thể ứng tuyển: ${data.can_apply ? 'CÓ' : 'KHÔNG'}\n`;
            debugInfo += `Số đơn ứng tuyển hiện tại: ${data.applications.length}\n\n`;
            
            if (data.applications.length > 0) {
                debugInfo += `Chi tiết các đơn ứng tuyển:\n`;
                data.applications.forEach((app, index) => {
                    debugInfo += `${index + 1}. ID: ${app.application_id}, Trạng thái: ${app.status}, Ngày: ${app.applied_at}\n`;
                });
            } else {
                debugInfo += `Không có đơn ứng tuyển nào.\n`;
            }
        } else {
            debugInfo += `LỖI: ${checkResult.message}\n`;
        }
        
        // Copy to clipboard and show
        navigator.clipboard.writeText(debugInfo).then(() => {
            alert('Thông tin debug đã được copy vào clipboard!\n\n' + debugInfo);
        }).catch(() => {
            alert(debugInfo);
        });
        
    } catch (error) {
        alert('Lỗi khi debug: ' + error.message);
    }
}

// Global function access
window.closeApplicationModal = closeApplicationModal;
window.closeShareModal = closeShareModal;
window.copyToClipboard = copyToClipboard;
window.debugApplicationStatus = debugApplicationStatus;