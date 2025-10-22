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
        <!-- Analytics Controls -->
        <div style="display: flex; gap: 16px; margin-bottom: 24px; align-items: center; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
                <label style="display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: var(--text-secondary);">Date Range</label>
                <select id="analyticsDateRange" class="form-select" style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary); font-size: 14px;">
                    <option value="7">Last 7 Days</option>
                    <option value="14">Last 14 Days</option>
                    <option value="30" selected>Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                </select>
            </div>
            <div style="flex: 1; min-width: 200px;">
                <label style="display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: var(--text-secondary);">Export Data</label>
                <button id="exportAnalyticsBtn" class="btn btn-primary" style="width: 100%; justify-content: center;">
                    <i data-lucide="download"></i>
                    Export as CSV
                </button>
            </div>
        </div>

        <!-- Analytics Stats Grid -->
        <div class="stats-grid" style="margin-bottom: 24px;">
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Average Engagement</span>
                    <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
                        <i data-lucide="activity"></i>
                    </div>
                </div>
                <div class="stat-value" id="analyticsAvgEngagement">76.3<span style="font-size: 20px; color: var(--text-secondary);">%</span></div>
                <div class="stat-change positive">
                    <i data-lucide="trending-up"></i>
                    <span>+8.2% from previous period</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Average Attendance</span>
                    <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6;">
                        <i data-lucide="users"></i>
                    </div>
                </div>
                <div class="stat-value" id="analyticsAvgAttendance">86.5<span style="font-size: 20px; color: var(--text-secondary);">%</span></div>
                <div class="stat-change positive">
                    <i data-lucide="trending-up"></i>
                    <span>+2.3% from previous period</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Total Sessions</span>
                    <div class="stat-icon" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6;">
                        <i data-lucide="calendar"></i>
                    </div>
                </div>
                <div class="stat-value" id="analyticsTotalSessions">24</div>
                <div class="stat-change neutral">
                    <i data-lucide="minus"></i>
                    <span>Same as previous period</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Peak Engagement Time</span>
                    <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">
                        <i data-lucide="clock"></i>
                    </div>
                </div>
                <div class="stat-value" style="font-size: 28px;" id="analyticsPeakTime">10:00 AM</div>
                <div class="stat-change positive">
                    <i data-lucide="star"></i>
                    <span>Most productive hour</span>
                </div>
            </div>
        </div>

        <!-- Analytics Charts Grid -->
        <div class="dashboard-grid">
            <!-- Engagement Trend Chart -->
            <div class="card card-full">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Engagement Trends</h3>
                        <p class="card-subtitle">Daily engagement levels over selected period</p>
                    </div>
                </div>
                <div class="chart-container" style="height: 300px;">
                    <canvas id="analyticsEngagementChart"></canvas>
                </div>
            </div>

            <!-- Attendance Trend Chart -->
            <div class="card card-half">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Attendance Trends</h3>
                        <p class="card-subtitle">Daily attendance over time</p>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="analyticsAttendanceChart"></canvas>
                </div>
            </div>

            <!-- Emotion Distribution Chart -->
            <div class="card card-half">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Emotion Distribution</h3>
                        <p class="card-subtitle">Average emotion breakdown</p>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="analyticsEmotionChart"></canvas>
                </div>
            </div>

            <!-- Hourly Engagement Pattern -->
            <div class="card card-half">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Hourly Engagement Pattern</h3>
                        <p class="card-subtitle">Average engagement by hour of day</p>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="analyticsHourlyChart"></canvas>
                </div>
            </div>

            <!-- Weekly Performance -->
            <div class="card card-half">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Weekly Performance</h3>
                        <p class="card-subtitle">Engagement by day of week</p>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="analyticsWeeklyChart"></canvas>
                </div>
            </div>

            <!-- Detailed Data Table -->
            <div class="card card-full">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Detailed Analytics Data</h3>
                        <p class="card-subtitle">Session-by-session breakdown</p>
                    </div>
                    <button id="exportTableBtn" class="btn btn-secondary">
                        <i data-lucide="file-text"></i>
                        Export Table
                    </button>
                </div>
                <div style="overflow-x: auto;">
                    <table id="analyticsTable" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--bg-primary); border-bottom: 2px solid var(--border-color);">
                                <th style="padding: 12px; text-align: left; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Date</th>
                                <th style="padding: 12px; text-align: left; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Session</th>
                                <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Students</th>
                                <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Attendance</th>
                                <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Engagement</th>
                                <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Attention</th>
                                <th style="padding: 12px; text-align: left; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Status</th>
                            </tr>
                        </thead>
                        <tbody id="analyticsTableBody">
                            <!-- Data will be populated by JavaScript -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    lucide.createIcons();
    
    // Initialize analytics
    initAnalytics();
}

// Initialize Analytics
function initAnalytics() {
    // Generate analytics data
    const analyticsData = generateAnalyticsData(30);
    
    // Initialize all charts
    initAnalyticsEngagementChart(analyticsData);
    initAnalyticsAttendanceChart(analyticsData);
    initAnalyticsEmotionChart();
    initAnalyticsHourlyChart();
    initAnalyticsWeeklyChart();
    
    // Populate table
    populateAnalyticsTable(analyticsData);
    
    // Add event listeners
    const dateRangeSelect = document.getElementById('analyticsDateRange');
    if (dateRangeSelect) {
        dateRangeSelect.addEventListener('change', (e) => {
            const days = parseInt(e.target.value);
            const newData = generateAnalyticsData(days);
            updateAnalyticsCharts(newData);
            populateAnalyticsTable(newData);
        });
    }
    
    const exportBtn = document.getElementById('exportAnalyticsBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => exportAnalyticsCSV(analyticsData));
    }
    
    const exportTableBtn = document.getElementById('exportTableBtn');
    if (exportTableBtn) {
        exportTableBtn.addEventListener('click', () => exportAnalyticsCSV(analyticsData));
    }
}

