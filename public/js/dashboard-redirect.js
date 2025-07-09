// Dashboard Redirect Script
// Add this to the old dashboard.html to redirect recruiters to the new dashboard

(function() {
    'use strict';
    
    // Check if required dependencies are available
    if (typeof RecruitmentApp === 'undefined') {
        console.warn('RecruitmentApp not found. Dashboard redirect script will not work.');
        return;
    }

    document.addEventListener('DOMContentLoaded', function() {
        try {
            // Check if user is a recruiter
            const currentUser = RecruitmentApp.getCurrentUser();
            
            if (currentUser && currentUser.user_type === 'recruiter') {
                // Check if we're on the old dashboard
                if (window.location.pathname.includes('dashboard.html') && 
                    !window.location.pathname.includes('recruiter-dashboard.html')) {
                    
                    // Show notification about new dashboard
                    const showNewDashboardNotification = function() {
                        const notification = document.createElement('div');
                        notification.className = 'dashboard-upgrade-notification';
                        notification.innerHTML = [
                            '<div class="notification-content">',
                                '<div class="notification-icon">',
                                    '<i class="fas fa-rocket"></i>',
                                '</div>',
                                '<div class="notification-text">',
                                    '<h4><i class="fas fa-star"></i> Dashboard mới đã sẵn sàng!</h4>',
                                    '<p>Trải nghiệm dashboard hiện đại với nhiều tính năng mới</p>',
                                '</div>',
                                '<div class="notification-actions">',
                                    '<button class="btn btn-primary" onclick="redirectToNewDashboard()">',
                                        'Trải nghiệm ngay',
                                    '</button>',
                                    '<button class="btn btn-outline" onclick="stayOnOldDashboard()">',
                                        'Ở lại dashboard cũ',
                                    '</button>',
                                '</div>',
                            '</div>'
                        ].join('');
                        
                        // Add styles
                        notification.style.cssText = [
                            'position: fixed',
                            'top: 20px',
                            'right: 20px',
                            'background: white',
                            'border-radius: 12px',
                            'box-shadow: 0 8px 25px rgba(0,0,0,0.15)',
                            'padding: 1.5rem',
                            'max-width: 400px',
                            'z-index: 10000',
                            'border-left: 4px solid #2c5aa0',
                            'animation: slideInRight 0.5s ease'
                        ].join('; ');
                        
                        document.body.appendChild(notification);
                        
                        // Auto-hide after 10 seconds
                        setTimeout(function() {
                            if (notification.parentNode) {
                                notification.remove();
                            }
                        }, 10000);
                    };
                    
                    // Check if user has seen the notification before
                    const hasSeenNotification = localStorage.getItem('dashboard_upgrade_seen');
                    
                    if (!hasSeenNotification) {
                        setTimeout(showNewDashboardNotification, 2000);
                        localStorage.setItem('dashboard_upgrade_seen', 'true');
                    }
                }
            }
        } catch (error) {
            console.error('Error in dashboard redirect script:', error);
        }
    });

    // Global functions for notification actions
    window.redirectToNewDashboard = function() {
        try {
            localStorage.setItem('dashboard_preference', 'new');
            window.location.href = 'recruiter-dashboard.html';
        } catch (error) {
            console.error('Error redirecting to new dashboard:', error);
            // Fallback - direct navigation
            window.location.href = 'recruiter-dashboard.html';
        }
    };

    window.stayOnOldDashboard = function() {
        try {
            localStorage.setItem('dashboard_preference', 'old');
            const notification = document.querySelector('.dashboard-upgrade-notification');
            if (notification) {
                notification.remove();
            }
        } catch (error) {
            console.error('Error staying on old dashboard:', error);
        }
    };

    // Add CSS for animation
    function addNotificationStyles() {
        try {
            const style = document.createElement('style');
            style.textContent = [
                '@keyframes slideInRight {',
                    'from {',
                        'transform: translateX(100%);',
                        'opacity: 0;',
                    '}',
                    'to {',
                        'transform: translateX(0);',
                        'opacity: 1;',
                    '}',
                '}',
                '',
                '.dashboard-upgrade-notification .notification-content {',
                    'display: flex;',
                    'align-items: flex-start;',
                    'gap: 1rem;',
                '}',
                '',
                '.dashboard-upgrade-notification .notification-icon {',
                    'color: #2c5aa0;',
                    'font-size: 1.5rem;',
                '}',
                '',
                '.dashboard-upgrade-notification .notification-text h4 {',
                    'margin: 0 0 0.5rem 0;',
                    'color: #343a40;',
                    'font-size: 1.1rem;',
                '}',
                '',
                '.dashboard-upgrade-notification .notification-text h4 i {',
                    'color: #ffc107;',
                    'margin-right: 0.5rem;',
                '}',
                '',
                '.dashboard-upgrade-notification .notification-text p {',
                    'margin: 0 0 1rem 0;',
                    'color: #666;',
                    'font-size: 0.9rem;',
                '}',
                '',
                '.dashboard-upgrade-notification .notification-actions {',
                    'display: flex;',
                    'gap: 0.5rem;',
                '}',
                '',
                '.dashboard-upgrade-notification .btn {',
                    'padding: 0.5rem 1rem;',
                    'border-radius: 6px;',
                    'border: none;',
                    'font-size: 0.85rem;',
                    'cursor: pointer;',
                    'transition: all 0.3s ease;',
                '}',
                '',
                '.dashboard-upgrade-notification .btn-primary {',
                    'background: #2c5aa0;',
                    'color: white;',
                '}',
                '',
                '.dashboard-upgrade-notification .btn-primary:hover {',
                    'background: #1e3f73;',
                '}',
                '',
                '.dashboard-upgrade-notification .btn-outline {',
                    'background: transparent;',
                    'color: #666;',
                    'border: 1px solid #ddd;',
                '}',
                '',
                '.dashboard-upgrade-notification .btn-outline:hover {',
                    'background: #f8f9fa;',
                '}'
            ].join('\n');
            
            document.head.appendChild(style);
        } catch (error) {
            console.error('Error adding notification styles:', error);
        }
    }

    // Add styles when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addNotificationStyles);
    } else {
        addNotificationStyles();
    }

})();