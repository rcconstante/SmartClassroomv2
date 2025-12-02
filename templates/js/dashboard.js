// Dashboard module for Smart Classroom

// Global state for dashboard data
let dashboardData = {
    totalStudents: 0,
    studentsDetected: 0,
    avgEngagement: 0,
    attentionLevel: 0,
    lookingAtBoard: 0,
    takingNotes: 0,
    distracted: 0,
    tired: 0
};

// Global emotion stats for engagement chart
let current_emotion_stats = {
    emotion_percentages: {
        Happy: 0,
        Surprise: 0,
        Neutral: 0,
        Sad: 0,
        Angry: 0,
        Disgust: 0,
        Fear: 0
    }
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
    // Note: IoT and prediction data are fetched by their own intervals
    // Do NOT call them here to avoid duplicate requests
}

// Fetch environment prediction from ML model
async function fetchEnvironmentPrediction() {
    try {
        const response = await fetch('/api/prediction/forecast');
        const result = await response.json();
        
        if (result.success && result.comfort) {
            updateEnvironmentStatCard(result.comfort);
        } else {
            // Show waiting state if not enough data
            const comfortLevelEl = document.getElementById('envComfortLevel');
            const comfortStatusEl = document.getElementById('envComfortStatus');
            
            if (comfortLevelEl) {
                comfortLevelEl.textContent = '--';
            }
            if (comfortStatusEl) {
                comfortStatusEl.className = 'stat-change neutral';
                comfortStatusEl.innerHTML = '<i data-lucide="info"></i><span>Waiting for data...</span>';
                lucide.createIcons();
            }
        }
    } catch (error) {
        console.error('Error fetching environment prediction:', error);
    }
}

// Update Environment stat card with ML prediction
function updateEnvironmentStatCard(comfortData) {
    const comfortLevelEl = document.getElementById('envComfortLevel');
    const comfortStatusEl = document.getElementById('envComfortStatus');
    
    if (!comfortLevelEl || !comfortStatusEl) return;
    
    // Update comfort level text
    comfortLevelEl.textContent = comfortData.level;
    
    // Update status with confidence and styling
    let statusClass = 'stat-change neutral';
    let iconName = 'info';
    
    if (comfortData.level === 'Optimal') {
        statusClass = 'stat-change positive';
        iconName = 'check-circle';
    } else if (comfortData.level === 'Critical' || comfortData.level === 'Poor') {
        statusClass = 'stat-change negative';
        iconName = 'alert-triangle';
    }
    
    comfortStatusEl.className = statusClass;
    comfortStatusEl.innerHTML = `<i data-lucide="${iconName}"></i><span>${Math.round(comfortData.confidence)}% confidence</span>`;
    
    // Reinitialize icons
    lucide.createIcons();
}

// Fetch and update IoT environment sensor data
async function fetchIoTEnvironmentData() {
    try {
        const response = await fetch('/api/iot/latest');
        const result = await response.json();
        
        if (result.success && result.data) {
            updateEnvironmentMonitor(result.data);
        }
    } catch (error) {
        console.error('Error fetching IoT environment data:', error);
    }
}

