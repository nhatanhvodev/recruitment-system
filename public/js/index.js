// Index page JavaScript functionality

// Initialize index page
document.addEventListener('DOMContentLoaded', function() {
    setupSmoothScrolling();
    setupContactForm();
    setupScrollNavigation();
    setupDashboardRedirect();
});

// Smooth scroll for navigation links
function setupSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                // Remove active class from all nav links
                document.querySelectorAll('.nav-menu a').forEach(navLink => {
                    navLink.classList.remove('active');
                });
                
                // Add active class to clicked link
                this.classList.add('active');
                
                // Smooth scroll to section
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Setup dashboard redirect based on user type
function setupDashboardRedirect() {
    const dashboardLink = document.getElementById('dashboard-link');
    
    if (dashboardLink) {
        dashboardLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            console.log('Dashboard link clicked');
            
            // Get current user directly from localStorage first
            let user = null;
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    user = JSON.parse(userData);
                    console.log('User from localStorage:', user);
                } catch (error) {
                    console.error('Error parsing user data:', error);
                }
            }
            
            // Fallback to RecruitmentApp.getCurrentUser()
            if (!user) {
                user = RecruitmentApp.getCurrentUser();
                console.log('User from RecruitmentApp:', user);
            }
            
            if (!user) {
                console.log('No user found, redirecting to login');
                RecruitmentApp.showAlert('Bạn cần đăng nhập để truy cập dashboard', 'error');
                window.location.href = 'login.html';
                return;
            }
            
            console.log('User type:', user.user_type);
            
            // Redirect based on user type
            let redirectUrl = '';
            if (user.user_type === 'admin') {
                redirectUrl = 'admin/dashboard.html';
            } else if (user.user_type === 'recruiter') {
                redirectUrl = 'recruiter/dashboard.html';
            } else {
                redirectUrl = 'candidate/dashboard.html';
            }
            
            console.log('Redirecting to:', redirectUrl);
            window.location.href = redirectUrl;
        });
    }
}

// Contact form submission
function setupContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const name = formData.get('name');
            const email = formData.get('email');
            const phone = formData.get('phone');
            const subject = formData.get('subject');
            const message = formData.get('message');
            
            // Basic validation
            if (!name || !email || !message) {
                RecruitmentApp.showAlert('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                RecruitmentApp.showAlert('Vui lòng nhập email hợp lệ', 'error');
                return;
            }
            
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
            submitBtn.disabled = true;
            
            // Simulate sending (in real app, this would be an API call)
            setTimeout(() => {
                RecruitmentApp.showAlert('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.', 'success');
                
                // Reset form
                this.reset();
                
                // Restore button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }
}

// Update active nav link on scroll
function setupScrollNavigation() {
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-menu a');
        
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            const sectionHeight = section.offsetHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        // Update active nav link
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
        
        // Handle home page active state
        if (window.scrollY < 100) {
            navLinks.forEach(link => link.classList.remove('active'));
            const homeLink = document.querySelector('a[href="index.html"]');
            if (homeLink) {
                homeLink.classList.add('active');
            }
        }
    });
}