// Generate Analytics Data
function generateAnalyticsData(days) {
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Skip weekends for more realistic data
        if (date.getDay() === 0 || date.getDay() === 6) {
            continue;
        }
        
        const sessionTime = date.getHours() >= 12 ? 'PM' : 'AM';
        const baseEngagement = 70 + Math.random() * 20;
        const baseAttendance = 25 + Math.floor(Math.random() * 7);
        
        data.push({
            date: date.toISOString().split('T')[0],
            dateObj: date,
            session: `${date.getHours() >= 12 ? date.getHours() - 12 : date.getHours()}:00 ${sessionTime} - CS101`,
            students: baseAttendance,
            attendance: Math.round((baseAttendance / 32) * 100),
            engagement: Math.round(baseEngagement),
            attention: Math.round(baseEngagement + (Math.random() * 10 - 5)),
            status: baseEngagement > 75 ? 'Excellent' : baseEngagement > 60 ? 'Good' : 'Needs Attention'
        });
    }
    
    return data;
}

// Export Analytics as CSV
function exportAnalyticsCSV(data) {
    // Create CSV header
    const headers = ['Date', 'Session', 'Students Present', 'Attendance %', 'Engagement %', 'Attention %', 'Status'];
    
    // Create CSV rows
    const rows = data.map(row => [
        row.date,
        row.session,
        row.students,
        row.attendance,
        row.engagement,
        row.attention,
        row.status
    ]);
    
    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `smart_classroom_analytics_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success notification
    showNotification('Analytics data exported successfully!', 'success');
}

// Populate Analytics Table
function populateAnalyticsTable(data) {
    const tbody = document.getElementById('analyticsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = data.map(row => `
        <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 12px; font-size: 14px;">${new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            <td style="padding: 12px; font-size: 14px;">${row.session}</td>
            <td style="padding: 12px; text-align: center; font-size: 14px; font-weight: 600;">${row.students}/32</td>
            <td style="padding: 12px; text-align: center; font-size: 14px;">
                <span class="badge" style="background: ${row.attendance >= 80 ? '#10b981' : row.attendance >= 60 ? '#f59e0b' : '#ef4444'};">
                    ${row.attendance}%
                </span>
            </td>
            <td style="padding: 12px; text-align: center; font-size: 14px;">
                <span class="badge" style="background: ${row.engagement >= 75 ? '#10b981' : row.engagement >= 60 ? '#f59e0b' : '#ef4444'};">
                    ${row.engagement}%
                </span>
            </td>
            <td style="padding: 12px; text-align: center; font-size: 14px;">
                <span class="badge" style="background: ${row.attention >= 75 ? '#10b981' : row.attention >= 60 ? '#f59e0b' : '#ef4444'};">
                    ${row.attention}%
                </span>
            </td>
            <td style="padding: 12px; font-size: 14px;">
                <span style="color: ${row.status === 'Excellent' ? '#10b981' : row.status === 'Good' ? '#f59e0b' : '#ef4444'}; font-weight: 600;">
                    ${row.status}
                </span>
            </td>
        </tr>
    `).join('');
}

// Initialize Analytics Charts
function initAnalyticsEngagementChart(data) {
    const ctx = document.getElementById('analyticsEngagementChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [
                {
                    label: 'Engagement',
                    data: data.map(d => d.engagement),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3
                },
                {
                    label: 'Attention',
                    data: data.map(d => d.attention),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function initAnalyticsAttendanceChart(data) {
    const ctx = document.getElementById('analyticsAttendanceChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [{
                label: 'Students Present',
                data: data.map(d => d.students),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 35,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function initAnalyticsEmotionChart() {
    const ctx = document.getElementById('analyticsEmotionChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Happy', 'Neutral', 'Focused', 'Confused', 'Bored'],
            datasets: [{
                data: [35, 30, 20, 10, 5],
                backgroundColor: ['#10b981', '#6b7280', '#3b82f6', '#f59e0b', '#ef4444'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function initAnalyticsHourlyChart() {
    const ctx = document.getElementById('analyticsHourlyChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM'],
            datasets: [{
                label: 'Avg Engagement',
                data: [65, 72, 85, 82, 70, 75, 78, 73, 68],
                backgroundColor: '#8b5cf6',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function initAnalyticsWeeklyChart() {
    const ctx = document.getElementById('analyticsWeeklyChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            datasets: [{
                label: 'Engagement',
                data: [78, 82, 75, 85, 80],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

function updateAnalyticsCharts(data) {
    // This function would update charts when date range changes
    // For now, just reload the page
    loadAnalytics();
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

// Global notification function (used across all pages)
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
    `;
    
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info';
    notification.innerHTML = `
        <i data-lucide="${icon}" style="width: 20px; height: 20px;"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    lucide.createIcons();
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification animation styles if not already present
if (!document.getElementById('notification-animations-style')) {
    const notificationStyle = document.createElement('style');
    notificationStyle.id = 'notification-animations-style';
    notificationStyle.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(notificationStyle);
}