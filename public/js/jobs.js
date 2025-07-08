// Jobs page JavaScript functionality

let currentPage = 1;
let currentFilters = {};
let isLoading = false;

// Initialize jobs page
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadJobs();
});

function setupEventListeners() {
    // Search button
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    // Enter key on search inputs
    const searchInputs = ['search-keyword', 'search-location', 'search-job-type'];
    searchInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleSearch();
                }
            });
        }
    });
    
    // Sort dropdown
    const sortSelect = document.getElementById('sort-jobs');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentFilters.sort = this.value;
            loadJobs();
        });
    }
}

function handleSearch() {
    const keyword = document.getElementById('search-keyword')?.value || '';
    const location = document.getElementById('search-location')?.value || '';
    const jobType = document.getElementById('search-job-type')?.value || '';
    
    currentFilters = {
        search: keyword,
        location: location,
        job_type: jobType
    };
    
    currentPage = 1;
    loadJobs();
}

async function loadJobs() {
    if (isLoading) return;
    
    isLoading = true;
    const container = document.getElementById('jobs-container');
    const resultsCount = document.getElementById('results-count');
    
    // Show loading
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Đang tải việc làm...</p>
            </div>
        `;
    }
    
    try {
        const filters = {
            ...currentFilters,
            page: currentPage,
            limit: 9
        };
        
        const result = await RecruitmentApp.getJobs(currentPage, filters);
        
        if (result.success) {
            displayJobs(result.data);
            updateResultsCount(result.data.length);
            updatePagination(result.pagination);
        } else {
            if (container) {
                container.innerHTML = `
                    <div class="loading">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Không thể tải việc làm. Vui lòng thử lại.</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
        if (container) {
            container.innerHTML = `
                <div class="loading">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Có lỗi xảy ra. Vui lòng thử lại.</p>
                </div>
            `;
        }
    }
    
    isLoading = false;
}

function displayJobs(jobs) {
    const container = document.getElementById('jobs-container');
    if (!container) return;
    
    if (jobs.length === 0) {
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-search"></i>
                <p>Không tìm thấy việc làm phù hợp.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = jobs.map(job => createJobCard(job)).join('');
}

function createJobCard(job) {
    const salary = RecruitmentApp.formatCurrency(job.salary);
    const postedDate = RecruitmentApp.formatRelativeTime(job.posted_at);
    const companyLogo = job.company_logo || '';
    
    return `
        <div class="job-card" onclick="viewJobDetail(${job.job_id})">
            <div class="job-header">
                <div class="company-logo">
                    ${companyLogo ? `<img src="${companyLogo}" alt="${job.company_name}">` : '<i class="fas fa-building"></i>'}
                </div>
                <div class="job-info">
                    <h3>${job.title}</h3>
                    <div class="company-name">${job.company_name}</div>
                </div>
            </div>
            <div class="job-details">
                <div class="job-description">
                    ${job.description.substring(0, 150)}${job.description.length > 150 ? '...' : ''}
                </div>
                <div class="job-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                    <span class="salary"><i class="fas fa-money-bill-wave"></i> ${salary}</span>
                    <span><i class="fas fa-clock"></i> ${postedDate}</span>
                    <span><i class="fas fa-eye"></i> ${job.view_count} lượt xem</span>
                </div>
            </div>
            <div class="job-footer">
                <span class="job-type">${getJobTypeText(job.job_type)}</span>
                <button class="btn btn-primary apply-btn" onclick="event.stopPropagation(); handleApply(${job.job_id})">
                    Ứng tuyển
                </button>
            </div>
        </div>
    `;
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

function updateResultsCount(count) {
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
        resultsCount.textContent = `Tìm thấy ${count} việc làm`;
    }
}

function updatePagination(pagination) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer || !pagination) return;
    
    const { page, limit, total } = pagination;
    const totalPages = Math.ceil(total / limit);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    if (page > 1) {
        paginationHTML += `<button onclick="changePage(${page - 1})">‹ Trước</button>`;
    }
    
    // Page numbers
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
        const activeClass = i === page ? 'active' : '';
        paginationHTML += `<button class="${activeClass}" onclick="changePage(${i})">${i}</button>`;
    }
    
    // Next button
    if (page < totalPages) {
        paginationHTML += `<button onclick="changePage(${page + 1})">Sau ›</button>`;
    }
    
    paginationContainer.innerHTML = paginationHTML;
}

function changePage(page) {
    currentPage = page;
    loadJobs();
    
    // Scroll to jobs section
    const jobsSection = document.querySelector('.jobs-section');
    if (jobsSection) {
        jobsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function viewJobDetail(jobId) {
    window.location.href = `job-detail.html?id=${jobId}`;
}

async function handleApply(jobId) {
    const user = RecruitmentApp.getCurrentUser();
    
    if (!user) {
        RecruitmentApp.showAlert('Bạn cần đăng nhập để ứng tuyển', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    if (user.user_type !== 'candidate') {
        RecruitmentApp.showAlert('Chỉ ứng viên mới có thể ứng tuyển', 'error');
        return;
    }
    
    // Show application modal or redirect
    showApplicationModal(jobId);
}

function showApplicationModal(jobId) {
    // Create modal
    const modalHTML = `
        <div id="application-modal" class="modal-overlay" onclick="closeApplicationModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>Ứng tuyển công việc</h3>
                    <button class="modal-close" onclick="closeApplicationModal()">×</button>
                </div>
                <div class="modal-body">
                    <form id="application-form">
                        <div class="form-group">
                            <label for="cover-letter">Thư xin việc:</label>
                            <textarea id="cover-letter" rows="5" placeholder="Viết thư xin việc của bạn..."></textarea>
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn btn-primary form-submit">Nộp đơn ứng tuyển</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Modal styles are now in style.css
    
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

// Export functions for global access
window.viewJobDetail = viewJobDetail;
window.handleApply = handleApply;
window.changePage = changePage;
window.showApplicationModal = showApplicationModal;
window.closeApplicationModal = closeApplicationModal;