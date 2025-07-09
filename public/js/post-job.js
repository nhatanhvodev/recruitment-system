// Post Job page JavaScript functionality

let currentUser = null;
let currentCompanyId = null;

// Initialize post job page
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication and user type
    if (!checkRecruiterAuth()) {
        return;
    }
    
    setupFormValidation();
    setupCharacterCounts();
    setupEditorToolbar();
    setupFormSubmission();
    setupPreview();
    loadUserCompanyInfo();
});

function checkRecruiterAuth() {
    currentUser = RecruitmentApp.getCurrentUser();
    
    if (!currentUser) {
        RecruitmentApp.showAlert('Bạn cần đăng nhập để truy cập trang này', 'error');
        window.location.href = 'login.html';
        return false;
    }
    
    if (currentUser.user_type !== 'recruiter') {
        RecruitmentApp.showAlert('Chỉ nhà tuyển dụng mới có thể đăng tin tuyển dụng', 'error');
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

async function loadUserCompanyInfo() {
    try {
        // Get user's company information
        const result = await RecruitmentApp.apiCall('../api/companies.php?user_companies=1');
        
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
    const form = document.getElementById('post-job-form');
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
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);
    
    let newText = '';
    let newCursorPos = start;
    
    switch (action) {
        case 'bold':
            newText = `**${selectedText || 'văn bản in đậm'}**`;
            newCursorPos = start + (selectedText ? newText.length : 2);
            break;
            
        case 'italic':
            newText = `*${selectedText || 'văn bản in nghiêng'}*`;
            newCursorPos = start + (selectedText ? newText.length : 1);
            break;
            
        case 'list':
            const lines = (selectedText || 'Mục danh sách').split('\n');
            newText = lines.map(line => `• ${line}`).join('\n');
            newCursorPos = start + newText.length;
            break;
    }
    
    textarea.value = beforeText + newText + afterText;
    textarea.focus();
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    
    // Trigger character count update
    textarea.dispatchEvent(new Event('input'));
}

function setupFormSubmission() {
    const form = document.getElementById('post-job-form');
    const submitBtn = document.getElementById('submit-btn');
    const saveDraftBtn = document.getElementById('save-draft-btn');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await submitJob(false);
    });
    
    saveDraftBtn.addEventListener('click', async function() {
        await submitJob(true);
    });
}

