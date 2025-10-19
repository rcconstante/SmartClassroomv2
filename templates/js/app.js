// Main App JavaScript
// Initialize Lucide icons
lucide.createIcons();

// App state
const state = {
    currentPage: 'dashboard',
    user: null,
    isAuthenticated: true, // Set to true for demo
    isDarkMode: localStorage.getItem('darkMode') === 'true'
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initNavigation();
    initEventListeners();
    
    // Load dashboard by default
    loadDashboard();
});

// Dark Mode Functions
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    // Set initial dark mode state
    if (state.isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateDarkModeIcon(true);
    }
    
    // Dark mode toggle handler
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            state.isDarkMode = !state.isDarkMode;
            localStorage.setItem('darkMode', state.isDarkMode);
            
            if (state.isDarkMode) {
                document.documentElement.setAttribute('data-theme', 'dark');
                updateDarkModeIcon(true);
            } else {
                document.documentElement.removeAttribute('data-theme');
                updateDarkModeIcon(false);
            }
        });
    }
}

function updateDarkModeIcon(isDark) {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (!darkModeToggle) return;
    
    const icon = darkModeToggle.querySelector('i');
    if (icon) {
        icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
        lucide.createIcons();
    }
}

// Navigation
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
            
            // Get page name
            const page = item.getAttribute('data-page');
            state.currentPage = page;
            
            // Route to appropriate page
            routeTo(page);
        });
    });
}

// Routing function
function routeTo(page) {
    const mainContent = document.getElementById('mainContent');
    const pageTitle = document.querySelector('.page-title');
    const pageSubtitle = document.querySelector('.page-subtitle');
    
    switch(page) {
        case 'dashboard':
            if (pageTitle) pageTitle.textContent = 'Hi, Dr. Johnson!';
            if (pageSubtitle) pageSubtitle.textContent = 'Welcome back to your smart classroom';
            loadDashboard();
            break;
        case 'attendance':
            if (pageTitle) pageTitle.textContent = 'Attendance';
            if (pageSubtitle) pageSubtitle.textContent = 'Track and manage student attendance';
            loadAttendance();
            break;
        case 'students':
            if (pageTitle) pageTitle.textContent = 'My Students';
            if (pageSubtitle) pageSubtitle.textContent = 'View and manage student information';
            loadStudents();
            break;
        case 'analytics':
            if (pageTitle) pageTitle.textContent = 'Analytics';
            if (pageSubtitle) pageSubtitle.textContent = 'Detailed classroom insights and reports';
            loadAnalytics();
            break;
        case 'settings':
            if (pageTitle) pageTitle.textContent = 'Settings';
            if (pageSubtitle) pageSubtitle.textContent = 'Configure your classroom preferences';
            // Call async function
            if (typeof loadSettings === 'function') {
                loadSettings().catch(error => {
                    console.error('Error loading settings:', error);
                    mainContent.innerHTML = `
                        <div class="card">
                            <div class="card-header">
                                <div>
                                    <h3 class="card-title">Settings</h3>
                                    <p class="card-subtitle" style="color: #ef4444;">Error loading settings</p>
                                </div>
                            </div>
                            <div style="padding: 40px; text-align: center; color: var(--text-secondary);">
                                <i data-lucide="alert-circle" style="width: 64px; height: 64px; margin-bottom: 16px; color: #ef4444;"></i>
                                <p>Unable to load settings. Please refresh the page.</p>
                            </div>
                        </div>
                    `;
                    lucide.createIcons();
                });
            } else {
                console.error('loadSettings function not found');
                mainContent.innerHTML = `
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">Settings</h3>
                                <p class="card-subtitle" style="color: #ef4444;">Function not found</p>
                            </div>
                        </div>
                        <div style="padding: 40px; text-align: center; color: var(--text-secondary);">
                            <i data-lucide="alert-circle" style="width: 64px; height: 64px; margin-bottom: 16px; color: #ef4444;"></i>
                            <p>Settings module failed to load. Please check console.</p>
                        </div>
                    </div>
                `;
                lucide.createIcons();
            }
            break;
        case 'help':
            if (pageTitle) pageTitle.textContent = 'Help & Support';
            if (pageSubtitle) pageSubtitle.textContent = 'Get help and learn how to use the system';
            loadHelp();
            break;
        default:
            loadDashboard();
    }
}

