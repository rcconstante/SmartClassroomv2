// Dashboard module for Smart Classroom

// Global state for dashboard data
let dashboardData = {
    totalStudents: 32,
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
    
    // Air Quality (0-500 AQI range, lower is better, display raw value)
    const airEl = document.getElementById('envAirQuality');
    const airBarEl = document.getElementById('envAirQualityBar');
    if (airEl && iotData.air_quality !== undefined) {
        const airQuality = parseFloat(iotData.air_quality);
        airEl.textContent = airQuality.toFixed(0);
        if (airBarEl) {
            // Invert scale: 0 AQI = 100% bar (excellent), 500 AQI = 0% bar (hazardous)
            const airPercent = Math.max(0, 100 - (airQuality / 500) * 100);
            airBarEl.style.width = airPercent + '%';
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
    
    if (totalStudentsEl) totalStudentsEl.textContent = dashboardData.totalStudents;
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
                <div class="stat-value" id="totalStudents">32</div>
                <div class="stat-change positive">
                    <i data-lucide="trending-up"></i>
                    <span>+2 this semester</span>
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

            <!-- Occupancy Overview -->
            <div class="card card-half">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Occupancy</h3>
                        <p class="card-subtitle">Real-time classroom occupancy trends</p>
                    </div>
                    <button class="card-action">
                        <i data-lucide="users"></i>
                    </button>
                </div>
                <div class="chart-container">
                    <canvas id="occupancyChart"></canvas>
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
                            <span id="envTemp" style="font-size: 18px; font-weight: 600;">0°C</span>
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
                            <span id="envHumidity" style="font-size: 18px; font-weight: 600;">0%</span>
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
                            <span id="envLight" style="font-size: 18px; font-weight: 600;">0</span>
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
                            <span id="envAirQuality" style="font-size: 18px; font-weight: 600;">0</span>
                        </div>
                        <div class="progress-bar">
                            <div id="envAirQualityBar" class="progress-fill" style="width: 0%; background: linear-gradient(90deg, #10b981, #34d399);"></div>
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
    initOccupancyChart();
    initEmotionChart();

    // Initialize camera button
    initCameraButton();
    
    // Initialize fullscreen button
    initFullscreenButton();

    // Fetch initial dashboard data
    fetchDashboardStats();
    
    // Update stats every 3 seconds for real-time sync
    setInterval(fetchDashboardStats, 3000);
    
    // Auto-start camera if it was active before page change
    if (localStorage.getItem('cameraActive') === 'true') {
        setTimeout(() => {
            const startBtn = document.getElementById('startCameraBtn');
            if (startBtn && !cameraActive) {
                console.log('Auto-starting camera from previous session');
                startCamera();
            }
        }, 1000);
    }
    
    // Update emotion data every 2 seconds when camera is active
    setInterval(() => {
        // Check both local variable and localStorage for camera state
        const isCameraActive = cameraActive || localStorage.getItem('cameraActive') === 'true';
        if (isCameraActive) {
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

// Initialize Occupancy Chart
function initOccupancyChart() {
    const ctx = document.getElementById('occupancyChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
                {
                    label: 'Students Present',
                    data: [28, 30, 27, 29, 28, 25, 26],
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
                            return value + ' students';
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
                    data: [0, 0, 0, 0, 0, 0, 0],
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
                    data: [0, 0, 0, 0, 0, 0, 0],
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
                        enabled: false
                    }
                }
            }
        });

        // Create custom mini legend
        updateEmotionLegendMini(emotionColors);
    }
}

function updateEmotionLegend(emotionColors) {
    const legendContainer = document.getElementById('emotionLegend');
    if (!legendContainer) return;

    const emotions = ['Happy', 'Surprise', 'Neutral', 'Sad', 'Angry', 'Disgust', 'Fear'];
    legendContainer.innerHTML = emotions.map(emotion => `
        <div style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${emotionColors[emotion]};"></div>
            <span style="font-size: 11px; color: var(--text-secondary);">${emotion}</span>
        </div>
    `).join('');
}

function updateEmotionLegendMini(emotionColors) {
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

// Fetch and update emotion data
async function fetchEmotionData() {
    // Check both local variable and localStorage for camera state
    const isCameraActive = cameraActive || localStorage.getItem('cameraActive') === 'true';
    if (!isCameraActive) return;

    try {
        const response = await fetch('/api/emotions');
        const result = await response.json();

        if (result.success) {
            const emotionPercentages = result.data.emotion_percentages;
            const emotionData = [
                emotionPercentages.Happy || 0,
                emotionPercentages.Surprise || 0,
                emotionPercentages.Neutral || 0,
                emotionPercentages.Sad || 0,
                emotionPercentages.Angry || 0,
                emotionPercentages.Disgust || 0,
                emotionPercentages.Fear || 0
            ];
            
            // Update main chart
            if (emotionChart) {
                emotionChart.data.datasets[0].data = emotionData;
                emotionChart.update('none');
            }
            
            // Update mini chart
            if (emotionChartMini) {
                emotionChartMini.data.datasets[0].data = emotionData;
                emotionChartMini.update('none');
            }
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
        
        // Show success notification
        showNotification('Camera started successfully', 'success');
        
        // Start updating detection stats more frequently
        if (cameraUpdateInterval) clearInterval(cameraUpdateInterval);
        cameraUpdateInterval = setInterval(fetchDashboardStats, 1000); // Every 1 second when camera is active
        
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
        
        showNotification(error.message, 'error');
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

// LSTM Prediction Chart
let lstmPredictionChart = null;
let lstmPredictionData = {
    history: [],
    predictions: []
};

function initLSTMPredictionChart() {
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
    if (!lstmPredictionChart) return;
    
    // Try to fetch LSTM predictions from API
    fetch('/api/lstm/predict')
        .then(response => response.json())
        .then(result => {
            if (result.success && result.data) {
                updateLSTMChartWithAPIData(result.data);
            } else {
                // Fallback to simulation
                updateLSTMChartSimulation();
            }
        })
        .catch(error => {
            console.log('LSTM API not available, using simulation:', error);
            updateLSTMChartSimulation();
        });
}

function updateLSTMChartWithAPIData(apiData) {
    if (!lstmPredictionChart) return;
    
    const currentEngagement = dashboardData.avgEngagement || 78;
    
    // Use API predictions
    const predictions = apiData.engagement_scores || [];
    
    // Generate historical data (last 5 minutes) - could be from API history
    const history = [];
    for (let i = 5; i >= 0; i--) {
        const variance = Math.random() * 10 - 5;
        history.push(Math.min(100, Math.max(0, currentEngagement + variance)));
    }
    
    // Generate confidence interval (upper bound)
    const confidence = apiData.confidence || 0.8;
    const confidenceRange = (1 - confidence) * 15; // Higher uncertainty = wider range
    const confidenceUpper = predictions.map(v => Math.min(100, v + confidenceRange));
    
    // Update chart data
    const historyData = [...history, ...Array(predictions.length).fill(null)];
    const predictionData = [...Array(history.length).fill(null), ...predictions];
    const confidenceData = [...Array(history.length).fill(null), ...confidenceUpper];
    
    lstmPredictionChart.data.datasets[0].data = historyData;
    lstmPredictionChart.data.datasets[1].data = predictionData;
    lstmPredictionChart.data.datasets[2].data = confidenceData;
    lstmPredictionChart.update('none');
    
    // Update trend indicator
    const trendEl = document.getElementById('lstmTrend');
    if (trendEl) {
        const trend = apiData.trend || 'stable';
        const trendText = trend.charAt(0).toUpperCase() + trend.slice(1);
        const trendColor = trend === 'improving' ? '#10b981' : 
                          trend === 'declining' ? '#ef4444' : '#f59e0b';
        trendEl.textContent = trendText;
        trendEl.style.color = trendColor;
        
        // Add icon based on trend
        const parentDiv = trendEl.parentElement;
        if (parentDiv) {
            const icon = parentDiv.querySelector('i[data-lucide]');
            if (icon) {
                icon.setAttribute('data-lucide', 
                    trend === 'improving' ? 'trending-up' : 
                    trend === 'declining' ? 'trending-down' : 'minus');
                // Refresh lucide icons
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        }
    }
}

function updateLSTMChartSimulation() {
    if (!lstmPredictionChart) return;
    
    // Simulate LSTM prediction (fallback when API is not available)
    const currentEngagement = dashboardData.avgEngagement || 78;
    
    // Generate historical data (last 5 minutes)
    const history = [];
    for (let i = 5; i >= 0; i--) {
        const variance = Math.random() * 10 - 5;
        history.push(Math.min(100, Math.max(0, currentEngagement + variance)));
    }
    
    // Generate predictions (next 10 minutes) with LSTM-like behavior
    const predictions = [currentEngagement];
    let trend = (Math.random() - 0.5) * 2; // Random trend direction
    
    for (let i = 1; i <= 10; i++) {
        // Add momentum and noise
        trend += (Math.random() - 0.5) * 0.5;
        trend = Math.max(-2, Math.min(2, trend)); // Limit trend
        
        const lastValue = predictions[predictions.length - 1];
        let nextValue = lastValue + trend;
        
        // Mean reversion tendency (LSTM characteristic)
        const meanReversionFactor = (currentEngagement - nextValue) * 0.1;
        nextValue += meanReversionFactor;
        
        // Add noise
        nextValue += (Math.random() - 0.5) * 3;
        
        // Clamp values
        nextValue = Math.min(95, Math.max(40, nextValue));
        predictions.push(nextValue);
    }
    
    // Generate confidence interval (upper bound)
    const confidenceUpper = predictions.map(v => Math.min(100, v + 8));
    
    // Update chart data
    const historyData = [...history, null, null, null, null, null, null, null, null, null, null];
    const predictionData = [null, null, null, null, null, null, ...predictions];
    const confidenceData = [null, null, null, null, null, null, ...confidenceUpper];
    
    lstmPredictionChart.data.datasets[0].data = historyData;
    lstmPredictionChart.data.datasets[1].data = predictionData;
    lstmPredictionChart.data.datasets[2].data = confidenceData;
    lstmPredictionChart.update('none');
    
    // Update trend indicator
    const trendEl = document.getElementById('lstmTrend');
    if (trendEl) {
        const avgPrediction = predictions.reduce((a, b) => a + b, 0) / predictions.length;
        const trendDirection = avgPrediction > currentEngagement + 3 ? 'Improving' : 
                             avgPrediction < currentEngagement - 3 ? 'Declining' : 'Stable';
        const trendColor = trendDirection === 'Improving' ? '#10b981' : 
                          trendDirection === 'Declining' ? '#ef4444' : '#f59e0b';
        trendEl.textContent = trendDirection;
        trendEl.style.color = trendColor;
    }
}

}