// Update Environment Monitor with IoT sensor data
function updateEnvironmentMonitor(iotData) {
    // Temperature (0-50°C range, target 20-26°C optimal)
    const tempEl = document.getElementById('envTemp');
    const tempBarEl = document.getElementById('envTempBar');
    if (tempEl && iotData.temperature !== undefined) {
        const temp = parseFloat(iotData.temperature);
        tempEl.textContent = temp.toFixed(1) + '°C';
        if (tempBarEl) {
            const tempPercent = Math.min(100, (temp / 50) * 100);
            tempBarEl.style.width = tempPercent + '%';
        }
    }
    
    // Humidity (0-100% range)
    const humidityEl = document.getElementById('envHumidity');
    const humidityBarEl = document.getElementById('envHumidityBar');
    if (humidityEl && iotData.humidity !== undefined) {
        const humidity = parseFloat(iotData.humidity);
        humidityEl.textContent = humidity.toFixed(1) + '%';
        if (humidityBarEl) {
            humidityBarEl.style.width = humidity + '%';
        }
    }
    
    // Light Level (0-1000+ lux range, display as is)
    const lightEl = document.getElementById('envLight');
    const lightBarEl = document.getElementById('envLightBar');
    if (lightEl && iotData.light_level !== undefined) {
        const light = parseFloat(iotData.light_level);
        lightEl.textContent = light.toFixed(0) + ' lux';
        if (lightBarEl) {
            // Scale 0-1000 to 0-100%
            const lightPercent = Math.min(100, (light / 1000) * 100);
            lightBarEl.style.width = lightPercent + '%';
        }
    }
    
    // Air Quality - Display converted PPM value
    const airEl = document.getElementById('envAirQuality');
    const airBarEl = document.getElementById('envAirQualityBar');
    if (airEl) {
        // Use converted PPM value if available, otherwise show raw
        if (iotData.air_quality_ppm !== undefined && iotData.air_quality_ppm > 0) {
            const ppm = parseFloat(iotData.air_quality_ppm);
            airEl.textContent = ppm.toFixed(0) + ' ppm';
            if (airBarEl) {
                // Scale: 400ppm (good) to 2000ppm (poor) -> 100% to 0%
                // Lower PPM = better air quality = higher bar
                const airPercent = Math.max(0, Math.min(100, 100 - ((ppm - 400) / 1600) * 100));
                airBarEl.style.width = airPercent + '%';
            }
        } else if (iotData.air_quality !== undefined) {
            // Fallback to raw value if conversion not available
            const airQuality = parseFloat(iotData.air_quality);
            airEl.textContent = airQuality.toFixed(0);
            if (airBarEl) {
                const airPercent = Math.max(0, 100 - (airQuality / 4095) * 100);
                airBarEl.style.width = airPercent + '%';
            }
        }
    }
    
    // Noise Level - Display converted dBA value
    const noiseEl = document.getElementById('envNoise');
    const noiseBarEl = document.getElementById('envNoiseBar');
    if (noiseEl) {
        // Use converted dBA value if available, otherwise show raw
        if (iotData.sound_dba !== undefined && iotData.sound_dba > 0) {
            const dba = parseFloat(iotData.sound_dba);
            noiseEl.textContent = dba.toFixed(1) + ' dBA';
            if (noiseBarEl) {
                // Scale: 30dBA (quiet) to 90dBA (loud) -> 0% to 100%
                const noisePercent = Math.min(100, Math.max(0, ((dba - 30) / 60) * 100));
                noiseBarEl.style.width = noisePercent + '%';
            }
        } else if (iotData.sound !== undefined) {
            // Fallback to raw value if conversion not available
            const noise = parseFloat(iotData.sound);
            noiseEl.textContent = noise.toFixed(0);
            if (noiseBarEl) {
                const noisePercent = Math.min(100, (noise / 4095) * 100);
                noiseBarEl.style.width = noisePercent + '%';
            }
        }
    }
}

