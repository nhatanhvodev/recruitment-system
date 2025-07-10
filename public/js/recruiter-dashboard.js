// Recruiter Dashboard JavaScript functionality

let currentUser = null;
let currentCompanyId = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing recruiter dashboard...');
    
    // Check authentication and user type
    if (!checkRecruiterAuth()) {
        return;
    }
    
    // Initialize dashboard
    initializeDashboard();
});

function checkRecruiterAuth() {
    currentUser = RecruitmentApp.getCurrentUser();
    
    if (!currentUser) {
        RecruitmentApp.showAlert('Bạn cần đăng nhập để truy cập trang này', 'error');
        window.location.href = '../login.html';
        return false;
    }
    
    if (currentUser.user_type !== 'recruiter') {
        RecruitmentApp.showAlert('Chỉ nhà tuyển dụng mới có thể truy cập dashboard này', 'error');
        window.location.href = '../index.html';
        return false;
    }
    
    return true;
}

function initializeDashboard() {
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(tabName + '-tab').classList.add('active');
        });
    });
    
    // Quick action buttons
    const quickPostJob = document.getElementById('quick-post-job');
    const detailedPostJob = document.getElementById('detailed-post-job');
    const createJobBtn = document.getElementById('create-job-btn');
    
    if (quickPostJob) {
        quickPostJob.addEventListener('click', () => {
            openJobModal('quick');
        });
    }
    
    if (detailedPostJob) {
        detailedPostJob.addEventListener('click', () => {
            openJobModal('detailed');
        });
    }
    
    if (createJobBtn) {
        createJobBtn.addEventListener('click', () => {
            openJobModal('detailed');
        });
    }
    
    // User menu functionality
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.querySelector('.user-dropdown');
    
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            userDropdown.classList.remove('show');
        });
    }
    
    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                // Clear session and redirect
                sessionStorage.clear();
                localStorage.clear();
                window.location.href = '../login.html';
            }
        });
    }
    
    // Load user data
    loadUserData();
    
    console.log('Recruiter dashboard initialized successfully');
}

async function loadUserData() {
    try {
        // Update user name
        if (currentUser) {
            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                userNameElement.textContent = currentUser.name || currentUser.email;
            }
        }
        
        // Get user's company information
        const result = await RecruitmentApp.apiCall('../../api/companies.php?user_companies=1');
        
        if (result.success && result.data.length > 0) {
            currentCompanyId = result.data[0].company_id;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Job posting modal functions
function openJobModal(type = 'detailed') {
    const modal = document.getElementById('job-posting-modal');
    const modalTitle = document.getElementById('modal-title');
    
    if (type === 'quick') {
        modalTitle.textContent = 'Đăng tin nhanh';
        // Hide some sections for quick posting
        document.querySelectorAll('.form-section:not(:first-child)').forEach(section => {
            section.style.display = 'none';
        });
    } else {
        modalTitle.textContent = 'Đăng tin tuyển dụng';
        // Show all sections
        document.querySelectorAll('.form-section').forEach(section => {
            section.style.display = 'block';
        });
    }
    
    modal.style.display = 'flex';
    
    // Initialize job posting functionality
    setupJobPostingForm();
}

function closeJobModal() {
    const modal = document.getElementById('job-posting-modal');
    modal.style.display = 'none';
    
    // Reset form
    const form = document.getElementById('job-posting-form');
    if (form) {
        form.reset();
        // Clear any error messages
        document.querySelectorAll('.field-error').forEach(error => error.remove());
        // Reset character counts
        document.getElementById('desc-count').textContent = '0';
        document.getElementById('req-count').textContent = '0';
    }
}

function closeApplicantModal() {
    document.getElementById('applicant-detail-modal').style.display = 'none';
}

// Job posting form functionality
function setupJobPostingForm() {
    setupFormValidation();
    setupCharacterCounts();
    setupEditorToolbar();
    setupFormSubmission();
    setupPreview();
    loadUserCompanyInfo();
}

async function loadUserCompanyInfo() {
    try {
        // Get user's company information
        const result = await RecruitmentApp.apiCall('../../api/companies.php?user_companies=1');
        
        if (result.success && result.data.length > 0) {
            currentCompanyId = result.data[0].company_id;
            // Pre-fill contact information if available
            if (result.data[0].email) {
                document.getElementById('contact-email').value = result.data[0].email;
            }
        }
    } catch (error) {
        console.error('Error loading company info:', error);
    }
}

function setupFormValidation() {
    const form = document.getElementById('job-posting-form');
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
    
    // Salary validation
    const salaryInput = document.getElementById('job-salary');
    salaryInput.addEventListener('input', function() {
        const value = parseInt(this.value);
        if (value && value < 1000000) {
            showFieldError(this, 'Mức lương tối thiểu là 1,000,000 VNĐ');
        } else {
            clearFieldError(this);
        }
    });
    
    // Date validation
    const expiresInput = document.getElementById('job-expires');
    expiresInput.addEventListener('change', function() {
        const selectedDate = new Date(this.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            showFieldError(this, 'Hạn nộp hồ sơ phải từ hôm nay trở đi');
        } else {
            clearFieldError(this);
        }
    });
}

function validateField(field) {
    const value = field.value.trim();
    
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'Trường này là bắt buộc');
        return false;
    }
    
    // Email validation
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showFieldError(field, 'Email không hợp lệ');
            return false;
        }
    }
    
    // Phone validation
    if (field.type === 'tel' && value) {
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
            showFieldError(field, 'Số điện thoại không hợp lệ');
            return false;
        }
    }
    
    clearFieldError(field);
    return true;
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    field.style.borderColor = '#dc3545';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '0.85rem';
    errorDiv.style.marginTop = '0.5rem';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.style.borderColor = '';
    
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

