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
    
    // Fetch IoT sensor data for Environment Monitor
    fetchIoTEnvironmentData();
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
        lightEl.textContent = light.toFixed(0);
        if (lightBarEl) {
            // Scale 0-1000 to 0-100%
            const lightPercent = Math.min(100, (light / 1000) * 100);
            lightBarEl.style.width = lightPercent + '%';
        }
    }
    
    // Air Quality (0-4095 range, lower is better, display raw value)
    const airEl = document.getElementById('envAirQuality');
    const airBarEl = document.getElementById('envAirQualityBar');
    if (airEl && iotData.air_quality !== undefined) {
        const airQuality = parseFloat(iotData.air_quality);
        airEl.textContent = airQuality.toFixed(0);
        if (airBarEl) {
            // Invert scale: 0 = 100% bar (excellent), 4095 = 0% bar (poor)
            const airPercent = Math.max(0, 100 - (airQuality / 4095) * 100);
            airBarEl.style.width = airPercent + '%';
        }
    }
    
    // Noise Level (0-4095 range for sound sensor)
    const noiseEl = document.getElementById('envNoise');
    const noiseBarEl = document.getElementById('envNoiseBar');
    if (noiseEl && iotData.sound !== undefined) {
        const noise = parseFloat(iotData.sound);
        noiseEl.textContent = noise.toFixed(0);
        if (noiseBarEl) {
            // Scale 0-4095 to 0-100%
            const noisePercent = Math.min(100, (noise / 4095) * 100);
            noiseBarEl.style.width = noisePercent + '%';
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
                <div class="stat-value" id="environmentStatus" style="font-size: 24px;">N/A</div>
                <div class="stat-change" id="environmentStatusChange">
                    <i data-lucide="info"></i>
                    <span>Waiting for data...</span>
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

            <!-- Environmental Forecast -->
            <div class="card card-half">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Environmental Forecast</h3>
                        <p class="card-subtitle">Predicted conditions from Gradient Boosting model</p>
                    </div>
                    <button class="card-action">
                        <i data-lucide="trending-up"></i>
                    </button>
                </div>
                <div class="chart-container">
                    <canvas id="forecastChart"></canvas>
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
    initForecastChart();
    initEmotionChart();
    
    // Initialize notification system
    initNotificationSystem();

    // Initialize camera button
    initCameraButton();
    
    // Initialize fullscreen button
    initFullscreenButton();

    // Fetch initial dashboard data
    fetchDashboardStats();
    fetchIoTEnvironmentData();
    
    // Update stats every 5 seconds for real-time sync
    setInterval(fetchDashboardStats, 5000);
    
    // Update IoT environment data every 10 seconds
    setInterval(fetchIoTEnvironmentData, 10000);
    
    // Update emotion chart data every 2 seconds when camera is active
    setInterval(() => {
        const isCameraActive = cameraActive || localStorage.getItem('cameraActive') === 'true';
        if (isCameraActive) {
            updateEmotionChartData();
        }
    }, 2000);
    
    // Fetch environmental predictions every 60 seconds (for 1-minute ahead forecasting)
    // Initial fetch after 5 seconds
    setTimeout(fetchEnvironmentalPredictions, 5000);
    setInterval(fetchEnvironmentalPredictions, 60000);
    
    // Update environment status every 10 seconds
    setInterval(updateEnvironmentStatus, 10000);
}

// Fetch environmental predictions from ML models
async function fetchEnvironmentalPredictions() {
    try {
        const response = await fetch('/api/predictions/environment');
        const result = await response.json();
        
        if (result.success) {
            console.log('✓ Environmental Predictions received:', result);
            
            // Update forecast chart
            updateForecastChart(result);
            
            // Update environment status card
            updateEnvironmentStatusCard(result);
            
            // Show notifications for recommendations
            if (result.recommendations && result.recommendations.length > 0) {
                showPredictionNotifications(result.recommendations, result.comfort_classification);
            }
        } else {
            console.warn('⚠ Predictions not ready:', result.error || 'Unknown error');
            if (result.current_buffer_size !== undefined) {
                console.log(`ℹ Collecting data... ${result.current_buffer_size}/${result.required_buffer_size} readings`);
            }
        }
    } catch (error) {
        // Silently fail if predictions not available yet
        console.debug('Environmental predictions not available:', error);
    }
}

// Update environment status card with RF classification
function updateEnvironmentStatusCard(predictionData) {
    const statusEl = document.getElementById('environmentStatus');
    const statusChangeEl = document.getElementById('environmentStatusChange');
    
    if (!statusEl || !statusChangeEl) return;
    
    const comfort = predictionData.comfort_classification || {};
    const level = comfort.level;
    const label = comfort.label || 'N/A';
    const probabilities = comfort.probabilities || {};
    
    // Get highest probability
    const maxProb = Math.max(...Object.values(probabilities)) * 100;
    
    // Update status text and color
    statusEl.textContent = label;
    
    // Color coding based on comfort level
    const colors = {
        'Critical': { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', icon: 'alert-triangle' },
        'Poor': { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', icon: 'alert-circle' },
        'Acceptable': { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', icon: 'info' },
        'Optimal': { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', icon: 'check-circle' }
    };
    
    const color = colors[label] || colors['Acceptable'];
    statusEl.style.color = color.text;
    
    // Update status change message
    let message = '';
    let changeClass = 'neutral';
    
    if (label === 'Optimal') {
        message = 'All systems normal';
        changeClass = 'positive';
    } else if (label === 'Acceptable') {
        message = 'Conditions are acceptable';
        changeClass = 'neutral';
    } else if (label === 'Poor') {
        message = 'Improvement needed';
        changeClass = 'negative';
    } else if (label === 'Critical') {
        message = 'Immediate action required!';
        changeClass = 'negative';
    }
    
    statusChangeEl.className = `stat-change ${changeClass}`;
    statusChangeEl.innerHTML = `
        <i data-lucide="${color.icon}"></i>
        <span>${message} (${maxProb.toFixed(0)}% confidence)</span>
    `;
    
    lucide.createIcons();
}

// Update environment status from IoT data
async function updateEnvironmentStatus() {
    // Try to get prediction data first
    try {
        const response = await fetch('/api/predictions/environment');
        const result = await response.json();
        
        if (result.success) {
            // Update environment status card
            updateEnvironmentStatusCard(result);
            
            // Update forecast chart
            updateForecastChart(result);
            
            // NOTE: Notifications are handled by fetchEnvironmentalPredictions (every 1 min)
            // Do NOT show notifications here to prevent duplicates
        }
    } catch (error) {
        // If predictions not available, just show N/A
        console.debug('Environment predictions not yet available');
    }
}

// Initialize Engagement & Attention Chart (High/Low Engagement)
let engagementChart = null;
let engagementHistory = [];

function initEngagementChart() {
    const ctx = document.getElementById('engagementChart');
    if (!ctx) return;

    // Initialize with empty data
    const labels = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 10000); // Last 70 seconds
        labels.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }

    engagementChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'High Engagement',
                    data: Array(7).fill(0),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: 'Low Engagement',
                    data: Array(7).fill(0),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
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
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            const count = Math.floor(context.parsed.y);
                            label += count + ' student' + (count !== 1 ? 's' : '');
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return Math.floor(value) + ' students';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Number of Students'
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
    
    // Start updating engagement data every 2 seconds
    setInterval(updateEngagementChart, 2000);
}

// Update engagement chart with real-time high/low engagement data (COUNTS not percentages)
async function updateEngagementChart() {
    if (!engagementChart) return;
    
    try {
        const response = await fetch('/api/emotions');
        const result = await response.json();
        
        if (result.success && result.data) {
            const data = result.data;
            const engagementSummary = data.engagement_summary || {};
            
            // Get COUNTS (number of students)
            const highCount = engagementSummary.high_engaged_count || 0;
            const lowCount = engagementSummary.low_engaged_count || 0;
            
            // Add to history
            engagementHistory.push({
                timestamp: new Date(),
                high: highCount,
                low: lowCount
            });
            
            // Keep only last 20 data points
            if (engagementHistory.length > 20) {
                engagementHistory.shift();
            }
            
            // Update chart labels and data
            const labels = engagementHistory.map(item => 
                item.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            );
            const highData = engagementHistory.map(item => item.high);
            const lowData = engagementHistory.map(item => item.low);
            
            engagementChart.data.labels = labels;
            engagementChart.data.datasets[0].data = highData;
            engagementChart.data.datasets[1].data = lowData;
            engagementChart.update('none'); // Update without animation for smoother real-time updates
        }
    } catch (error) {
        console.error('Error updating engagement chart:', error);
    }
}

// Initialize Occupancy Chart
let occupancyChart = null;
let occupancyHistory = [];

function initOccupancyChart() {
    const ctx = document.getElementById('occupancyChart');
    if (!ctx) return;

    // Initialize with empty data
    const labels = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60000); // Last 7 minutes
        labels.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }

    occupancyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Students Present',
                    data: Array(7).fill(0),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
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
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.parsed.y + ' students';
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 35,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        stepSize: 5,
                        callback: function(value) {
                            return value;
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
    
    // Start updating occupancy data every 5 seconds
    setInterval(updateOccupancyChart, 5000);
}

// Update occupancy chart with real-time YOLO detection data
function updateOccupancyChart() {
    if (!occupancyChart) return;
    
    // Get current student count from YOLO detection (use dashboardData from API)
    const currentStudents = dashboardData.studentsDetected || 0;
    
    // Add to history
    occupancyHistory.push({
        timestamp: new Date(),
        count: currentStudents
    });
    
    // Keep only last 20 data points (about 1.5 minutes at 5-second intervals)
    if (occupancyHistory.length > 20) {
        occupancyHistory.shift();
    }
    
    // Update chart labels and data
    const labels = occupancyHistory.map(item => 
        item.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
    const data = occupancyHistory.map(item => item.count);
    
    occupancyChart.data.labels = labels;
    occupancyChart.data.datasets[0].data = data;
    occupancyChart.update('none'); // Update without animation for smoother real-time updates
}

// Initialize Forecast Chart (Gradient Boosting Predictions)
let forecastChart = null;

function initForecastChart() {
    const ctx = document.getElementById('forecastChart');
    if (!ctx) return;

    forecastChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Temperature (°C)', 'Humidity (%)', 'CO₂ (ppm)', 'Light (lux)', 'Sound (dBA)'],
            datasets: [
                {
                    label: 'Current',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: '#3b82f6',
                    borderWidth: 2
                },
                {
                    label: 'Predicted',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                    borderColor: '#f59e0b',
                    borderWidth: 2
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
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.parsed.y.toFixed(1);
                            
                            // Add units
                            const units = ['°C', '%', ' ppm', ' lux', ' dBA'];
                            label += units[context.dataIndex] || '';
                            
                            return label;
                        },
                        afterLabel: function(context) {
                            if (context.dataset.label === 'Predicted') {
                                const currentData = context.chart.data.datasets[0].data;
                                const predictedData = context.chart.data.datasets[1].data;
                                const delta = predictedData[context.dataIndex] - currentData[context.dataIndex];
                                const sign = delta >= 0 ? '+' : '';
                                return `Change: ${sign}${delta.toFixed(1)}`;
                            }
                            return null;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
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

// Update forecast chart with prediction data
function updateForecastChart(predictionData) {
    if (!forecastChart) {
        console.warn('⚠ Forecast chart not initialized');
        return;
    }
    
    const current = predictionData.current_conditions || {};
    const predicted = predictionData.predicted_conditions || {};
    
    // Only update if we have actual prediction data
    if (!predicted.predicted_temperature) {
        console.debug('No forecast data available yet - waiting for predictions');
        return;
    }
    
    console.log('✓ Updating forecast chart with data:', { current, predicted });
    
    // Update chart data with actual values
    forecastChart.data.datasets[0].data = [
        current.temperature || 0,
        current.humidity || 0,
        current.co2 || 0,
        current.light || 0,
        current.sound || 0
    ];
    
    forecastChart.data.datasets[1].data = [
        predicted.predicted_temperature || current.temperature || 0,
        predicted.predicted_humidity || current.humidity || 0,
        predicted.predicted_gas || current.co2 || 0,
        predicted.predicted_light || current.light || 0,
        predicted.predicted_sound || current.sound || 0
    ];
    
    forecastChart.update();
    console.log('✓ Forecast chart updated');
}

// Initialize 7 Emotions Chart (for Engagement States card)
let emotionChart = null;
let emotionChartMini = null;

function initEmotionChart() {
    // Main emotion chart - Shows 7 FER-2013 emotions
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

// Update 7-emotion chart with real-time data from API
async function updateEmotionChartData() {
    if (!emotionChart) return;
    
    try {
        const response = await fetch('/api/emotions');
        const result = await response.json();
        
        if (result.success && result.data) {
            const data = result.data;
            const emotionPercentages = data.emotion_percentages || {};
            
            // Get all 7 emotion percentages
            const emotions = ['Happy', 'Surprise', 'Neutral', 'Sad', 'Angry', 'Disgust', 'Fear'];
            const emotionData = emotions.map(emotion => emotionPercentages[emotion] || 0);
            
            // Check if we have any data
            const hasData = emotionData.some(val => val > 0);
            
            if (hasData) {
                emotionChart.data.datasets[0].data = emotionData;
                emotionChart.options.plugins.tooltip.enabled = true;
                emotionChart.update('none');
                
                // Update legend with actual percentages
                const legendContainer = document.getElementById('emotionLegend');
                if (legendContainer) {
                    const emotionColors = {
                        'Happy': '#10b981',
                        'Surprise': '#22d3ee',
                        'Neutral': '#8b5cf6',
                        'Sad': '#6b7280',
                        'Angry': '#ef4444',
                        'Disgust': '#f97316',
                        'Fear': '#f59e0b'
                    };
                    legendContainer.innerHTML = emotions.map(emotion => `
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${emotionColors[emotion]};"></div>
                            <span style="font-size: 11px; color: var(--text-secondary);">${emotion}: ${emotionPercentages[emotion]?.toFixed(1) || '0.0'}%</span>
                        </div>
                    `).join('');
                }
            }
            
            // Update mini chart if it exists
            if (emotionChartMini && hasData) {
                emotionChartMini.data.datasets[0].data = emotionData;
                emotionChartMini.options.plugins.tooltip.enabled = true;
                emotionChartMini.update('none');
            }
        }
    } catch (error) {
        console.error('Error updating emotion chart:', error);
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

// ==================== Notification System ====================

// Initialize notification system
let notificationContainer = null;
let notificationQueue = [];
let activeNotifications = [];
let notificationHistory = []; // Store notification history for the panel
let unreadCount = 0;

function initNotificationSystem() {
    // Create notification container if it doesn't exist
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Initialize notification bell
    initNotificationBell();
}

// Initialize notification bell functionality
function initNotificationBell() {
    const bellButton = document.getElementById('notificationBell');
    const notificationPanel = document.getElementById('notificationPanel');
    const clearAllBtn = document.getElementById('clearAllNotifications');
    
    if (!bellButton || !notificationPanel) return;
    
    // Toggle notification panel
    bellButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = notificationPanel.style.display === 'block';
        notificationPanel.style.display = isVisible ? 'none' : 'block';
        
        // Mark all as read when panel is opened
        if (!isVisible) {
            markAllAsRead();
        }
    });
    
    // Clear all notifications
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            notificationHistory = [];
            unreadCount = 0;
            updateNotificationBadge();
            renderNotificationPanel();
        });
    }
    
    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!notificationPanel.contains(e.target) && e.target !== bellButton) {
            notificationPanel.style.display = 'none';
        }
    });
}

// Update notification badge count
function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

// Mark all notifications as read
function markAllAsRead() {
    notificationHistory.forEach(notif => notif.unread = false);
    unreadCount = 0;
    updateNotificationBadge();
    renderNotificationPanel();
}

// Render notification panel
function renderNotificationPanel() {
    const panelBody = document.getElementById('notificationPanelBody');
    if (!panelBody) return;
    
    if (notificationHistory.length === 0) {
        panelBody.innerHTML = `
            <div class="notification-empty">
                <i data-lucide="bell-off" style="width: 48px; height: 48px; opacity: 0.3;"></i>
                <p>No notifications yet</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    panelBody.innerHTML = notificationHistory.map(notif => {
        const timeAgo = getTimeAgo(notif.timestamp);
        const unreadClass = notif.unread ? 'unread' : '';
        
        return `
            <div class="notification-item-panel ${unreadClass}" style="position: relative;">
                <div class="notification-item-header">
                    <span class="notification-icon">${notif.icon}</span>
                    <div class="notification-content">
                        <div class="notification-title">${notif.title}</div>
                        <div class="notification-message">${notif.message}</div>
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    lucide.createIcons();
}

// Get time ago string
function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

// Track last notification time to prevent duplicates
let lastNotificationTime = 0;
let lastNotificationData = null;

// Show notifications for prediction recommendations (max once per minute)
function showPredictionNotifications(recommendations, classification) {
    if (!recommendations || recommendations.length === 0) return;
    
    const now = Date.now();
    const notificationKey = JSON.stringify({ recommendations, classification: classification?.label });
    
    // Only show notifications once per minute and if data changed
    if (now - lastNotificationTime < 60000 && lastNotificationData === notificationKey) {
        return;
    }
    
    lastNotificationTime = now;
    lastNotificationData = notificationKey;
    
    // Show critical alert if room is uncomfortable
    const comfortLabel = classification?.label || classification;
    if (comfortLabel === 'Critical' || comfortLabel === 'Poor') {
        showNotification({
            type: 'alert',
            title: comfortLabel === 'Critical' ? '🚨 ALERT: Room Conditions Critical!' : '⚠️ Warning: Room Conditions Poor',
            message: `Environment predicted to be ${comfortLabel.toLowerCase()}. Please check recommendations.`,
            duration: 15000,
            severity: comfortLabel === 'Critical' ? 'error' : 'warning'
        });
    } else if (comfortLabel === 'Optimal') {
        // Only show optimal notification once
        showNotification({
            type: 'success',
            title: '✅ Optimal Conditions',
            message: 'All environmental conditions are optimal.',
            duration: 5000,
            severity: 'success'
        });
    }
}

// Get icon for recommendation based on content
function getRecommendationIcon(recommendation) {
    const text = recommendation.toLowerCase();
    if (text.includes('temperature') || text.includes('cooling') || text.includes('heating')) return '🌡️';
    if (text.includes('humidity')) return '💧';
    if (text.includes('co2') || text.includes('ventilation')) return '🌬️';
    if (text.includes('light')) return '💡';
    if (text.includes('sound') || text.includes('noise')) return '🔊';
    return 'ℹ️';
}

// Display a notification
function showNotification({ type, title, message, duration = 10000, severity = 'info' }) {
    if (!notificationContainer) initNotificationSystem();
    
    // Determine icon based on severity and content
    let icon = '🔔';
    if (title.includes('🚨')) icon = '🚨';
    else if (title.includes('⚠️')) icon = '⚠️';
    else if (title.includes('🌡️')) icon = '🌡️';
    else if (title.includes('💧')) icon = '💧';
    else if (title.includes('🌬️')) icon = '🌬️';
    else if (title.includes('💡')) icon = '💡';
    else if (title.includes('🔊')) icon = '🔊';
    else if (severity === 'error') icon = '🚨';
    else if (severity === 'warning') icon = '⚠️';
    else if (severity === 'success') icon = '✅';
    else if (severity === 'info') icon = 'ℹ️';
    
    // Add to notification history
    notificationHistory.unshift({
        id: Date.now(),
        title: title.replace(/[🚨⚠️🌡️💧🌬️💡🔊ℹ️✅]/g, '').trim(),
        message: message,
        icon: icon,
        severity: severity,
        timestamp: Date.now(),
        unread: true
    });
    
    // Keep only last 50 notifications
    if (notificationHistory.length > 50) {
        notificationHistory = notificationHistory.slice(0, 50);
    }
    
    // Increment unread count
    unreadCount++;
    updateNotificationBadge();
    renderNotificationPanel();
    
    // Show toast notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    // Severity colors
    const severityConfig = {
        'error': { bg: '#ef4444', border: '#dc2626' },
        'warning': { bg: '#f97316', border: '#ea580c' },
        'info': { bg: '#3b82f6', border: '#2563eb' },
        'success': { bg: '#10b981', border: '#059669' }
    };
    
    const config = severityConfig[severity] || severityConfig['info'];
    
    notification.innerHTML = `
        <div style="background: ${config.bg}; border-left: 4px solid ${config.border}; color: white; padding: 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 400px; display: flex; align-items: flex-start; gap: 12px;">
            <div style="font-size: 24px; flex-shrink: 0;">
                ${icon}
            </div>
            <div style="flex: 1; min-width: 0;">
                <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">${title}</h3>
                <p style="font-size: 13px; margin: 0; opacity: 0.95;">${message}</p>
            </div>
            <button onclick="this.closest('.notification').remove()" 
                    style="background: none; border: none; color: white; cursor: pointer; font-size: 20px; padding: 0; line-height: 1; opacity: 0.8; flex-shrink: 0;">
                &times;
            </button>
        </div>
    `;
    
    notificationContainer.appendChild(notification);
    activeNotifications.push(notification);
    
    // Auto-remove after duration
    setTimeout(() => {
        removeNotification(notification);
    }, duration);
}

// Remove notification with animation
function removeNotification(notification) {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100px)';
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
        activeNotifications = activeNotifications.filter(n => n !== notification);
    }, 300);
}
}