// Update dashboard UI with current data
function updateDashboardUI() {
    // Update stat cards
    const totalStudentsEl = document.getElementById('totalStudents');
    const avgEngagementEl = document.getElementById('avgEngagement');
    const studentsDetectedEl = document.getElementById('studentsDetectedBadge');
    const attentionLevelEl = document.getElementById('attentionLevel');
    const engagementLevelEl = document.getElementById('engagementLevel');
    const lookingAtBoardEl = document.getElementById('lookingAtBoard');
    const takingNotesEl = document.getElementById('takingNotes');
    const distractedEl = document.getElementById('distracted');
    const tiredEl = document.getElementById('tired');
    
    if (totalStudentsEl) totalStudentsEl.textContent = dashboardData.studentsDetected || 0;
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
                <div class="stat-value" id="totalStudents">0</div>
                <div class="stat-change positive">
                    <i data-lucide="info"></i>
                    <span>Start camera to detect</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Avg Engagement</span>
                    <div class="stat-icon" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6;">
                        <i data-lucide="activity"></i>
                    </div>
                </div>
                <div class="stat-value" id="avgEngagement">0<span style="font-size: 20px; color: var(--text-secondary);">%</span></div>
                <div class="stat-change neutral">
                    <i data-lucide="info"></i>
                    <span>No data available</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Environment</span>
                    <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">
                        <i data-lucide="thermometer"></i>
                    </div>
                </div>
                <div class="stat-value" style="font-size: 24px;" id="envComfortLevel">--</div>
                <div class="stat-change neutral" id="envComfortStatus">
                    <i data-lucide="info"></i>
                    <span>Loading...</span>
                </div>
            </div>
        </div>

        <!-- Main Dashboard Grid -->
        <div class="dashboard-grid">
            <!-- Student Engagement Chart -->
            <div class="card card-half">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Student Engagement Levels</h3>
                        <p class="card-subtitle">High vs Low engagement based on emotion detection</p>
                    </div>
                    <button class="card-action">
                        <i data-lucide="more-horizontal"></i>
                    </button>
                </div>
                <div class="chart-container">
                    <canvas id="engagementChart"></canvas>
                </div>
            </div>

            <!-- Environmental Forecasting -->
            <div class="card card-half">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Environmental Forecasting</h3>
                        <p class="card-subtitle">Gradient Boosting predictions for classroom conditions</p>
                    </div>
                    <button class="card-action">
                        <i data-lucide="trending-up"></i>
                    </button>
                </div>
                <div class="chart-container">
                    <canvas id="forecastingChart"></canvas>
                </div>
            </div>

            <!-- Engagement States Chart -->
            <div class="card card-third">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Engagement States</h3>
                        <p class="card-subtitle">Real-time emotion detection from CV</p>
                    </div>
                </div>
                <div style="padding: 20px;">
                    <canvas id="emotionChart" style="max-height: 220px;"></canvas>
                </div>
                <div id="emotionLegend" style="display: flex; flex-wrap: wrap; gap: 10px; padding: 0 16px 16px;">
                    <!-- Engagement legend will be populated dynamically -->
                </div>
            </div>

            <!-- Environmental Monitoring -->
            <div class="card card-third">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Environment Monitor</h3>
                        <p class="card-subtitle">Real-time IoT sensor data</p>
                    </div>
                </div>
                <div id="environmentMonitor" style="display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="thermometer" style="width: 18px; height: 18px; color: #ef4444;"></i>
                                <span style="font-size: 14px; font-weight: 500;">Temperature</span>
                            </div>
                            <span id="envTemp" style="font-size: 18px; font-weight: 600;">--°C</span>
                        </div>
                        <div class="progress-bar">
                            <div id="envTempBar" class="progress-fill" style="width: 0%; background: linear-gradient(90deg, #ef4444, #f87171);"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="droplets" style="width: 18px; height: 18px; color: #3b82f6;"></i>
                                <span style="font-size: 14px; font-weight: 500;">Humidity</span>
                            </div>
                            <span id="envHumidity" style="font-size: 18px; font-weight: 600;">--%</span>
                        </div>
                        <div class="progress-bar">
                            <div id="envHumidityBar" class="progress-fill" style="width: 0%; background: linear-gradient(90deg, #3b82f6, #60a5fa);"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="sun" style="width: 18px; height: 18px; color: #f59e0b;"></i>
                                <span style="font-size: 14px; font-weight: 500;">Light Level</span>
                            </div>
                            <span id="envLight" style="font-size: 18px; font-weight: 600;">--</span>
                        </div>
                        <div class="progress-bar">
                            <div id="envLightBar" class="progress-fill" style="width: 0%; background: linear-gradient(90deg, #f59e0b, #fbbf24);"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="wind" style="width: 18px; height: 18px; color: #10b981;"></i>
                                <span style="font-size: 14px; font-weight: 500;">Air Quality</span>
                            </div>
                            <span id="envAirQuality" style="font-size: 18px; font-weight: 600;">--</span>
                        </div>
                        <div class="progress-bar">
                            <div id="envAirQualityBar" class="progress-fill" style="width: 0%; background: linear-gradient(90deg, #10b981, #34d399);"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="volume-2" style="width: 18px; height: 18px; color: #8b5cf6;"></i>
                                <span style="font-size: 14px; font-weight: 500;">Noise Level</span>
                            </div>
                            <span id="envNoise" style="font-size: 18px; font-weight: 600;">--</span>
                        </div>
                        <div class="progress-bar">
                            <div id="envNoiseBar" class="progress-fill" style="width: 0%; background: linear-gradient(90deg, #8b5cf6, #a78bfa);"></div>
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
    initForecastingChart();
    initEmotionChart();

    // Initialize camera button
    initCameraButton();
    
    // Initialize fullscreen button
    initFullscreenButton();

    // Clear any existing dashboard intervals first to prevent duplicates
    if (window.dashboardIntervals && window.dashboardIntervals.length > 0) {
        window.dashboardIntervals.forEach(id => clearInterval(id));
        console.log('✓ Cleared existing dashboard intervals');
    }
    window.dashboardIntervals = [];

    // Fetch initial dashboard data (one-time calls)
    fetchDashboardStats();
    fetchIoTEnvironmentData();
    fetchEnvironmentPrediction(); // Initial prediction fetch
    
    // Update stats every 10 seconds (reduced from 5s to prevent overload)
    const statsIntervalId = setInterval(fetchDashboardStats, 10000);
    window.dashboardIntervals.push(statsIntervalId);
    
    // Update IoT environment data every 15 seconds
    const iotIntervalId = setInterval(fetchIoTEnvironmentData, 15000);
    window.dashboardIntervals.push(iotIntervalId);
    
    // Update environment prediction every 30 seconds (heavy computation)
    const predictionIntervalId = setInterval(fetchEnvironmentPrediction, 30000);
    window.dashboardIntervals.push(predictionIntervalId);
    
    // Update emotion data every 3 seconds when camera is active
    const emotionIntervalId = setInterval(() => {
        // Check both local variable and localStorage for camera state
        const isCameraActive = cameraActive || localStorage.getItem('cameraActive') === 'true';
        if (isCameraActive) {
            fetchDashboardEmotionData();
        }
    }, 3000);
    window.dashboardIntervals.push(emotionIntervalId);
    
    // Check for alerts every 1 minute without duplicating
    startAlertChecker();
    
    console.log('✓ Dashboard initialized with', window.dashboardIntervals.length, 'intervals');
}