async function submitJob(isDraft = false) {
    if (!validateForm()) {
        return;
    }
    
    const formData = collectFormData();
    formData.status = isDraft ? 'draft' : 'pending';
    
    try {
        setFormLoading(true);
        
        const result = await RecruitmentApp.apiCall('../api/jobs.php', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        if (result.success) {
            showSuccessMessage(isDraft ? 'Đã lưu nháp thành công!' : 'Đăng tin tuyển dụng thành công!');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            RecruitmentApp.showAlert(result.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Error submitting job:', error);
        RecruitmentApp.showAlert('Có lỗi xảy ra khi đăng tin', 'error');
    } finally {
        setFormLoading(false);
    }
}

function validateForm() {
    const form = document.getElementById('post-job-form');
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
    const form = document.getElementById('post-job-form');
    const formData = {};
    
    // Basic fields
    formData.title = document.getElementById('job-title').value.trim();
    formData.job_type = document.getElementById('job-type').value;
    formData.location = document.getElementById('job-location').value.trim();
    formData.salary = document.getElementById('job-salary').value || null;
    formData.expires_at = document.getElementById('job-expires').value || null;
    formData.description = document.getElementById('job-description').value.trim();
    formData.requirements = document.getElementById('job-requirements').value.trim();
    
    // Benefits
    const selectedBenefits = Array.from(form.querySelectorAll('input[name="benefits[]"]:checked'))
        .map(cb => cb.value);
    const additionalBenefits = document.getElementById('additional-benefits').value.trim();
    
    formData.benefits = selectedBenefits.join(',');
    if (additionalBenefits) {
        formData.additional_benefits = additionalBenefits;
    }
    
    // Contact info
    formData.contact_person = document.getElementById('contact-person').value.trim();
    formData.contact_email = document.getElementById('contact-email').value.trim();
    formData.contact_phone = document.getElementById('contact-phone').value.trim();
    
    return formData;
}

function setFormLoading(loading) {
    const form = document.getElementById('post-job-form');
    const submitBtn = document.getElementById('submit-btn');
    const saveDraftBtn = document.getElementById('save-draft-btn');
    
    if (loading) {
        form.classList.add('form-loading');
        submitBtn.classList.add('btn-loading');
        saveDraftBtn.classList.add('btn-loading');
        submitBtn.disabled = true;
        saveDraftBtn.disabled = true;
    } else {
        form.classList.remove('form-loading');
        submitBtn.classList.remove('btn-loading');
        saveDraftBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
        saveDraftBtn.disabled = false;
    }
}

function showSuccessMessage(message) {
    const form = document.getElementById('post-job-form');
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        ${message}
    `;
    
    form.insertBefore(successDiv, form.firstChild);
    
    // Scroll to top
    successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function setupPreview() {
    const previewBtn = document.getElementById('preview-btn');
    
    previewBtn.addEventListener('click', function() {
        showJobPreview();
    });
}

function showJobPreview() {
    const formData = collectFormData();
    const modal = document.getElementById('job-preview-modal');
    const previewContent = document.getElementById('job-preview-content');
    
    // Generate preview HTML
    previewContent.innerHTML = generatePreviewHTML(formData);
    
    // Show modal
    modal.style.display = 'flex';
}

function generatePreviewHTML(data) {
    const jobTypeText = {
        'full-time': 'Toàn thời gian',
        'part-time': 'Bán thời gian',
        'contract': 'Hợp đồng',
        'internship': 'Thực tập'
    }[data.job_type] || data.job_type;
    
    const salaryText = data.salary ? RecruitmentApp.formatCurrency(data.salary) : 'Thỏa thuận';
    
    const benefitLabels = {
        'competitive-salary': 'Lương cạnh tranh',
        'health-insurance': 'Bảo hiểm y tế',
        'performance-bonus': 'Thưởng hiệu suất',
        'training': 'Đào tạo & phát triển',
        'flexible-time': 'Giờ làm linh hoạt',
        'remote-work': 'Làm việc từ xa'
    };
    
    const benefitTags = data.benefits ? data.benefits.split(',').map(benefit => 
        `<span class="preview-benefit-tag">
            <i class="fas fa-check"></i>
            ${benefitLabels[benefit] || benefit}
        </span>`
    ).join('') : '';
    
    return `
        <div class="preview-section">
            <h4><i class="fas fa-briefcase"></i> ${data.title}</h4>
            <div class="preview-meta">
                <div class="preview-meta-item">
                    <span class="preview-meta-label">Loại công việc:</span>
                    <span class="preview-meta-value">${jobTypeText}</span>
                </div>
                <div class="preview-meta-item">
                    <span class="preview-meta-label">Địa điểm:</span>
                    <span class="preview-meta-value">${data.location}</span>
                </div>
                <div class="preview-meta-item">
                    <span class="preview-meta-label">Mức lương:</span>
                    <span class="preview-meta-value">${salaryText}</span>
                </div>
                <div class="preview-meta-item">
                    <span class="preview-meta-label">Hạn nộp:</span>
                    <span class="preview-meta-value">${data.expires_at ? RecruitmentApp.formatDate(data.expires_at) : 'Không giới hạn'}</span>
                </div>
            </div>
        </div>
        
        <div class="preview-section">
            <h4><i class="fas fa-file-alt"></i> Mô tả công việc</h4>
            <div class="preview-content">${formatPreviewText(data.description)}</div>
        </div>
        
        <div class="preview-section">
            <h4><i class="fas fa-list-check"></i> Yêu cầu ứng viên</h4>
            <div class="preview-content">${formatPreviewText(data.requirements)}</div>
        </div>
        
        ${benefitTags ? `
        <div class="preview-section">
            <h4><i class="fas fa-gift"></i> Quyền lợi & Phúc lợi</h4>
            <div class="preview-benefits">${benefitTags}</div>
            ${data.additional_benefits ? `<div class="preview-content" style="margin-top: 1rem;">${formatPreviewText(data.additional_benefits)}</div>` : ''}
        </div>
        ` : ''}
        
        ${data.contact_person || data.contact_email || data.contact_phone ? `
        <div class="preview-section">
            <h4><i class="fas fa-envelope"></i> Thông tin liên hệ</h4>
            <div class="preview-content">
                ${data.contact_person ? `<p><strong>Người liên hệ:</strong> ${data.contact_person}</p>` : ''}
                ${data.contact_email ? `<p><strong>Email:</strong> ${data.contact_email}</p>` : ''}
                ${data.contact_phone ? `<p><strong>Điện thoại:</strong> ${data.contact_phone}</p>` : ''}
            </div>
        </div>
        ` : ''}
    `;
}

function formatPreviewText(text) {
    if (!text) return '';
    
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/•\s/g, '• ')
        .replace(/\n/g, '<br>');
}

function closeJobPreview() {
    document.getElementById('job-preview-modal').style.display = 'none';
}

function submitJobFromPreview() {
    closeJobPreview();
    submitJob(false);
}

// Global functions
window.closeJobPreview = closeJobPreview;
window.submitJobFromPreview = submitJobFromPreview;