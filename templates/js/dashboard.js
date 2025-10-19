// Dashboard module for Smart Classroom

// Global state for dashboard data
let dashboardData = {
    totalStudents: 32,
    presentToday: 28,
    studentsDetected: 28,
    avgEngagement: 78,
    attentionLevel: 82,
    lookingAtBoard: 23,
    takingNotes: 18,
    distracted: 5,
    tired: 2
};

// Fetch and update dashboard stats
async function fetchDashboardStats() {
    try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        
        if (data) {
            dashboardData = {
                ...dashboardData,
                ...data
            };
            updateDashboardUI();
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
}

// Update dashboard UI with current data
function updateDashboardUI() {
    // Update stat cards
    const totalStudentsEl = document.getElementById('totalStudents');
    const presentTodayEl = document.getElementById('presentToday');
    const avgEngagementEl = document.getElementById('avgEngagement');
    const studentsDetectedEl = document.getElementById('studentsDetectedBadge');
    const attentionLevelEl = document.getElementById('attentionLevel');
    const engagementLevelEl = document.getElementById('engagementLevel');
    const lookingAtBoardEl = document.getElementById('lookingAtBoard');
    const takingNotesEl = document.getElementById('takingNotes');
    const distractedEl = document.getElementById('distracted');
    const tiredEl = document.getElementById('tired');
    
    if (totalStudentsEl) totalStudentsEl.textContent = dashboardData.totalStudents;
    if (presentTodayEl) presentTodayEl.textContent = dashboardData.presentToday;
    if (avgEngagementEl) avgEngagementEl.innerHTML = `${dashboardData.avgEngagement}<span style="font-size: 20px; color: var(--text-secondary);">%</span>`;
    
    // Only update students detected if camera is active
    if (studentsDetectedEl && cameraActive) {
        studentsDetectedEl.textContent = dashboardData.studentsDetected;
    }
    
    if (attentionLevelEl) {
        attentionLevelEl.textContent = `${dashboardData.attentionLevel}%`;
        // Update progress bar
        const attentionProgress = document.getElementById('attentionProgress');
        if (attentionProgress) attentionProgress.style.width = `${dashboardData.attentionLevel}%`;
    }
    if (engagementLevelEl) {
        engagementLevelEl.textContent = `${dashboardData.avgEngagement}%`;
        // Update progress bar
        const engagementProgress = document.getElementById('engagementProgress');
        if (engagementProgress) engagementProgress.style.width = `${dashboardData.avgEngagement}%`;
    }
    if (lookingAtBoardEl) lookingAtBoardEl.textContent = dashboardData.lookingAtBoard;
    if (takingNotesEl) takingNotesEl.textContent = dashboardData.takingNotes;
    if (distractedEl) distractedEl.textContent = dashboardData.distracted;
    if (tiredEl) tiredEl.textContent = dashboardData.tired;
    
    // Update attendance percentage
    const attendancePercent = Math.round((dashboardData.presentToday / dashboardData.totalStudents) * 100);
    const attendanceChangeEl = document.querySelector('#presentToday')?.closest('.stat-card')?.querySelector('.stat-change span');
    if (attendanceChangeEl) {
        attendanceChangeEl.textContent = `${attendancePercent}% attendance`;
    }
}

function loadDashboard() {
    const mainContent = document.getElementById('mainContent');
    
    mainContent.innerHTML = `
        <!-- Stats Grid -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Total Students</span>
                    <div class="stat-icon">
                        <i data-lucide="users"></i>
                    </div>
                </div>
                <div class="stat-value" id="totalStudents">32</div>
                <div class="stat-change positive">
                    <i data-lucide="trending-up"></i>
                    <span>+2 this semester</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Present</span>
                    <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6;">
                        <i data-lucide="user-check"></i>
                    </div>
                </div>
                <div class="stat-value" id="presentToday">28</div>
                <div class="stat-change positive">
                    <i data-lucide="check"></i>
                    <span>87.5% attendance</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Avg Engagement</span>
                    <div class="stat-icon" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6;">
                        <i data-lucide="activity"></i>
                    </div>
                </div>
                <div class="stat-value" id="avgEngagement">78<span style="font-size: 20px; color: var(--text-secondary);">%</span></div>
                <div class="stat-change positive">
                    <i data-lucide="trending-up"></i>
                    <span>+5% from last week</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Environment</span>
                    <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">
                        <i data-lucide="thermometer"></i>
                    </div>
                </div>
                <div class="stat-value" style="font-size: 24px;">Optimal</div>
                <div class="stat-change positive">
                    <i data-lucide="check-circle"></i>
                    <span>All systems normal</span>
                </div>
            </div>
        </div>

        <!-- Main Dashboard Grid -->
        <div class="dashboard-grid">
            <!-- Student Engagement Chart -->
            <div class="card card-half">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Student Engagement & Attention</h3>
                        <p class="card-subtitle">Real-time tracking via computer vision</p>
                    </div>
                    <button class="card-action">
                        <i data-lucide="more-horizontal"></i>
                    </button>
                </div>
                <div class="chart-container">
                    <canvas id="engagementChart"></canvas>
                </div>
            </div>

            <!-- Attendance Overview -->
            <div class="card card-half">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Attendance Overview</h3>
                        <p class="card-subtitle">Last 7 days</p>
                    </div>
                    <button class="card-action">
                        <i data-lucide="calendar"></i>
                    </button>
                </div>
                <div class="chart-container">
                    <canvas id="attendanceChart"></canvas>
                </div>
            </div>

            <!-- Computer Vision Monitor -->
            <div class="card card-full">
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
                <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; margin-top: 16px;">
                    <!-- Camera Feed Container -->
                    <div style="background: #1f2937; border-radius: 12px; position: relative; overflow: hidden; min-height: 380px; display: flex; align-items: center; justify-content: center;" id="cameraFeedContainer">
                        <div id="cameraPlaceholder" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 16px;">
                            <i data-lucide="camera" style="width: 48px; height: 48px; color: #6b7280;"></i>
                            <p style="color: #9ca3af; font-size: 14px;" id="cameraStatusText">Camera feed will be displayed here</p>
                            <button class="btn btn-primary" id="startCameraBtn">
                                <i data-lucide="play"></i>
                                Start Camera
                            </button>
                        </div>
                        <!-- Detection badge (hidden by default) -->
                        <div id="detectionBadge" style="position: absolute; top: 12px; left: 12px; padding: 6px 10px; background: rgba(16, 185, 129, 0.9); color: white; border-radius: 6px; font-size: 11px; font-weight: 600; display: none; align-items: center; gap: 6px;">
                            <i data-lucide="user-check" style="width: 12px; height: 12px;"></i>
                            <span id="studentsDetectedBadge">0</span> Students
                        </div>
                        <!-- Camera controls (hidden by default) -->
                        <div id="cameraControls" style="position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); display: none; gap: 8px; z-index: 10;">
                            <button id="stopCameraBtn" class="btn btn-danger" style="background: #ef4444; display: flex; align-items: center; gap: 6px;">
                                <i data-lucide="square" style="width: 14px; height: 14px;"></i>
                                Stop Camera
                            </button>
                        </div>
                        <!-- Exit fullscreen button (hidden by default) -->
                        <button id="exitFullscreenBtn" style="position: absolute; top: 12px; right: 12px; background: rgba(0, 0, 0, 0.8); color: white; border: none; border-radius: 6px; padding: 8px 12px; cursor: pointer; display: none; z-index: 10; align-items: center; gap: 6px; font-size: 13px;">
                            <i data-lucide="minimize-2" style="width: 14px; height: 14px;"></i>
                            Exit Fullscreen
                        </button>
                    </div>
                    
                    <!-- Real-time Metrics with Emotion Pie Chart -->
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div style="background: var(--bg-primary); border-radius: 12px; padding: 14px;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                <div style="width: 36px; height: 36px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                    <i data-lucide="eye" style="width: 18px; height: 18px; color: #10b981;"></i>
                                </div>
                                <div>
                                    <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 2px;">Attention Level</p>
                                    <p style="font-size: 24px; font-weight: 700; color: var(--text-primary);" id="attentionLevel">82%</p>
                                </div>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" id="attentionProgress" style="width: 82%;"></div>
                            </div>
                        </div>
                        
                        <div style="background: var(--bg-primary); border-radius: 12px; padding: 14px;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                <div style="width: 36px; height: 36px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                    <i data-lucide="brain" style="width: 18px; height: 18px; color: #3b82f6;"></i>
                                </div>
                                <div>
                                    <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 2px;">Engagement</p>
                                    <p style="font-size: 24px; font-weight: 700; color: var(--text-primary);" id="engagementLevel">78%</p>
                                </div>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" id="engagementProgress" style="width: 78%; background: linear-gradient(90deg, #3b82f6, #60a5fa);"></div>
                            </div>
                        </div>
                        
                        <!-- Emotion Detection Pie Chart -->
                        <div style="background: var(--bg-primary); border-radius: 12px; padding: 14px;">
                            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; font-weight: 600;">Emotion Detection</p>
                            <div style="max-width: 180px; margin: 0 auto;">
                                <canvas id="emotionChartMini" style="max-height: 180px;"></canvas>
                            </div>
                            <div id="emotionLegendMini" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; justify-content: center; font-size: 10px;">
                                <!-- Emotion legend will be populated dynamically -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="card card-third">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Recent Activity</h3>
                        <p class="card-subtitle">Latest classroom updates</p>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div class="list-item">
                        <div class="list-avatar" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
                            <i data-lucide="user-plus"></i>
                        </div>
                        <div class="list-content">
                            <div class="list-title">New Student</div>
                            <div class="list-subtitle">Maria Santos joined</div>
                        </div>
                        <span class="list-action" style="font-size: 12px; color: var(--text-light);">2h ago</span>
                    </div>
                    <div class="list-item">
                        <div class="list-avatar" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6;">
                            <i data-lucide="check-circle"></i>
                        </div>
                        <div class="list-content">
                            <div class="list-title">Attendance Complete</div>
                            <div class="list-subtitle">28/32 students present</div>
                        </div>
                        <span class="list-action" style="font-size: 12px; color: var(--text-light);">3h ago</span>
                    </div>
                    <div class="list-item">
                        <div class="list-avatar" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">
                            <i data-lucide="alert-circle"></i>
                        </div>
                        <div class="list-content">
                            <div class="list-title">Low Engagement Alert</div>
                            <div class="list-subtitle">Student #12 needs attention</div>
                        </div>
                        <span class="list-action" style="font-size: 12px; color: var(--text-light);">5h ago</span>
                    </div>
                </div>
            </div>

            <!-- Emotion Detection Chart -->
            <div class="card card-third">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Emotion Detection</h3>
                        <p class="card-subtitle">Real-time facial analysis</p>
                    </div>
                </div>
                <div style="padding: 20px;">
                    <canvas id="emotionChart" style="max-height: 250px;"></canvas>
                </div>
                <div id="emotionLegend" style="display: flex; flex-wrap: wrap; gap: 12px; padding: 0 16px 16px;">
                    <!-- Emotion legend will be populated dynamically -->
                </div>
            </div>

            <!-- Environmental Monitoring -->
            <div class="card card-third">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Environment Monitor</h3>
                        <p class="card-subtitle">Real-time conditions</p>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="thermometer" style="width: 18px; height: 18px; color: #ef4444;"></i>
                                <span style="font-size: 14px; font-weight: 500;">Temperature</span>
                            </div>
                            <span style="font-size: 18px; font-weight: 600;">24°C</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 75%; background: linear-gradient(90deg, #ef4444, #f87171);"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="droplets" style="width: 18px; height: 18px; color: #3b82f6;"></i>
                                <span style="font-size: 14px; font-weight: 500;">Humidity</span>
                            </div>
                            <span style="font-size: 18px; font-weight: 600;">55%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 55%; background: linear-gradient(90deg, #3b82f6, #60a5fa);"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="sun" style="width: 18px; height: 18px; color: #f59e0b;"></i>
                                <span style="font-size: 14px; font-weight: 500;">Light Level</span>
                            </div>
                            <span style="font-size: 18px; font-weight: 600;">Good</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 85%; background: linear-gradient(90deg, #f59e0b, #fbbf24);"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Class Schedule -->
            <div class="card card-full">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Schedule</h3>
                        <p class="card-subtitle">October 13, 2025</p>
                    </div>
                    <button class="btn btn-primary">
                        <i data-lucide="plus"></i>
                        Add Class
                    </button>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; margin-top: 16px;">
                    <div style="background: var(--bg-primary); border-radius: var(--border-radius-sm); padding: 16px; border-left: 4px solid #10b981;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <div>
                                <h4 style="font-weight: 600; margin-bottom: 4px;">Computer Science 101</h4>
                                <p style="font-size: 13px; color: var(--text-secondary);">Introduction to Programming</p>
                            </div>
                            <span class="badge badge-success">Active</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 16px; margin-top: 12px; font-size: 13px; color: var(--text-secondary);">
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
                                <span>8:00 AM - 10:00 AM</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <i data-lucide="users" style="width: 14px; height: 14px;"></i>
                                <span>28/32 students</span>
                            </div>
                        </div>
                    </div>
                    <div style="background: var(--bg-primary); border-radius: var(--border-radius-sm); padding: 16px; border-left: 4px solid #3b82f6;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <div>
                                <h4 style="font-weight: 600; margin-bottom: 4px;">Data Structures</h4>
                                <p style="font-size: 13px; color: var(--text-secondary);">Advanced Topics</p>
                            </div>
                            <span class="badge badge-info">Upcoming</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 16px; margin-top: 12px; font-size: 13px; color: var(--text-secondary);">
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
                                <span>1:00 PM - 3:00 PM</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <i data-lucide="users" style="width: 14px; height: 14px;"></i>
                                <span>0/30 students</span>
                            </div>
                        </div>
                    </div>
                    <div style="background: var(--bg-primary); border-radius: var(--border-radius-sm); padding: 16px; border-left: 4px solid #8b5cf6;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <div>
                                <h4 style="font-weight: 600; margin-bottom: 4px;">Web Development</h4>
                                <p style="font-size: 13px; color: var(--text-secondary);">Full Stack Development</p>
                            </div>
                            <span class="badge badge-info">Upcoming</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 16px; margin-top: 12px; font-size: 13px; color: var(--text-secondary);">
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
                                <span>3:30 PM - 5:30 PM</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <i data-lucide="users" style="width: 14px; height: 14px;"></i>
                                <span>0/28 students</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Reinitialize Lucide icons for dynamically added content
    lucide.createIcons();

    // Initialize charts
    initEngagementChart();
    initAttendanceChart();
    initEmotionChart();

    // Initialize camera button
    initCameraButton();
    
    // Initialize fullscreen button
    initFullscreenButton();

    // Fetch initial dashboard data
    fetchDashboardStats();
    
    // Update stats every 3 seconds for real-time sync
    setInterval(fetchDashboardStats, 3000);
    
    // Update emotion data every 2 seconds when camera is active
    setInterval(() => {
        if (cameraActive) {
            fetchEmotionData();
        }
    }, 2000);
}

// Initialize Engagement Chart
function initEngagementChart() {
    const ctx = document.getElementById('engagementChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
                {
                    label: 'Engagement Level',
                    data: [75, 78, 72, 80, 78, 82, 85],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3
                },
                {
                    label: 'Attention Level',
                    data: [80, 82, 78, 85, 82, 88, 90],
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
                        padding: 15,
                        font: {
                            size: 13,
                            weight: 500
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    borderRadius: 8,
                    titleFont: {
                        size: 14,
                        weight: 600
                    },
                    bodyFont: {
                        size: 13
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
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
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Initialize Attendance Chart
function initAttendanceChart() {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
                {
                    label: 'Present',
                    data: [28, 30, 27, 29, 28, 25, 26],
                    backgroundColor: '#10b981',
                    borderRadius: 8
                },
                {
                    label: 'Absent',
                    data: [4, 2, 5, 3, 4, 7, 6],
                    backgroundColor: '#ef4444',
                    borderRadius: 8
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

// Initialize Emotion Detection Chart
let emotionChart = null;

function initEmotionChart() {
    const ctx = document.getElementById('emotionChart');
    if (!ctx) return;

    // Define emotion colors
    const emotionColors = {
        'Happy': '#10b981',
        'Neutral': '#6b7280',
        'Sad': '#3b82f6',
        'Angry': '#ef4444',
        'Surprise': '#f59e0b',
        'Fear': '#8b5cf6',
        'Disgust': '#ec4899'
    };

    emotionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Happy', 'Neutral', 'Sad', 'Angry', 'Surprise', 'Fear', 'Disgust'],
            datasets: [{
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: [
                    emotionColors.Happy,
                    emotionColors.Neutral,
                    emotionColors.Sad,
                    emotionColors.Angry,
                    emotionColors.Surprise,
                    emotionColors.Fear,
                    emotionColors.Disgust
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return `${label}: ${value.toFixed(1)}%`;
                        }
                    }
                }
            }
        }
    });

    // Create custom legend
    updateEmotionLegend(emotionColors);
}

function updateEmotionLegend(emotionColors) {
    const legendContainer = document.getElementById('emotionLegend');
    if (!legendContainer) return;

    const emotions = ['Happy', 'Neutral', 'Sad', 'Angry', 'Surprise', 'Fear', 'Disgust'];
    legendContainer.innerHTML = emotions.map(emotion => `
        <div style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background: ${emotionColors[emotion]};"></div>
            <span style="font-size: 12px; color: var(--text-secondary);">${emotion}</span>
        </div>
    `).join('');
}

// Fetch and update emotion data
async function fetchEmotionData() {
    if (!cameraActive) return;

    try {
        const response = await fetch('/api/emotions');
        const result = await response.json();

        if (result.success && emotionChart) {
            const emotionPercentages = result.data.emotion_percentages;
            
            // Update chart data
            emotionChart.data.datasets[0].data = [
                emotionPercentages.Happy || 0,
                emotionPercentages.Neutral || 0,
                emotionPercentages.Sad || 0,
                emotionPercentages.Angry || 0,
                emotionPercentages.Surprise || 0,
                emotionPercentages.Fear || 0,
                emotionPercentages.Disgust || 0
            ];
            
            emotionChart.update('none'); // Update without animation for real-time feel
        }
    } catch (error) {
        console.error('Error fetching emotion data:', error);
    }
}

// Fetch Dashboard Data from Backend (deprecated - use fetchDashboardStats)
function fetchDashboardData() {
    fetchDashboardStats();
}

// =========================
// Camera Management
// =========================

let cameraActive = false;
let cameraUpdateInterval = null;

// Initialize camera button
function initCameraButton() {
    const startCameraBtn = document.getElementById('startCameraBtn');
    const stopCameraBtn = document.getElementById('stopCameraBtn');
    
    if (!startCameraBtn) return;
    
    startCameraBtn.addEventListener('click', startCamera);
    
    if (stopCameraBtn) {
        stopCameraBtn.addEventListener('click', stopCamera);
    }
}

// Start camera
async function startCamera() {
    const startCameraBtn = document.getElementById('startCameraBtn');
    const cameraPlaceholder = document.getElementById('cameraPlaceholder');
    const detectionBadge = document.getElementById('detectionBadge');
    const cameraControls = document.getElementById('cameraControls');
    
    try {
        // Show loading state
        startCameraBtn.disabled = true;
        startCameraBtn.innerHTML = '<i data-lucide="loader"></i> Starting...';
        lucide.createIcons();
        
        // First, detect available cameras
        const detectResponse = await fetch('/api/camera/detect');
        const detectData = await detectResponse.json();
        
        if (!detectData.success || detectData.cameras.length === 0) {
            throw new Error('No cameras detected. Please connect a camera and try again.');
        }
        
        // Get the saved camera from settings or use first available
        const settings = JSON.parse(localStorage.getItem('settings')) || {};
        const cameraId = settings.camera || detectData.cameras[0].id;
        
        // Start the camera stream
        const startResponse = await fetch('/api/camera/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ camera_id: cameraId })
        });
        
        const startData = await startResponse.json();
        
        if (!startData.success) {
            throw new Error(startData.error || 'Failed to start camera');
        }
        
        // Camera started successfully
        cameraActive = true;
        
        // Hide placeholder
        if (cameraPlaceholder) {
            cameraPlaceholder.style.display = 'none';
        }
        
        // Create and display video stream
        const cameraFeedContainer = document.getElementById('cameraFeedContainer');
        if (cameraFeedContainer) {
            // Check if video element already exists
            let videoElement = document.getElementById('cameraVideoStream');
            if (!videoElement) {
                videoElement = document.createElement('img');
                videoElement.id = 'cameraVideoStream';
                videoElement.style.width = '100%';
                videoElement.style.height = '100%';
                videoElement.style.objectFit = 'contain';
                videoElement.style.borderRadius = '12px';
                cameraFeedContainer.appendChild(videoElement);
            }
            // Set video stream source
            videoElement.src = `/api/camera/stream?t=${Date.now()}`;
        }
        
        // Show detection badge and camera controls
        if (detectionBadge) {
            detectionBadge.style.display = 'flex';
        }
        
        if (cameraControls) {
            cameraControls.style.display = 'flex';
        }
        
        // Update status badge
        const statusBadge = document.getElementById('cameraStatusBadge');
        if (statusBadge) {
            statusBadge.style.background = '#10b981';
            statusBadge.innerHTML = '<i data-lucide="video" style="width: 12px; height: 12px;"></i> Live';
        }
        
        lucide.createIcons();
        
        // Show success notification
        showNotification('Camera started successfully', 'success');
        
        // Start updating detection stats more frequently
        if (cameraUpdateInterval) clearInterval(cameraUpdateInterval);
        cameraUpdateInterval = setInterval(fetchDashboardStats, 1000); // Every 1 second when camera is active
        
    } catch (error) {
        // Show error state
        const cameraStatusText = document.getElementById('cameraStatusText');
        if (cameraStatusText) {
            cameraStatusText.textContent = error.message;
            cameraStatusText.style.color = '#ef4444';
        }
        
        startCameraBtn.disabled = false;
        startCameraBtn.innerHTML = '<i data-lucide="play"></i> Start Camera';
        startCameraBtn.style.background = '';
        lucide.createIcons();
        
        showNotification(error.message, 'error');
        console.error('Camera error:', error);
    }
}

// Stop camera
async function stopCamera() {
    const stopCameraBtn = document.getElementById('stopCameraBtn');
    const cameraPlaceholder = document.getElementById('cameraPlaceholder');
    const detectionBadge = document.getElementById('detectionBadge');
    const cameraControls = document.getElementById('cameraControls');
    
    try {
        // Show loading state
        if (stopCameraBtn) {
            stopCameraBtn.disabled = true;
            stopCameraBtn.innerHTML = '<i data-lucide="loader"></i> Stopping...';
            lucide.createIcons();
        }
        
        // Stop the camera stream
        const response = await fetch('/api/camera/stop', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to stop camera');
        }
        
        // Camera stopped successfully
        cameraActive = false;
        
        // Remove video stream and show placeholder
        const videoElement = document.getElementById('cameraVideoStream');
        if (videoElement) {
            videoElement.remove();
        }
        
        if (cameraPlaceholder) {
            cameraPlaceholder.style.display = 'flex';
        }
        
        // Hide detection badge and controls
        if (detectionBadge) {
            detectionBadge.style.display = 'none';
        }
        
        if (cameraControls) {
            cameraControls.style.display = 'none';
        }
        
        // Update status badge
        const statusBadge = document.getElementById('cameraStatusBadge');
        if (statusBadge) {
            statusBadge.style.background = '#6b7280';
            statusBadge.innerHTML = '<i data-lucide="video-off" style="width: 12px; height: 12px;"></i> Offline';
        }
        
        // Reset stop button
        if (stopCameraBtn) {
            stopCameraBtn.disabled = false;
            stopCameraBtn.innerHTML = '<i data-lucide="square"></i> Stop Camera';
        }
        
        lucide.createIcons();
        
        showNotification('Camera stopped', 'info');
        
        // Revert to normal update interval
        if (cameraUpdateInterval) {
            clearInterval(cameraUpdateInterval);
            cameraUpdateInterval = null;
        }
        
    } catch (error) {
        if (stopCameraBtn) {
            stopCameraBtn.disabled = false;
            stopCameraBtn.innerHTML = '<i data-lucide="square"></i> Stop Camera';
        }
        lucide.createIcons();
        
        showNotification(error.message, 'error');
        console.error('Stop camera error:', error);
    }
}

// =========================
// Fullscreen Functionality
// =========================

function initFullscreenButton() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const exitFullscreenBtn = document.getElementById('exitFullscreenBtn');
    const cameraFeedContainer = document.getElementById('cameraFeedContainer');
    
    if (!fullscreenBtn || !cameraFeedContainer) return;
    
    // Enter fullscreen
    fullscreenBtn.addEventListener('click', () => {
        enterFullscreen(cameraFeedContainer);
    });
    
    // Exit fullscreen button
    if (exitFullscreenBtn) {
        exitFullscreenBtn.addEventListener('click', () => {
            exitFullscreen();
        });
    }
    
    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
}

function enterFullscreen(element) {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

function handleFullscreenChange() {
    const exitFullscreenBtn = document.getElementById('exitFullscreenBtn');
    const cameraFeedContainer = document.getElementById('cameraFeedContainer');
    
    const isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    );
    
    if (exitFullscreenBtn) {
        exitFullscreenBtn.style.display = isFullscreen ? 'flex' : 'none';
    }
    
    // Adjust video stream size in fullscreen
    if (cameraFeedContainer) {
        if (isFullscreen) {
            cameraFeedContainer.style.maxHeight = 'none';
            cameraFeedContainer.style.height = '100vh';
            cameraFeedContainer.style.aspectRatio = 'auto';
            
            // Make video fit fullscreen
            const videoElement = document.getElementById('cameraVideoStream');
            if (videoElement) {
                videoElement.style.objectFit = 'contain';
            }
        } else {
            cameraFeedContainer.style.maxHeight = '400px';
            cameraFeedContainer.style.height = '';
            cameraFeedContainer.style.aspectRatio = '4/3';
            
            // Reset video fit
            const videoElement = document.getElementById('cameraVideoStream');
            if (videoElement) {
                videoElement.style.objectFit = 'cover';
            }
        }
    }
    
    // Reinitialize icons after fullscreen change
    lucide.createIcons();
}

// Show notification
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

// Add CSS animations
if (!document.getElementById('dashboard-animations-style')) {
    const dashboardAnimationStyle = document.createElement('style');
    dashboardAnimationStyle.id = 'dashboard-animations-style';
    dashboardAnimationStyle.textContent = `
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
    document.head.appendChild(dashboardAnimationStyle);
}