// =========================
// Alert Notification System
// =========================

let lastAlertIds = new Set();  // Track last displayed alert IDs
let alertCheckInterval = null;

function startAlertChecker() {
    // Clear any existing interval
    if (alertCheckInterval) {
        clearInterval(alertCheckInterval);
    }
    
    // Check immediately on start
    checkAndShowAlerts();
    
    // Check every 60 seconds (1 minute)
    alertCheckInterval = setInterval(() => {
        checkAndShowAlerts();
    }, 60000);  // 60000ms = 1 minute
    
    // Track this interval globally
    window.alertCheckInterval = alertCheckInterval;
    if (window.dashboardIntervals) {
        window.dashboardIntervals.push(alertCheckInterval);
    }
    
    console.log('[Alerts] Started alert checker (1 minute interval)');
}

async function checkAndShowAlerts() {
    try {
        const response = await fetch('/api/alerts/check');
        const result = await response.json();
        
        if (result.success && result.alerts && result.alerts.length > 0) {
            // Get current alert IDs
            const currentAlertIds = new Set(result.alerts.map(alert => alert.id));
            
            // Only show new alerts that weren't in the last check
            const newAlerts = result.alerts.filter(alert => !lastAlertIds.has(alert.id));
            
            // Display new alerts
            newAlerts.forEach(alert => {
                // Map alert type to notification type
                const notificationType = alert.type === 'error' ? 'error' : 
                                       alert.type === 'warning' ? 'warning' : 'info';
                
                // Show notification (5 second duration for alerts)
                showNotification(alert.title, alert.message, notificationType, 5000);
            });
            
            // Update last alert IDs - only keep alerts that still exist
            lastAlertIds = currentAlertIds;
            
            if (newAlerts.length > 0) {
                console.log(`[Alerts] Displayed ${newAlerts.length} new alert(s)`);
            }
        } else {
            // No alerts - clear the tracking set
            lastAlertIds.clear();
        }
    } catch (error) {
        console.error('[Alerts] Error checking alerts:', error);
    }
}

