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
        case 'camera':
            if (pageTitle) pageTitle.textContent = 'Camera Monitor';
            if (pageSubtitle) pageSubtitle.textContent = 'Real-time AI-powered student engagement monitoring';
            loadCamera();
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
function loadCamera() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <!-- Full-Width Camera Monitor -->
        <div class="card" style="margin-bottom: 24px;">
            <div class="card-header">
                <div>
                    <h3 class="card-title">AI Computer Vision Monitor</h3>
                    <p class="card-subtitle">Real-time student attention and engagement detection</p>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <span class="badge" id="cameraStatusBadge" style="background: #6b7280; display: flex; align-items: center; gap: 4px;">
                        <i data-lucide="video-off" style="width: 12px; height: 12px;"></i>
                        Offline
                    </span>
                    <button class="card-action" id="fullscreenBtn" title="Fullscreen">
                        <i data-lucide="maximize-2"></i>
                    </button>
                </div>
            </div>
            
            <!-- Full-Width Camera Feed Container -->
            <div style="background: #1f2937; border-radius: 12px; position: relative; overflow: hidden; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; margin-top: 16px;" id="cameraFeedContainer">
                <div id="cameraPlaceholder" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 16px; padding: 20px;">
                    <i data-lucide="camera" style="width: 64px; height: 64px; color: #6b7280;"></i>
                    <p style="color: #9ca3af; font-size: 16px; text-align: center;" id="cameraStatusText">Camera feed will be displayed here</p>
                    <button class="btn btn-primary" id="startCameraBtn" style="padding: 12px 24px; font-size: 16px;">
                        <i data-lucide="play"></i>
                        Start Camera
                    </button>
                </div>
                <!-- Detection badge (hidden by default) -->
                <div id="detectionBadge" style="position: absolute; top: 12px; left: 12px; padding: 8px 14px; background: rgba(16, 185, 129, 0.95); color: white; border-radius: 8px; font-size: 13px; font-weight: 600; display: none; align-items: center; gap: 8px; backdrop-filter: blur(8px);">
                    <i data-lucide="user-check" style="width: 14px; height: 14px;"></i>
                    <span id="studentsDetectedBadge">0</span> Students Detected
                </div>
                <!-- Camera controls (hidden by default) -->
                <div id="cameraControls" style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: none; gap: 12px; z-index: 10;">
                    <button id="stopCameraBtn" class="btn btn-danger" style="background: #ef4444; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4); display: flex; align-items: center; gap: 8px; font-size: 14px; padding: 10px 20px;">
                        <i data-lucide="square" style="width: 16px; height: 16px;"></i>
                        Stop Camera
                    </button>
                </div>
                <!-- Exit fullscreen button (hidden by default) -->
                <button id="exitFullscreenBtn" style="position: absolute; top: 12px; right: 12px; background: rgba(0, 0, 0, 0.8); color: white; border: none; border-radius: 8px; padding: 10px 16px; cursor: pointer; display: none; z-index: 10; align-items: center; gap: 8px; font-size: 14px; backdrop-filter: blur(8px);">
                    <i data-lucide="minimize-2" style="width: 16px; height: 16px;"></i>
                    Exit Fullscreen
                </button>
            </div>
        </div>
        
        <!-- Engagement Analysis Grid -->
        <div class="dashboard-grid" style="margin-bottom: 24px;">
            <!-- Current Engagement States -->
            <div class="card card-half">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Current Engagement States</h3>
                        <p class="card-subtitle">Real-time distribution</p>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="emotionChartMini"></canvas>
                </div>
                <div id="emotionLegendMini" style="display: flex; flex-wrap: wrap; gap: 8px; padding: 20px; justify-content: center; font-size: 11px;">
                    <!-- Engagement legend will be populated dynamically -->
                </div>
            </div>
            
            <!-- Engagement Forecast -->
            <div class="card card-half">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Engagement Forecast</h3>
                        <p class="card-subtitle">LSTM prediction for next 10 minutes</p>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="lstmPredictionChart"></canvas>
                </div>
            </div>
        </div>
    `;
    
    lucide.createIcons();
    
    // Initialize charts and camera controls
    initLSTMPredictionChart();
    initCameraButton();
    initFullscreenButton();
    
    // Fetch initial data
    fetchDashboardStats();
    
    // Update stats every 5 seconds
    setInterval(fetchDashboardStats, 5000);
    
    // Update LSTM predictions every 2 seconds when camera is active
    setInterval(() => {
        // Check both local variable and localStorage for camera state
        const isCameraActive = cameraActive || localStorage.getItem('cameraActive') === 'true';
        if (isCameraActive) {
            updateLSTMPrediction();
            // Update student count
            const count = document.getElementById('studentsDetectedCount');
            const badge = document.getElementById('studentsDetectedBadge');
            if (count && dashboardData.studentsDetected !== undefined) {
                count.textContent = dashboardData.studentsDetected;
            }
            if (badge && dashboardData.studentsDetected !== undefined) {
                badge.textContent = dashboardData.studentsDetected;
            }
        }
    }, 2000);
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
        
        <!-- IoT Logging Status Bar -->
        <div id="iotLoggingStatus" style="display: none; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse 2s ease-in-out infinite;"></div>
            <div style="flex: 1;">
                <div style="font-weight: 600; color: #10b981; font-size: 14px;">Database Logging Active</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                    <span id="iotDbFile">Loading...</span> • 
                    <span id="iotRecordCount">0</span> records
                </div>
            </div>
            <button id="exportCurrentIoTBtn" class="btn btn-secondary" style="padding: 8px 16px;">
                <i data-lucide="download"></i>
                Export Current Session
            </button>
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
                <div class="stat-value" id="analyticsAvgEngagement">0<span style="font-size: 20px; color: var(--text-secondary);">%</span></div>
                <div class="stat-change neutral">
                    <i data-lucide="info"></i>
                    <span>Start camera for data</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Total Sessions</span>
                    <div class="stat-icon" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6;">
                        <i data-lucide="calendar"></i>
                    </div>
                </div>
                <div class="stat-value" id="analyticsTotalSessions">0</div>
                <div class="stat-change neutral">
                    <i data-lucide="info"></i>
                    <span>No sessions recorded</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Peak Engagement Time</span>
                    <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">
                        <i data-lucide="clock"></i>
                    </div>
                </div>
                <div class="stat-value" style="font-size: 28px;" id="analyticsPeakTime">N/A</div>
                <div class="stat-change neutral">
                    <i data-lucide="info"></i>
                    <span>Calculating...</span>
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

            <!-- Classroom Presence Trends -->
            <div class="card card-half">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Classroom Presence</h3>
                        <p class="card-subtitle">Students detected over time</p>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="analyticsPresenceChart"></canvas>
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

            <!-- IoT Sensor Data Table -->
            <div class="card card-full">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">IoT Sensor Data Log</h3>
                        <p class="card-subtitle">Real-time environmental monitoring (Auto-updating)</p>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <button id="toggleIoTLoggingBtn" class="btn btn-secondary" data-logging="false">
                            <i data-lucide="database"></i>
                            Start Database Logging
                        </button>
                    </div>
                </div>
                <div style="overflow-x: auto;">
                    <table id="iotTable" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--bg-primary); border-bottom: 2px solid var(--border-color);">
                                <th style="padding: 12px; text-align: left; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Timestamp</th>
                                <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Temperature (°C)</th>
                                <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Humidity (%)</th>
                                <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Light (lux)</th>
                                <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Sound</th>
                                <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Gas</th>
                                <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Env Score</th>
                            </tr>
                        </thead>
                        <tbody id="iotTableBody">
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
async function initAnalytics() {
    try {
        // Fetch real analytics summary
        const summaryResponse = await fetch('/api/analytics/summary');
        const summary = await summaryResponse.json();
        
        // Update stat cards with real data
        updateAnalyticsStats(summary);
        
        // Fetch engagement trends
        const days = parseInt(document.getElementById('analyticsDateRange')?.value || 30);
        const trendsResponse = await fetch(`/api/analytics/engagement-trends?days=${days}`);
        const trendsData = await trendsResponse.json();
        
        // Initialize all charts with real data
        initAnalyticsEngagementChart(trendsData.data);
        initAnalyticsPresenceChart(trendsData.data);
        initAnalyticsEmotionChart(summary.emotionDistribution);
        
        await populateIoTTable();
        
        // Start continuous IoT data refresh every 10 seconds
        if (!window.iotDataInterval) {
            window.iotDataInterval = setInterval(async () => {
                try {
                    await populateIoTTable();
                } catch (error) {
                    console.error('Error updating IoT data:', error);
                }
            }, 10000);
            console.log('✓ Started continuous IoT data refresh (10 second interval)');
        }
        
        const dateRangeSelect = document.getElementById('analyticsDateRange');
        if (dateRangeSelect) {
            dateRangeSelect.addEventListener('change', async (e) => {
                const newDays = parseInt(e.target.value);
                await refreshAnalytics(newDays);
            });
        }
        
        const exportBtn = document.getElementById('exportAnalyticsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => exportAnalyticsCSV(days, true));
        }
        
        // IoT Database Logging Controls
        const toggleIoTBtn = document.getElementById('toggleIoTLoggingBtn');
        const exportCurrentIoTBtn = document.getElementById('exportCurrentIoTBtn');
        
        if (toggleIoTBtn) {
            toggleIoTBtn.addEventListener('click', async () => {
                await toggleIoTLogging();
            });
        }
        
        if (exportCurrentIoTBtn) {
            exportCurrentIoTBtn.addEventListener('click', async () => {
                await exportCurrentIoTSession();
            });
        }
        
        // Check initial logging status
        await updateIoTLoggingStatus();
        
        // Update status every 10 seconds (reduced from 5 to minimize requests)
        if (!window.iotStatusInterval) {
            window.iotStatusInterval = setInterval(async () => {
                await updateIoTLoggingStatus();
            }, 10000);
        }
        
        // Auto-refresh every 5 seconds
        setInterval(async () => {
            const summaryResponse = await fetch('/api/analytics/summary');
            const summary = await summaryResponse.json();
            updateAnalyticsStats(summary);
        }, 15000);
        
    } catch (error) {
        console.error('Error initializing analytics:', error);
        showNotification('Failed to load analytics data', 'error');
    }
}

// Update analytics stats cards
function updateAnalyticsStats(summary) {
    const avgEngagementEl = document.getElementById('analyticsAvgEngagement');
    const totalSessionsEl = document.getElementById('analyticsTotalSessions');
    const peakTimeEl = document.getElementById('analyticsPeakTime');
    
    if (avgEngagementEl) {
        avgEngagementEl.innerHTML = `${summary.avgEngagement || 0}<span style="font-size: 20px; color: var(--text-secondary);">%</span>`;
    }
    if (totalSessionsEl) {
        totalSessionsEl.textContent = summary.totalSessions || 0;
    }
    if (peakTimeEl) {
        peakTimeEl.textContent = summary.peakTime || 'N/A';
    }
}

// Refresh analytics with new date range
async function refreshAnalytics(days) {
    try {
        const trendsResponse = await fetch(`/api/analytics/engagement-trends?days=${days}`);
        const trendsData = await trendsResponse.json();
        
        updateAnalyticsCharts(trendsData.data);
        await populateIoTTable();
    } catch (error) {
        console.error('Error refreshing analytics:', error);
    }
}

async function exportAnalyticsCSV(days, includeIoT = true) {
    try {
        const response = await fetch(`/api/analytics/export?days=${days}&iot=${includeIoT}`);
        const result = await response.json();
        
        if (!result.success || !result.data || result.data.length === 0) {
            showNotification('No data available to export', 'warning');
            return;
        }
        
        const firstRow = result.data[0];
        const hasIoT = 'temperature' in firstRow;
        
        let headers = ['Date', 'Session', 'Students Present', 'Engagement %', 'Attention %', 'Status'];
        if (hasIoT) {
            headers.push('Temperature', 'Humidity', 'Light', 'Sound', 'Gas');
        }
        
        const rows = result.data.map(row => {
            const baseRow = [
                row.date,
                row.session,
                row.students,
                row.engagement,
                row.attention,
                row.status
            ];
            if (hasIoT) {
                baseRow.push(
                    row.temperature,
                    row.humidity,
                    row.light,
                    row.sound,
                    row.gas
                );
            }
            return baseRow;
        });
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
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
        
        showNotification('Analytics data exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting analytics:', error);
        showNotification('Failed to export analytics data', 'error');
    }
}

// Populate Analytics Table
async function populateAnalyticsTable(days) {
    const tbody = document.getElementById('analyticsTableBody');
    if (!tbody) return;
    
    try {
        const response = await fetch(`/api/analytics/export?days=${days}`);
        const result = await response.json();
        
        if (!result.success || !result.data || result.data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="padding: 40px; text-align: center; color: var(--text-secondary);">
                        <i data-lucide="info" style="width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                        <p>No analytics data available yet. Start the camera to collect data.</p>
                    </td>
                </tr>
            `;
            lucide.createIcons();
            return;
        }
        
        tbody.innerHTML = result.data.map(row => {
            const students = row.students;
            const engagement = row.engagement;
            const attention = row.attention;
            
            return `
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 12px; font-size: 14px;">${new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td style="padding: 12px; font-size: 14px;">${row.session}</td>
                    <td style="padding: 12px; text-align: center; font-size: 14px; font-weight: 600;">${students !== 'N/A' ? students + '/32' : 'N/A'}</td>
                    <td style="padding: 12px; text-align: center; font-size: 14px;">
                        ${engagement !== 'N/A' ? `<span class="badge" style="background: ${engagement >= 75 ? '#10b981' : engagement >= 60 ? '#f59e0b' : '#ef4444'};">${engagement}%</span>` : 'N/A'}
                    </td>
                    <td style="padding: 12px; text-align: center; font-size: 14px;">
                        ${attention !== 'N/A' ? `<span class="badge" style="background: ${attention >= 75 ? '#10b981' : attention >= 60 ? '#f59e0b' : '#ef4444'};">${attention}%</span>` : 'N/A'}
                    </td>
                    <td style="padding: 12px; font-size: 14px;">
                        <span style="color: ${row.status === 'Excellent' ? '#10b981' : row.status === 'Good' ? '#f59e0b' : row.status === 'Needs Attention' ? '#ef4444' : 'var(--text-secondary)'}; font-weight: 600;">
                            ${row.status}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
        
        lucide.createIcons();
    } catch (error) {
        console.error('Error populating table:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="padding: 40px; text-align: center; color: #ef4444;">
                    <i data-lucide="alert-circle" style="width: 48px; height: 48px; margin-bottom: 16px;"></i>
                    <p>Error loading analytics data</p>
                </td>
            </tr>
        `;
        lucide.createIcons();
    }
}