function setupCharacterCounts() {
    const descTextarea = document.getElementById('job-description');
    const reqTextarea = document.getElementById('job-requirements');
    
    updateCharacterCount(descTextarea, 'desc-count', 2000);
    updateCharacterCount(reqTextarea, 'req-count', 1500);
    
    descTextarea.addEventListener('input', function() {
        updateCharacterCount(this, 'desc-count', 2000);
    });
    
    reqTextarea.addEventListener('input', function() {
        updateCharacterCount(this, 'req-count', 1500);
    });
}

function updateCharacterCount(textarea, counterId, maxLength) {
    const counter = document.getElementById(counterId);
    const currentLength = textarea.value.length;
    
    counter.textContent = currentLength;
    counter.parentNode.className = 'char-count';
    
    if (currentLength > maxLength * 0.9) {
        counter.parentNode.classList.add('warning');
    }
    
    if (currentLength > maxLength) {
        counter.parentNode.classList.add('danger');
        textarea.style.borderColor = '#dc3545';
    } else {
        textarea.style.borderColor = '';
    }
}

function setupEditorToolbar() {
    const editorBtns = document.querySelectorAll('.editor-btn');
    
    editorBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.dataset.action;
            const textarea = this.parentNode.nextElementSibling;
            
            handleEditorAction(action, textarea);
        });
    });
}

function handleEditorAction(action, textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let replacement = '';
    
    switch (action) {
        case 'bold':
            replacement = `**${selectedText}**`;
            break;
        case 'italic':
            replacement = `*${selectedText}*`;
            break;
        case 'list':
            replacement = selectedText.split('\n').map(line => `- ${line}`).join('\n');
            break;
    }
    
    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    
    // Update character count
    const event = new Event('input');
    textarea.dispatchEvent(event);
    
    // Set cursor position
    textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    textarea.focus();
}

function setupFormSubmission() {
    const form = document.getElementById('job-posting-form');
    const submitBtn = document.getElementById('submit-btn');
    const saveDraftBtn = document.getElementById('save-draft-btn');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        submitJob(false);
    });
    
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', function() {
            submitJob(true);
        });
    }
}