// Fetch emotion data for dashboard
async function fetchDashboardEmotionData() {
    try {
        const response = await fetch('/api/emotions');
        const result = await response.json();
        
        if (result.success && result.data && result.data.emotion_percentages) {
            current_emotion_stats = result.data;
        }
    } catch (error) {
        console.error('Error fetching emotion data:', error);
    }
}

// Initialize Engagement Chart
let engagementLevelChart = null;

function initEngagementChart() {
    const ctx = document.getElementById('engagementChart');
    if (!ctx) return;

    engagementLevelChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
                {
                    label: 'High Engaged',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3
                },
                {
                    label: 'Low Engaged',
                    data: [0, 0, 0, 0, 0, 0, 0],
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
                    },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + '%';
                        }
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
    
    // Start updating with real-time emotion data
    const engagementUpdateId = setInterval(updateEngagementLevelChart, 2000);
    if (window.dashboardIntervals) {
        window.dashboardIntervals.push(engagementUpdateId);
    }
}

// Update engagement level chart with emotion-based data
function updateEngagementLevelChart() {
    if (!engagementLevelChart || !current_emotion_stats) return;
    
    const emotions = current_emotion_stats.emotion_percentages || {};
    
    // Calculate High Engaged (Happy + Surprise + Neutral)
    const highEngaged = (emotions.Happy || 0) + (emotions.Surprise || 0) + (emotions.Neutral || 0);
    
    // Calculate Low Engaged (Fear + Sad + Disgust + Angry)
    const lowEngaged = (emotions.Fear || 0) + (emotions.Sad || 0) + (emotions.Disgust || 0) + (emotions.Angry || 0);
    
    // Update the last point in the chart (current time)
    const labels = engagementLevelChart.data.labels;
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    // Shift labels and add current time
    if (labels.length >= 7) {
        labels.shift();
    }
    labels.push(currentTime);
    
    // Update High Engaged data
    const highEngagedData = engagementLevelChart.data.datasets[0].data;
    if (highEngagedData.length >= 7) {
        highEngagedData.shift();
    }
    highEngagedData.push(Math.round(highEngaged));
    
    // Update Low Engaged data
    const lowEngagedData = engagementLevelChart.data.datasets[1].data;
    if (lowEngagedData.length >= 7) {
        lowEngagedData.shift();
    }
    lowEngagedData.push(Math.round(lowEngaged));
    
    engagementLevelChart.update('none');
}

// Initialize Forecasting Chart
let forecastingChart = null;
let forecastHistory = [];

function initForecastingChart() {
    const ctx = document.getElementById('forecastingChart');
    if (!ctx) return;

    // Initialize with empty data
    const labels = ['Now', '+1min', '+2min', '+3min', '+4min', '+5min'];

    forecastingChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: Array(6).fill(null),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: false,
                    borderWidth: 2,
                    pointRadius: 4,
                    yAxisID: 'y'
                },
                {
                    label: 'Humidity (%)',
                    data: Array(6).fill(null),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: false,
                    borderWidth: 2,
                    pointRadius: 4,
                    yAxisID: 'y'
                },
                {
                    label: 'CO₂ (ppm)',
                    data: Array(6).fill(null),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: false,
                    borderWidth: 2,
                    pointRadius: 4,
                    yAxisID: 'y1',
                    hidden: true  // Hide by default (different scale)
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
                            size: 11,
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
                        size: 13,
                        weight: 600
                    },
                    bodyFont: {
                        size: 12
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Temp (°C) / Humidity (%)',
                        font: { size: 11 }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'CO₂ (ppm)',
                        font: { size: 11 }
                    },
                    grid: {
                        drawOnChartArea: false
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
    
    // Start updating forecast data every 15 seconds
    const forecastUpdateId = setInterval(updateForecastingChart, 15000);
    if (window.dashboardIntervals) {
        window.dashboardIntervals.push(forecastUpdateId);
    }
    // Initial update
    updateForecastingChart();
}