// Initialize Analytics Charts
function initAnalyticsEngagementChart(data) {
    const ctx = document.getElementById('analyticsEngagementChart');
    if (!ctx) return;
    
    // Check if we have real data
    const hasData = data.some(d => d.avgEngagement > 0);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [
                {
                    label: 'Engagement',
                    data: data.map(d => d.avgEngagement || 0),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3
                },
                {
                    label: 'Highly Engaged',
                    data: data.map(d => d.highlyEngaged || 0),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3
                },
                {
                    label: 'Disengaged',
                    data: data.map(d => d.disengaged || 0),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
                    enabled: hasData,
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return hasData ? `${context.dataset.label}: ${context.parsed.y}%` : 'No data';
                        }
                    }
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
                            return hasData ? value + '%' : '';
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

function initAnalyticsPresenceChart(data) {
    const ctx = document.getElementById('analyticsPresenceChart');
    if (!ctx) return;
    
    // Extract student counts and filter out zero values for display
    const studentData = data.map(d => ({
        date: d.date,
        students: d.highlyEngaged || 0  // Use highlyEngaged from API or 0
    }));
    
    const hasData = studentData.some(d => d.students > 0);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: studentData.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [{
                label: 'Students Present',
                data: studentData.map(d => d.students),
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
                },
                tooltip: {
                    enabled: hasData,
                    callbacks: {
                        label: function(context) {
                            return hasData ? `Students: ${context.parsed.y}` : 'No data';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 35,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return hasData ? value : '';
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

function initAnalyticsEmotionChart(emotionData = {}) {
    const ctx = document.getElementById('analyticsEmotionChart');
    if (!ctx) return;

    // Use FER-2013 emotion labels
    const labels = ['Happy', 'Surprise', 'Neutral', 'Sad', 'Angry', 'Disgust', 'Fear'];
    const data = [
        emotionData.Happy || 0,
        emotionData.Surprise || 0,
        emotionData.Neutral || 0,
        emotionData.Sad || 0,
        emotionData.Angry || 0,
        emotionData.Disgust || 0,
        emotionData.Fear || 0
    ];
    
    // Check if all values are zero
    const hasData = data.some(val => val > 0);
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: hasData ? data : [1, 1, 1, 1, 1, 1, 1], // Show equal distribution if no data
                backgroundColor: ['#10b981', '#22d3ee', '#a78bfa', '#6b7280', '#ef4444', '#f97316', '#f59e0b'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = hasData ? data.datasets[0].data[i] : 0;
                                    const displayValue = hasData ? `${Math.round(value)}%` : 'N/A';
                                    return {
                                        text: `${label}: ${displayValue}`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    enabled: hasData,
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${Math.round(context.parsed)}%`;
                        }
                    }
                }
            }
        }
    });
}

async function populateIoTTable() {
    const tbody = document.getElementById('iotTableBody');
    if (!tbody) return;
    
    try {
        const response = await fetch('/api/iot/history');  // No limit - get all records
        const result = await response.json();
        
        if (!result.success || !result.data || result.data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 40px; text-align: center; color: var(--text-secondary);">
                        <i data-lucide="wifi-off" style="width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                        <p>No IoT sensor data available. Connect Arduino to start logging.</p>
                    </td>
                </tr>
            `;
            lucide.createIcons();
            return;
        }
        
        tbody.innerHTML = result.data.reverse().map(row => {
            const timestamp = new Date(row.timestamp);
            const timeStr = timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const dateStr = timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            const getScoreColor = (score) => {
                if (score >= 80) return '#10b981';
                if (score >= 60) return '#f59e0b';
                return '#ef4444';
            };
            
            return `
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 10px; font-size: 13px;">${dateStr} ${timeStr}</td>
                    <td style="padding: 10px; text-align: center; font-size: 13px; font-weight: 600;">${row.temperature}°C</td>
                    <td style="padding: 10px; text-align: center; font-size: 13px; font-weight: 600;">${row.humidity}%</td>
                    <td style="padding: 10px; text-align: center; font-size: 13px; font-weight: 600;">${row.light}</td>
                    <td style="padding: 10px; text-align: center; font-size: 13px;">${row.sound}</td>
                    <td style="padding: 10px; text-align: center; font-size: 13px;">${row.gas}</td>
                </tr>
            `;
        }).join('');
        
        lucide.createIcons();
    } catch (error) {
        console.error('Error fetching IoT data:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="padding: 40px; text-align: center; color: var(--text-secondary);">
                    <i data-lucide="alert-circle" style="width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p>Failed to load IoT sensor data</p>
                </td>
            </tr>
        `;
        lucide.createIcons();
    }
}

async function exportIoTDataCSV() {
    try {
        const response = await fetch('/api/iot/history');  // No limit - get all records
        const result = await response.json();
        
        if (!result.success || !result.data || result.data.length === 0) {
            showNotification('No IoT data available to export', 'warning');
            return;
        }
        
        const headers = ['Timestamp', 'Temperature (°C)', 'Humidity (%)', 'Light (lux)', 'Sound', 'Gas', 'Environmental Score'];
        
        const rows = result.data.map(row => [
            row.timestamp,
            row.temperature,
            row.humidity,
            row.light,
            row.sound,
            row.gas,
            row.environmental_score
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const dateStr = new Date().toISOString().split('T')[0];
        link.setAttribute('href', url);
        link.setAttribute('download', `iot_sensor_data_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('IoT data exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting IoT data:', error);
        showNotification('Failed to export IoT data', 'error');
    }
}

function updateAnalyticsCharts(data) {
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
                        <p>Yes! Navigate to Analytics and click the "Export Report" button. You can export data in PDF, Excel, or CSV formats. Reports include student presence, engagement metrics, and detailed analytics for any date range you select.</p>
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
        
        @keyframes pulse {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: 0.5;
            }
        }
    `;
    document.head.appendChild(notificationStyle);
}

// IoT Database Logging Functions
async function toggleIoTLogging() {
    const btn = document.getElementById('toggleIoTLoggingBtn');
    const isLogging = btn.getAttribute('data-logging') === 'true';
    
    try {
        btn.disabled = true;
        
        if (isLogging) {
            // Stop logging
            const response = await fetch('/api/iot/stop-logging', { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
                btn.setAttribute('data-logging', 'false');
                btn.className = 'btn btn-secondary';
                btn.innerHTML = '<i data-lucide="database"></i> Start Database Logging';
                
                document.getElementById('iotLoggingStatus').style.display = 'none';
                
                showNotification(`Stopped logging: ${result.record_count} records saved`, 'success');
            } else {
                showNotification(result.message || 'Failed to stop logging', 'error');
            }
        } else {
            // Start logging
            const response = await fetch('/api/iot/start-logging', { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
                btn.setAttribute('data-logging', 'true');
                btn.className = 'btn btn-danger';
                btn.innerHTML = '<i data-lucide="square"></i> Stop Database Logging';
                
                document.getElementById('iotLoggingStatus').style.display = 'flex';
                document.getElementById('iotDbFile').textContent = result.db_file.split('/').pop();
                document.getElementById('iotRecordCount').textContent = '0';
                
                showNotification('Database logging started', 'success');
            } else {
                showNotification(result.message || 'Failed to start logging', 'error');
            }
        }
        
        lucide.createIcons();
    } catch (error) {
        console.error('Error toggling IoT logging:', error);
        showNotification('Failed to toggle logging', 'error');
    } finally {
        btn.disabled = false;
    }
}

async function updateIoTLoggingStatus() {
    try {
        const response = await fetch('/api/iot/logging-status');
        const status = await response.json();
        
        const btn = document.getElementById('toggleIoTLoggingBtn');
        const statusBar = document.getElementById('iotLoggingStatus');
        
        if (!btn || !statusBar) return;
        
        if (status.enabled) {
            btn.setAttribute('data-logging', 'true');
            btn.className = 'btn btn-danger';
            btn.innerHTML = '<i data-lucide="square"></i> Stop Database Logging';
            
            statusBar.style.display = 'flex';
            document.getElementById('iotDbFile').textContent = status.db_file.split('/').pop();
            document.getElementById('iotRecordCount').textContent = status.record_count;
        } else {
            btn.setAttribute('data-logging', 'false');
            btn.className = 'btn btn-secondary';
            btn.innerHTML = '<i data-lucide="database"></i> Start Database Logging';
            
            statusBar.style.display = 'none';
        }
        
        lucide.createIcons();
    } catch (error) {
        console.error('Error updating IoT status:', error);
    }
}

async function exportCurrentIoTSession() {
    try {
        const response = await fetch('/api/iot/export-csv', { 
            method: 'POST'
        });
        
        if (!response.ok) {
            const error = await response.json();
            showNotification(error.message || 'Failed to export', 'error');
            return;
        }
        
        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Get filename from response headers or use default
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition 
            ? contentDisposition.split('filename=')[1].replace(/"/g, '')
            : `iot_export_${new Date().toISOString().split('T')[0]}.csv`;
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification('CSV exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting IoT data:', error);
        showNotification('Failed to export CSV', 'error');
    }
}