async function submitJob(isDraft = false) {
    if (!validateForm()) {
        return;
    }
    
    setFormLoading(true);
    
    try {
        const formData = collectFormData();
        formData.is_draft = isDraft;
        
        const result = await RecruitmentApp.apiCall('../../api/jobs.php', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        if (result.success) {
            showSuccessMessage(isDraft ? 'Đã lưu nháp thành công!' : 'Đăng tin tuyển dụng thành công!');
            
            // Close modal after a short delay
            setTimeout(() => {
                closeJobModal();
                // Refresh jobs list if on jobs tab
                if (document.getElementById('jobs-tab').classList.contains('active')) {
                    // TODO: Refresh jobs list
                }
            }, 2000);
        } else {
            RecruitmentApp.showAlert(result.message || 'Có lỗi xảy ra khi đăng tin', 'error');
        }
    } catch (error) {
        console.error('Error submitting job:', error);
        RecruitmentApp.showAlert('Có lỗi xảy ra khi đăng tin', 'error');
    } finally {
        setFormLoading(false);
    }
}

function validateForm() {
    const form = document.getElementById('job-posting-form');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

function collectFormData() {
    const form = document.getElementById('job-posting-form');
    const formData = new FormData(form);
    
    const data = {
        title: formData.get('title'),
        job_type: formData.get('job_type'),
        location: formData.get('location'),
        salary: formData.get('salary') ? parseInt(formData.get('salary')) : null,
        expires_at: formData.get('expires_at') || null,
        description: formData.get('description'),
        requirements: formData.get('requirements'),
        benefits: formData.getAll('benefits'),
        additional_benefits: formData.get('additional_benefits'),
        contact_person: formData.get('contact_person'),
        contact_email: formData.get('contact_email'),
        contact_phone: formData.get('contact_phone'),
        company_id: currentCompanyId
    };
    
    return data;
}

function setFormLoading(loading) {
    const form = document.getElementById('job-posting-form');
    const submitBtn = document.getElementById('submit-btn');
    const saveDraftBtn = document.getElementById('save-draft-btn');
    
    if (loading) {
        form.classList.add('form-loading');
        submitBtn.classList.add('btn-loading');
        if (saveDraftBtn) saveDraftBtn.classList.add('btn-loading');
    } else {
        form.classList.remove('form-loading');
        submitBtn.classList.remove('btn-loading');
        if (saveDraftBtn) saveDraftBtn.classList.remove('btn-loading');
    }
}

function showSuccessMessage(message) {
    const form = document.getElementById('job-posting-form');
    
    // Remove existing success message
    const existingMessage = form.querySelector('.success-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    form.insertBefore(successDiv, form.firstChild);
}

function setupPreview() {
    const previewBtn = document.getElementById('preview-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', showJobPreview);
    }
}

function showJobPreview() {
    if (!validateForm()) {
        return;
    }
    
    const data = collectFormData();
    const previewContent = generatePreviewHTML(data);
    
    document.getElementById('job-preview-content').innerHTML = previewContent;
    document.getElementById('job-preview-modal').style.display = 'flex';
}

function generatePreviewHTML(data) {
    const benefitsMap = {
        'competitive-salary': 'Lương cạnh tranh',
        'health-insurance': 'Bảo hiểm y tế',
        'performance-bonus': 'Thưởng hiệu suất',
        'training': 'Đào tạo & phát triển',
        'flexible-time': 'Giờ làm linh hoạt',
        'remote-work': 'Làm việc từ xa'
    };
    
    const jobTypeMap = {
        'full-time': 'Toàn thời gian',
        'part-time': 'Bán thời gian',
        'contract': 'Hợp đồng',
        'internship': 'Thực tập'
    };
    
    return `
        <div class="preview-section">
            <h4><i class="fas fa-info-circle"></i> Thông tin cơ bản</h4>
            <div class="preview-meta">
                <div class="preview-meta-item">
                    <div class="preview-meta-label">Tiêu đề</div>
                    <div class="preview-meta-value">${data.title}</div>
                </div>
                <div class="preview-meta-item">
                    <div class="preview-meta-label">Loại công việc</div>
                    <div class="preview-meta-value">${jobTypeMap[data.job_type] || data.job_type}</div>
                </div>
                <div class="preview-meta-item">
                    <div class="preview-meta-label">Địa điểm</div>
                    <div class="preview-meta-value">${data.location}</div>
                </div>
                <div class="preview-meta-item">
                    <div class="preview-meta-label">Mức lương</div>
                    <div class="preview-meta-value">${data.salary ? data.salary.toLocaleString('vi-VN') + ' VNĐ' : 'Thỏa thuận'}</div>
                </div>
                <div class="preview-meta-item">
                    <div class="preview-meta-label">Hạn nộp</div>
                    <div class="preview-meta-value">${data.expires_at ? new Date(data.expires_at).toLocaleDateString('vi-VN') : 'Không giới hạn'}</div>
                </div>
            </div>
        </div>
        
        <div class="preview-section">
            <h4><i class="fas fa-file-alt"></i> Mô tả công việc</h4>
            <div class="preview-content">${formatPreviewText(data.description)}</div>
        </div>
        
        <div class="preview-section">
            <h4><i class="fas fa-user-check"></i> Yêu cầu ứng viên</h4>
            <div class="preview-content">${formatPreviewText(data.requirements)}</div>
        </div>
        
        ${data.benefits && data.benefits.length > 0 ? `
        <div class="preview-section">
            <h4><i class="fas fa-gift"></i> Quyền lợi & Phúc lợi</h4>
            <div class="preview-benefits">
                ${data.benefits.map(benefit => `
                    <span class="preview-benefit-tag">
                        <i class="fas fa-check"></i>
                        ${benefitsMap[benefit] || benefit}
                    </span>
                `).join('')}
            </div>
            ${data.additional_benefits ? `<div class="preview-content" style="margin-top: 1rem;">${formatPreviewText(data.additional_benefits)}</div>` : ''}
        </div>
        ` : ''}
        
        <div class="preview-section">
            <h4><i class="fas fa-envelope"></i> Thông tin liên hệ</h4>
            <div class="preview-meta">
                ${data.contact_person ? `
                <div class="preview-meta-item">
                    <div class="preview-meta-label">Người liên hệ</div>
                    <div class="preview-meta-value">${data.contact_person}</div>
                </div>
                ` : ''}
                ${data.contact_email ? `
                <div class="preview-meta-item">
                    <div class="preview-meta-label">Email</div>
                    <div class="preview-meta-value">${data.contact_email}</div>
                </div>
                ` : ''}
                ${data.contact_phone ? `
                <div class="preview-meta-item">
                    <div class="preview-meta-label">Số điện thoại</div>
                    <div class="preview-meta-value">${data.contact_phone}</div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

function formatPreviewText(text) {
    if (!text) return '';
    
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function closeJobPreview() {
    document.getElementById('job-preview-modal').style.display = 'none';
}

function submitJobFromPreview() {
    closeJobPreview();
    submitJob(false);
}