// Update forecasting chart with ML predictions
async function updateForecastingChart() {
    if (!forecastingChart) return;
    
    try {
        const response = await fetch('/api/prediction/forecast');
        const result = await response.json();
        
        if (result.success && result.current && result.predicted) {
            const current = result.current;
            const predicted = result.predicted;
            
            // Simple projection: current value, then predicted (assuming 1-minute ahead prediction)
            // We'll show current + 5 projected points based on the delta
            const tempData = [
                current.temperature,
                current.temperature + predicted.delta_temperature * 0.2,
                current.temperature + predicted.delta_temperature * 0.4,
                current.temperature + predicted.delta_temperature * 0.6,
                current.temperature + predicted.delta_temperature * 0.8,
                predicted.temperature
            ];
            
            const humidityData = [
                current.humidity,
                current.humidity + predicted.delta_humidity * 0.2,
                current.humidity + predicted.delta_humidity * 0.4,
                current.humidity + predicted.delta_humidity * 0.6,
                current.humidity + predicted.delta_humidity * 0.8,
                predicted.humidity
            ];
            
            const co2Data = [
                current.gas,
                current.gas + predicted.delta_gas * 0.2,
                current.gas + predicted.delta_gas * 0.4,
                current.gas + predicted.delta_gas * 0.6,
                current.gas + predicted.delta_gas * 0.8,
                predicted.gas
            ];
            
            // Update chart data
            forecastingChart.data.datasets[0].data = tempData.map(v => v.toFixed(1));
            forecastingChart.data.datasets[1].data = humidityData.map(v => v.toFixed(1));
            forecastingChart.data.datasets[2].data = co2Data.map(v => Math.round(v));
            
            forecastingChart.update('none');
            
            console.log('[Forecast] Updated chart with predictions');
        } else {
            // Log why prediction failed
            console.log('[Forecast] Prediction not available:', result.error || result.message || 'Unknown reason');
        }
    } catch (error) {
        console.error('[Forecast] Error updating forecasting chart:', error);
    }
}

// Initialize Emotion Detection Chart
let emotionChart = null;
let emotionChartMini = null;