// Event Listeners
function initEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
}

// Logout Handler
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                // Redirect to login page
                window.location.href = '/';
            }
        })
        .catch(error => {
            console.error('Logout error:', error);
        });
    }
}

// Placeholder functions for other pages
function loadAttendance() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div>
                    <h3 class="card-title">Attendance Management</h3>
                    <p class="card-subtitle">Coming soon...</p>
                </div>
            </div>
            <div style="padding: 40px; text-align: center; color: var(--text-secondary);">
                <i data-lucide="user-check" style="width: 64px; height: 64px; margin-bottom: 16px;"></i>
                <p>Attendance tracking feature will be available soon.</p>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function loadStudents() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div>
                    <h3 class="card-title">Student Management</h3>
                    <p class="card-subtitle">Coming soon...</p>
                </div>
            </div>
            <div style="padding: 40px; text-align: center; color: var(--text-secondary);">
                <i data-lucide="users" style="width: 64px; height: 64px; margin-bottom: 16px;"></i>
                <p>Student management feature will be available soon.</p>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function loadAnalytics() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div>
                    <h3 class="card-title">Advanced Analytics</h3>
                    <p class="card-subtitle">Coming soon...</p>
                </div>
            </div>
            <div style="padding: 40px; text-align: center; color: var(--text-secondary);">
                <i data-lucide="bar-chart-3" style="width: 64px; height: 64px; margin-bottom: 16px;"></i>
                <p>Advanced analytics feature will be available soon.</p>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function loadHelp() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="help-container">
            <!-- Help Hero Section -->
            <div class="help-hero">
                <i data-lucide="help-circle"></i>
                <h1>How can we help you?</h1>
                <p>Find answers, tutorials, and support documentation</p>
                <div class="help-search">
                    <i data-lucide="search"></i>
                    <input type="text" placeholder="Search for help..." id="helpSearchInput">
                </div>
            </div>

            <!-- Help Categories -->
            <div class="help-categories">
                <div class="help-category-card" onclick="showCategory('getting-started')">
                    <i data-lucide="play-circle"></i>
                    <h3>Getting Started</h3>
                    <p>Learn the basics of using the Smart Classroom system</p>
                </div>
                <div class="help-category-card" onclick="showCategory('features')">
                    <i data-lucide="star"></i>
                    <h3>Features</h3>
                    <p>Explore all the features and capabilities</p>
                </div>
                <div class="help-category-card" onclick="showCategory('troubleshooting')">
                    <i data-lucide="wrench"></i>
                    <h3>Troubleshooting</h3>
                    <p>Fix common issues and problems</p>
                </div>
            </div>

            <!-- FAQ Section -->
            <div class="help-faq">
                <h2>Frequently Asked Questions</h2>
                
                <div class="faq-item">
                    <div class="faq-question" onclick="toggleFaq(this)">
                        <h3>How does the AI-powered monitoring work?</h3>
                        <i data-lucide="chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Our AI-powered monitoring system uses computer vision technology to analyze student engagement and attention levels in real-time. The system tracks facial expressions, head movements, and body language to provide insights without invading privacy. All data is processed locally and anonymized.</p>
                    </div>
                </div>

                <div class="faq-item">
                    <div class="faq-question" onclick="toggleFaq(this)">
                        <h3>How do I mark attendance automatically?</h3>
                        <i data-lucide="chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>The system can automatically detect and mark student attendance using facial recognition. Go to Settings > Monitoring and enable "Auto Attendance Detection". Make sure the camera has a clear view of all students and their faces are properly enrolled in the system.</p>
                    </div>
                </div>

                <div class="faq-item">
                    <div class="faq-question" onclick="toggleFaq(this)">
                        <h3>What do the engagement metrics mean?</h3>
                        <i data-lucide="chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p><strong>Attention:</strong> Measures how focused students are on the lesson (eye contact, head direction).<br>
                        <strong>Engagement:</strong> Measures active participation (facial expressions, body language, interaction).<br>
                        <strong>Emotion Detection:</strong> Identifies emotional states (confused, interested, bored) to help adjust teaching methods.</p>
                    </div>
                </div>

                <div class="faq-item">
                    <div class="faq-question" onclick="toggleFaq(this)">
                        <h3>Can I export reports?</h3>
                        <i data-lucide="chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Yes! Navigate to Analytics and click the "Export Report" button. You can export data in PDF, Excel, or CSV formats. Reports include attendance records, engagement metrics, and detailed analytics for any date range you select.</p>
                    </div>
                </div>

                <div class="faq-item">
                    <div class="faq-question" onclick="toggleFaq(this)">
                        <h3>How do I adjust camera settings?</h3>
                        <i data-lucide="chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Go to Settings > Camera Settings to adjust brightness, contrast, resolution, and field of view. You can also calibrate the camera position and test the view before starting monitoring. Make sure to save your changes after adjusting.</p>
                    </div>
                </div>

                <div class="faq-item">
                    <div class="faq-question" onclick="toggleFaq(this)">
                        <h3>Is student data secure and private?</h3>
                        <i data-lucide="chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Yes, we take privacy very seriously. All video processing is done locally on your device - no video data is sent to external servers. Student metrics are anonymized and encrypted. Only authorized teachers and administrators can access the data, and it complies with FERPA and other educational privacy regulations.</p>
                    </div>
                </div>

                <div class="faq-item">
                    <div class="faq-question" onclick="toggleFaq(this)">
                        <h3>What should I do if the camera stops working?</h3>
                        <i data-lucide="chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>First, check if the camera is properly connected. Try these steps:<br>
                        1. Refresh the page<br>
                        2. Check camera permissions in your browser settings<br>
                        3. Ensure no other application is using the camera<br>
                        4. Restart the browser<br>
                        5. Contact IT support if the issue persists</p>
                    </div>
                </div>
            </div>

            <!-- Contact Support Section -->
            <div class="help-contact">
                <h2>Still need help?</h2>
                <p>Our support team is here to assist you</p>
                <div style="display: flex; gap: 16px; justify-content: center; margin-top: 24px;">
                    <button class="btn btn-primary" onclick="contactSupport('email')">
                        <i data-lucide="mail"></i>
                        Email Support
                    </button>
                    <button class="btn btn-secondary" onclick="contactSupport('chat')">
                        <i data-lucide="message-circle"></i>
                        Live Chat
                    </button>
                </div>
                <div style="margin-top: 20px; color: var(--text-secondary); font-size: 14px;">
                    <p><i data-lucide="phone"></i> Phone: +63 (2) 8123-4567</p>
                    <p><i data-lucide="mail"></i> Email: support@dlsud.edu.ph</p>
                    <p><i data-lucide="clock"></i> Support Hours: Mon-Fri, 8:00 AM - 5:00 PM</p>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
    
    // Add search functionality
    const searchInput = document.getElementById('helpSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchHelpContent(e.target.value);
        });
    }
}

// FAQ toggle function
function toggleFaq(questionElement) {
    const faqItem = questionElement.closest('.faq-item');
    const isOpen = faqItem.classList.contains('active');
    
    // Close all other FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Toggle current item
    if (!isOpen) {
        faqItem.classList.add('active');
    }
    
    lucide.createIcons();
}

// Show category function
function showCategory(category) {
    alert(`${category} guide - Coming soon!\n\nThis will show detailed documentation for: ${category.replace('-', ' ')}`);
}

// Contact support function
function contactSupport(method) {
    if (method === 'email') {
        window.location.href = 'mailto:support@dlsud.edu.ph?subject=Smart Classroom Support Request';
    } else if (method === 'chat') {
        alert('Live chat feature coming soon!\n\nFor immediate assistance, please email support@dlsud.edu.ph');
    }
}

// Search help content
function searchHelpContent(query) {
    if (!query || query.length < 2) {
        // Show all FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.style.display = 'block';
        });
        return;
    }
    
    const lowerQuery = query.toLowerCase();
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question h3').textContent.toLowerCase();
        const answer = item.querySelector('.faq-answer p').textContent.toLowerCase();
        
        if (question.includes(lowerQuery) || answer.includes(lowerQuery)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}