function initEmotionChart() {
    // Main emotion chart
    const ctx = document.getElementById('emotionChart');
    if (ctx) {
        // Define FER-2013 emotion colors
        const emotionColors = {
            'Happy': '#10b981',
            'Surprise': '#22d3ee',
            'Neutral': '#8b5cf6',
            'Sad': '#6b7280',
            'Angry': '#ef4444',
            'Disgust': '#f97316',
            'Fear': '#f59e0b'
        };

        emotionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Happy', 'Surprise', 'Neutral', 'Sad', 'Angry', 'Disgust', 'Fear'],
                datasets: [{
                    data: [1, 1, 1, 1, 1, 1, 1], // Equal placeholder for N/A state
                    backgroundColor: [
                        emotionColors.Happy,
                        emotionColors.Surprise,
                        emotionColors.Neutral,
                        emotionColors.Sad,
                        emotionColors.Angry,
                        emotionColors.Disgust,
                        emotionColors.Fear
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
                        enabled: false, // Disable tooltip for N/A state, enable when data available
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

        // Create custom legend with N/A values initially
        updateEmotionLegend(emotionColors, false);
    }
    
    // Mini emotion chart in camera monitor
    const ctxMini = document.getElementById('emotionChartMini');
    if (ctxMini) {
        const emotionColors = {
            'Happy': '#10b981',
            'Surprise': '#22d3ee',
            'Neutral': '#8b5cf6',
            'Sad': '#6b7280',
            'Angry': '#ef4444',
            'Disgust': '#f97316',
            'Fear': '#f59e0b'
        };

        emotionChartMini = new Chart(ctxMini, {
            type: 'doughnut',
            data: {
                labels: ['Happy', 'Surprise', 'Neutral', 'Sad', 'Angry', 'Disgust', 'Fear'],
                datasets: [{
                    data: [1, 1, 1, 1, 1, 1, 1], // Equal placeholder for N/A state
                    backgroundColor: [
                        emotionColors.Happy,
                        emotionColors.Surprise,
                        emotionColors.Neutral,
                        emotionColors.Sad,
                        emotionColors.Angry,
                        emotionColors.Disgust,
                        emotionColors.Fear
                    ],
                    borderWidth: 1,
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
                        enabled: false // Disable for N/A state
                    }
                }
            }
        });

        // Create custom mini legend with N/A values initially
        updateEmotionLegendMini(emotionColors, false);
    }
}

function updateEmotionLegend(emotionColors, hasData = false) {
    const legendContainer = document.getElementById('emotionLegend');
    if (!legendContainer) return;

    const emotions = ['Happy', 'Surprise', 'Neutral', 'Sad', 'Angry', 'Disgust', 'Fear'];
    legendContainer.innerHTML = emotions.map(emotion => `
        <div style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${emotionColors[emotion]};"></div>
            <span style="font-size: 11px; color: var(--text-secondary);">${emotion}: ${hasData ? '--' : 'N/A'}</span>
        </div>
    `).join('');
}

function updateEmotionLegendMini(emotionColors, hasData = false) {
    const legendContainer = document.getElementById('emotionLegendMini');
    if (!legendContainer) return;

    const emotions = ['Happy', 'Surprise', 'Neutral', 'Sad', 'Angry', 'Disgust', 'Fear'];
    legendContainer.innerHTML = emotions.map(emotion => `
        <div style="display: flex; align-items: center; gap: 4px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: ${emotionColors[emotion]};"></div>
            <span style="font-size: 9px; color: var(--text-secondary);">${emotion}</span>
        </div>
    `).join('');
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
    
    // Mark camera as active in localStorage
    localStorage.setItem('cameraActive', 'true');
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
                videoElement.style.objectFit = 'cover';
                videoElement.style.borderRadius = '12px';
                videoElement.style.maxHeight = '100%';
                cameraFeedContainer.appendChild(videoElement);
            }
            // Set video stream source with cache-busting timestamp
            videoElement.src = `/api/camera/stream?t=${Date.now()}`;
            videoElement.style.display = 'block';
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
        
        console.log('Camera started successfully');
        
        // Start updating detection stats more frequently
        if (cameraUpdateInterval) clearInterval(cameraUpdateInterval);
        cameraUpdateInterval = setInterval(fetchDashboardStats, 2000); // Every 2 seconds when camera is active
        window.cameraUpdateInterval = cameraUpdateInterval;
        if (window.dashboardIntervals) {
            window.dashboardIntervals.push(cameraUpdateInterval);
        }
        
    } catch (error) {
        // Show error state
        const cameraStatusText = document.getElementById('cameraStatusText');
        if (cameraStatusText) {
            cameraStatusText.innerHTML = `<span style="color: #ef4444;">${error.message}</span><br><small style="color: #9ca3af; font-size: 12px;">Please try again</small>`;
        }
        
        // Reset start button to allow retry
        if (startCameraBtn) {
            startCameraBtn.disabled = false;
            startCameraBtn.innerHTML = '<i data-lucide="play"></i> Start Camera';
            startCameraBtn.style.background = '';
        }
        
        // Ensure placeholder is visible
        if (cameraPlaceholder) {
            cameraPlaceholder.style.display = 'flex';
        }
        
        // Ensure camera is marked as inactive
        cameraActive = false;
        
        lucide.createIcons();
        
        console.error('Camera error:', error);
    }
}

// Stop camera
async function stopCamera() {
    // Clear camera active state from localStorage
    localStorage.setItem('cameraActive', 'false');
    
    const stopCameraBtn = document.getElementById('stopCameraBtn');
    const startCameraBtn = document.getElementById('startCameraBtn');
    const cameraPlaceholder = document.getElementById('cameraPlaceholder');
    const cameraStatusText = document.getElementById('cameraStatusText');
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
        
        // Reset camera status text to default
        if (cameraStatusText) {
            cameraStatusText.textContent = 'Camera feed will be displayed here';
            cameraStatusText.style.color = '#9ca3af';
        }
        
        // Reset start camera button to default state
        if (startCameraBtn) {
            startCameraBtn.disabled = false;
            startCameraBtn.innerHTML = '<i data-lucide="play"></i> Start Camera';
            startCameraBtn.style.background = '';
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
        
        console.log('Camera stopped');
        
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
            // Fullscreen mode
            cameraFeedContainer.style.height = '100vh';
            cameraFeedContainer.style.width = '100vw';
            cameraFeedContainer.style.maxHeight = 'none';
            
            // Make video fit fullscreen
            const videoElement = document.getElementById('cameraVideoStream');
            if (videoElement) {
                videoElement.style.objectFit = 'contain';
                videoElement.style.maxWidth = '100vw';
                videoElement.style.maxHeight = '100vh';
            }
        } else {
            // Exit fullscreen - restore to original size
            cameraFeedContainer.style.height = '';
            cameraFeedContainer.style.width = '100%';
            cameraFeedContainer.style.maxHeight = '';
            cameraFeedContainer.style.aspectRatio = '16/9';
            
            // Reset video fit to cover
            const videoElement = document.getElementById('cameraVideoStream');
            if (videoElement) {
                videoElement.style.objectFit = 'cover';
                videoElement.style.width = '100%';
                videoElement.style.height = '100%';
                videoElement.style.maxWidth = '';
                videoElement.style.maxHeight = '';
            }
        }
    }
    
    // Reinitialize icons after fullscreen change
    lucide.createIcons();
}

// Add CSS animations and fullscreen styles
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
        
        /* Fullscreen camera styles */
        #cameraFeedContainer:fullscreen {
            display: flex;
            align-items: center;
            justify-content: center;
            background: #000;
        }
        
        #cameraFeedContainer:-webkit-full-screen {
            display: flex;
            align-items: center;
            justify-content: center;
            background: #000;
        }
        
        #cameraFeedContainer:fullscreen #cameraVideoStream {
            max-width: 100vw;
            max-height: 100vh;
            width: auto;
            height: auto;
            object-fit: contain;
        }
        
        #cameraFeedContainer:-webkit-full-screen #cameraVideoStream {
            max-width: 100vw;
            max-height: 100vh;
            width: auto;
            height: auto;
            object-fit: contain;
        }
        
        /* Ensure proper video sizing in normal mode */
        #cameraVideoStream {
            display: block;
            margin: auto;
        }
    `;
    document.head.appendChild(dashboardAnimationStyle);

// =========================
// LSTM Removed - Placeholder for Future Predictive Features
// =========================

function initLSTMPredictionChart() {
    // LSTM functionality removed - no model available yet
    return;
    const ctx = document.getElementById('lstmPredictionChart');
    if (!ctx) return;
    
    // Initialize with placeholder data
    const timeLabels = [];
    const now = new Date();
    for (let i = -5; i <= 10; i++) {
        const time = new Date(now.getTime() + i * 60000); // 1 minute intervals
        timeLabels.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }
    
    lstmPredictionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'Historical Engagement',
                    data: Array(6).fill(null).concat(Array(10).fill(null)),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Predicted Engagement',
                    data: Array(6).fill(null).concat(Array(10).fill(null)),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 3,
                    borderDash: [10, 5],
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Confidence Interval',
                    data: Array(16).fill(null),
                    borderColor: 'rgba(245, 158, 11, 0.3)',
                    backgroundColor: 'rgba(245, 158, 11, 0.05)',
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: '+1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 13
                    },
                    bodyFont: {
                        size: 12
                    },
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(1) + '%';
                            }
                            return label;
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
                            return value + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Engagement Level'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

function updateLSTMPrediction() {
    // LSTM functionality removed - no model available yet
    return;
}

function updateLSTMChartWithAPIData(apiData) {
    // LSTM functionality removed - no model available yet
    return;
}

function updateLSTMChartSimulation() {
    // LSTM functionality removed - no model available yet
    return;
}
}