// Main App JavaScript
// Initialize Lucide icons
lucide.createIcons();

// App state
const state = {
    currentPage: 'dashboard',
    user: null,
    isAuthenticated: false, // Set to false - require proper login
    isDarkMode: localStorage.getItem('darkMode') === 'true'
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        // Not logged in, redirect to login
        window.location.href = '/login';
        return;
    }
    
    // Set user state
    state.user = user;
    state.isAuthenticated = true;
    
    // Update UI with user info
    updateUserProfile(user);
    
    // Initialize navigation based on user role
    initNavigation();
    
    // Hide nav items based on role
    updateNavigationByRole(user.role);
    
    initDarkMode();
    initEventListeners();
    
    // Load dashboard by default
    loadDashboard();
});

// Update user profile display
function updateUserProfile(user) {
    const profileAvatar = document.querySelector('.profile-avatar span');
    const profileName = document.querySelector('.profile-name');
    const profileRole = document.querySelector('.profile-role');
    const pageTitle = document.querySelector('.page-title');
    
    if (profileAvatar && user.name) {
        // Get initials from name
        const initials = user.role === 'admin' ? 'A' : user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        profileAvatar.textContent = initials;
    }
    
    if (profileName) {
        profileName.textContent = user.role === 'admin' ? 'Admin' : (user.name || 'User');
    }
    
    if (profileRole) {
        const roleText = user.role === 'student' ? 'Student' : user.role === 'admin' ? 'Administrator' : 'Teacher';
        profileRole.textContent = roleText;
    }
    
    if (pageTitle && user.name) {
        const firstName = user.role === 'admin' ? 'Admin' : user.name.split(' ')[0];
        pageTitle.textContent = `Hi, ${firstName}!`;
    }
}

// Update navigation menu based on user role
function updateNavigationByRole(role) {
    const navItems = document.querySelectorAll('.nav-item');
    
    if (role === 'student') {
        // Students can see Dashboard, Camera (view-only), and Help
        navItems.forEach(item => {
            const page = item.getAttribute('data-page');
            if (page === 'analytics' || page === 'settings') {
                item.style.display = 'none';
            }
        });
    } else {
        // Admin and Teacher can see all pages
        navItems.forEach(item => {
            item.style.display = 'flex';
        });
    }
}

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
            
            const page = item.getAttribute('data-page');
            
            // Check if user has access to this page
            const user = state.user || JSON.parse(localStorage.getItem('user'));
            if (!hasPageAccess(user?.role, page)) {
                console.warn(`Access denied: ${page}`);
                return;
            }
            
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
            
            // Get page name
            state.currentPage = page;
            
            // Route to appropriate page
            routeTo(page);
        });
    });
}

// Check if user role has access to page
function hasPageAccess(role, page) {
    if (!role) return false;
    
    // Student role restrictions
    if (role === 'student') {
        const allowedPages = ['dashboard', 'camera', 'help'];
        return allowedPages.includes(page);
    }
    
    // Admin and Teacher have access to all pages
    return true;
}

// Routing function
function routeTo(page) {
    const mainContent = document.getElementById('mainContent');
    const pageTitle = document.querySelector('.page-title');
    const pageSubtitle = document.querySelector('.page-subtitle');
    
    // Get user info for personalization
    const user = state.user || JSON.parse(localStorage.getItem('user'));
    const firstName = user?.name ? user.name.split(' ')[0] : 'User';
    
    switch(page) {
        case 'dashboard':
            if (pageTitle) pageTitle.textContent = `Hi, ${firstName}!`;
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
    
    // Notification button
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            const notificationContainer = document.getElementById('notificationContainer');
            if (notificationContainer && notificationContainer.children.length > 0) {
                // Scroll to notification container
                notificationContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                showNotification('No Notifications', 'You have no active notifications at this time.', 'info', 3000);
            }
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
    
    // Check user role
    const user = state.user || JSON.parse(localStorage.getItem('user'));
    const isStudent = user?.role === 'student';
    
    // Student view-only mode or full control for teachers/admins
    const cameraControlsHTML = isStudent ? '' : `
        <button class="btn btn-primary" id="startCameraBtn" style="padding: 12px 24px; font-size: 16px;">
            <i data-lucide="play"></i>
            Start Camera
        </button>
    `;
    
    const stopButtonHTML = isStudent ? '' : `
        <button id="stopCameraBtn" class="btn btn-danger" style="background: #ef4444; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4); display: flex; align-items: center; gap: 8px; font-size: 14px; padding: 10px 20px;">
            <i data-lucide="square" style="width: 16px; height: 16px;"></i>
            Stop Camera
        </button>
    `;
    
    const viewModeMessage = isStudent ? `
        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
            <i data-lucide="eye" style="width: 20px; height: 20px; color: #3b82f6;"></i>
            <span style="color: #3b82f6; font-size: 14px; font-weight: 500;">View-Only Mode: You can watch the live detection but cannot control the camera</span>
        </div>
    ` : '';
    
    mainContent.innerHTML = `
        ${viewModeMessage}
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
            <div style="background: #1f2937; border-radius: 12px; position: relative; overflow: hidden; aspect-ratio: 16/9; width: 100%; display: flex; align-items: center; justify-content: center; margin-top: 16px;" id="cameraFeedContainer">
                <div id="cameraPlaceholder" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 16px; padding: 20px;">
                    <i data-lucide="camera" style="width: 64px; height: 64px; color: #6b7280;"></i>
                    <p style="color: #9ca3af; font-size: 16px; text-align: center;" id="cameraStatusText">${isStudent ? 'Waiting for teacher to start camera...' : 'Camera feed will be displayed here'}</p>
                    ${cameraControlsHTML}
                </div>
                <!-- Detection badge (hidden by default) -->
                <div id="detectionBadge" style="position: absolute; top: 12px; left: 12px; padding: 8px 14px; background: rgba(16, 185, 129, 0.95); color: white; border-radius: 8px; font-size: 13px; font-weight: 600; display: none; align-items: center; gap: 8px; backdrop-filter: blur(8px);">
                    <i data-lucide="user-check" style="width: 14px; height: 14px;"></i>
                    <span id="studentsDetectedBadge">0</span> Students Detected
                </div>
                <!-- Camera controls (hidden by default) -->
                <div id="cameraControls" style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: none; gap: 12px; z-index: 10;">
                    ${stopButtonHTML}
                </div>
                <!-- Exit fullscreen button (hidden by default) -->
                <button id="exitFullscreenBtn" style="position: absolute; top: 12px; right: 12px; background: rgba(0, 0, 0, 0.8); color: white; border: none; border-radius: 8px; padding: 10px 16px; cursor: pointer; display: none; z-index: 10; align-items: center; gap: 8px; font-size: 14px; backdrop-filter: blur(8px);">
                    <i data-lucide="minimize-2" style="width: 16px; height: 16px;"></i>
                    Exit Fullscreen
                </button>
            </div>
        </div>
    `;
    
    lucide.createIcons();
    
    // Initialize camera controls (only for non-students)
    if (!isStudent) {
        initCameraButton();
    } else {
        // For students, continuously check if camera is running
        startCameraStatusPolling();
    }
    
    initFullscreenButton();
    
    // Check if camera is running on backend and restore state
    checkCameraBackendStatus();
    
    // Initialize emotion chart for camera monitor
    initEmotionChart();
    
    // Fetch initial data
    fetchDashboardStats();
    
    // Update stats every 5 seconds
    setInterval(fetchDashboardStats, 5000);
    
    // Update emotion data every 2 seconds when camera is active
    setInterval(() => {
        const isCameraActive = cameraActive || localStorage.getItem('cameraActive') === 'true';
        if (isCameraActive) {
            fetchEmotionData();
        }
    }, 2000);
}

// Camera status polling for students (view-only mode)
let cameraStatusPollingInterval = null;

function startCameraStatusPolling() {
    console.log('[Student Mode] Starting camera status polling...');
    
    // Poll every 3 seconds to check if camera has started or stopped
    cameraStatusPollingInterval = setInterval(async () => {
        try {
            const response = await fetch('/api/camera/status');
            const data = await response.json();
            
            if (data.success && data.active) {
                // Camera is running
                if (!cameraActive) {
                    console.log('[Student Mode] Camera detected as active! Loading stream...');
                    displayCameraStreamForStudent();
                }
            } else {
                // Camera is not running
                if (cameraActive) {
                    console.log('[Student Mode] Camera stopped by teacher. Hiding stream...');
                    hideCameraStreamForStudent();
                }
            }
        } catch (error) {
            console.error('[Student Mode] Error checking camera status:', error);
        }
    }, 3000); // Check every 3 seconds
    
    // Also check immediately on page load
    setTimeout(async () => {
        try {
            const response = await fetch('/api/camera/status');
            const data = await response.json();
            if (data.success && data.active) {
                console.log('[Student Mode] Camera already active on page load!');
                displayCameraStreamForStudent();
            }
        } catch (error) {
            console.error('[Student Mode] Error on initial check:', error);
        }
    }, 500);
}

function displayCameraStreamForStudent() {
    const cameraPlaceholder = document.getElementById('cameraPlaceholder');
    const detectionBadge = document.getElementById('detectionBadge');
    const statusBadge = document.getElementById('cameraStatusBadge');
    const cameraFeedContainer = document.getElementById('cameraFeedContainer');
    
    if (!cameraFeedContainer) {
        console.warn('[Student Mode] Camera feed container not found');
        return;
    }
    
    console.log('[Student Mode] Displaying camera stream...');
    
    // Mark camera as active
    cameraActive = true;
    localStorage.setItem('cameraActive', 'true');
    
    // Hide placeholder
    if (cameraPlaceholder) {
        cameraPlaceholder.style.display = 'none';
    }
    
    // Create and display video stream
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
    
    // Show detection badge
    if (detectionBadge) {
        detectionBadge.style.display = 'flex';
    }
    
    // Update status badge
    if (statusBadge) {
        statusBadge.style.background = '#10b981';
        statusBadge.innerHTML = '<i data-lucide="video" style="width: 12px; height: 12px;"></i> Live';
    }
    
    lucide.createIcons();
    
    console.log('[Student Mode] Camera stream displayed successfully');
}

function hideCameraStreamForStudent() {
    const cameraPlaceholder = document.getElementById('cameraPlaceholder');
    const detectionBadge = document.getElementById('detectionBadge');
    const statusBadge = document.getElementById('cameraStatusBadge');
    const cameraFeedContainer = document.getElementById('cameraFeedContainer');
    const videoElement = document.getElementById('cameraVideoStream');
    
    console.log('[Student Mode] Hiding camera stream...');
    
    // Mark camera as inactive
    cameraActive = false;
    localStorage.setItem('cameraActive', 'false');
    
    // Remove video element
    if (videoElement) {
        videoElement.remove();
    }
    
    // Show placeholder
    if (cameraPlaceholder) {
        cameraPlaceholder.style.display = 'flex';
    }
    
    // Hide detection badge
    if (detectionBadge) {
        detectionBadge.style.display = 'none';
    }
    
    // Update status badge
    if (statusBadge) {
        statusBadge.style.background = '#6b7280';
        statusBadge.innerHTML = '<i data-lucide="video-off" style="width: 12px; height: 12px;"></i> Offline';
    }
    
    lucide.createIcons();
    
    console.log('[Student Mode] Camera stream hidden - waiting for teacher to start camera');
}

// Check if camera is running on backend and restore UI state
async function checkCameraBackendStatus() {
    try {
        const response = await fetch('/api/camera/status');
        const data = await response.json();
        
        if (data.success && data.active) {
            // Camera is running on backend, restore UI
            console.log('Camera is running on backend, restoring UI state');
            
            const cameraPlaceholder = document.getElementById('cameraPlaceholder');
            const detectionBadge = document.getElementById('detectionBadge');
            const cameraControls = document.getElementById('cameraControls');
            const statusBadge = document.getElementById('cameraStatusBadge');
            const cameraFeedContainer = document.getElementById('cameraFeedContainer');
            
            // Ensure camera container exists before proceeding
            if (!cameraFeedContainer) {
                console.warn('Camera feed container not found, skipping restoration');
                return;
            }
            
            // Auto-start camera detection - no manual start needed
            console.log('Auto-starting camera detection from backend stream');
            cameraActive = true;
            localStorage.setItem('cameraActive', 'true');
            
            // Hide placeholder
            if (cameraPlaceholder) {
                cameraPlaceholder.style.display = 'none';
            }
            
            // Create and display video stream
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
            videoElement.src = `/api/camera/stream?t=${Date.now()}`;
            videoElement.style.display = 'block';
            
            // Show detection badge and camera controls
            if (detectionBadge) {
                detectionBadge.style.display = 'flex';
            }
            
            if (cameraControls) {
                cameraControls.style.display = 'flex';
            }
            
            // Update status badge
            if (statusBadge) {
                statusBadge.style.background = '#10b981';
                statusBadge.innerHTML = '<i data-lucide="video" style="width: 12px; height: 12px;"></i> Live';
            }
            
            // Mark camera as active
            cameraActive = true;
            localStorage.setItem('cameraActive', 'true');
            
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error checking camera status:', error);
        // Don't throw error, just log it - camera might not be available
    }
}

// Fetch emotion data from backend
async function fetchEmotionData() {
    try {
        const response = await fetch('/api/emotions');
        const result = await response.json();
        
        if (result.success && result.data) {
            updateEmotionCharts(result.data);
        }
    } catch (error) {
        console.error('Error fetching emotion data:', error);
    }
}

// Update emotion charts with new data
function updateEmotionCharts(emotionData) {
    const hasData = emotionData && emotionData.total_faces > 0;
    
    // Update both dashboard and camera monitor emotion charts
    if (emotionChart && emotionData.emotion_percentages) {
        const percentages = emotionData.emotion_percentages;
        const data = [
            percentages.Happy || 0,
            percentages.Surprise || 0,
            percentages.Neutral || 0,
            percentages.Sad || 0,
            percentages.Angry || 0,
            percentages.Disgust || 0,
            percentages.Fear || 0
        ];
        
        // Use actual data if available, otherwise show equal placeholder
        emotionChart.data.datasets[0].data = hasData ? data : [1, 1, 1, 1, 1, 1, 1];
        emotionChart.options.plugins.tooltip.enabled = hasData;
        emotionChart.update('none'); // Update without animation for smoother real-time updates
        
        // Update legend with data values
        if (hasData) {
            const emotionColors = {
                'Happy': '#10b981',
                'Surprise': '#22d3ee',
                'Neutral': '#8b5cf6',
                'Sad': '#6b7280',
                'Angry': '#ef4444',
                'Disgust': '#f97316',
                'Fear': '#f59e0b'
            };
            const legendContainer = document.getElementById('emotionLegend');
            if (legendContainer) {
                const emotions = ['Happy', 'Surprise', 'Neutral', 'Sad', 'Angry', 'Disgust', 'Fear'];
                legendContainer.innerHTML = emotions.map((emotion, i) => `
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${emotionColors[emotion]};"></div>
                        <span style="font-size: 11px; color: var(--text-secondary);">${emotion}: ${Math.round(data[i])}%</span>
                    </div>
                `).join('');
            }
        }
    }
    
    if (emotionChartMini && emotionData.emotion_percentages) {
        const percentages = emotionData.emotion_percentages;
        const data = [
            percentages.Happy || 0,
            percentages.Surprise || 0,
            percentages.Neutral || 0,
            percentages.Sad || 0,
            percentages.Angry || 0,
            percentages.Disgust || 0,
            percentages.Fear || 0
        ];
        
        // Use actual data if available, otherwise show equal placeholder
        emotionChartMini.data.datasets[0].data = hasData ? data : [1, 1, 1, 1, 1, 1, 1];
        emotionChartMini.options.plugins.tooltip.enabled = hasData;
        emotionChartMini.update('none'); // Update without animation for smoother real-time updates
        
        // Update mini legend with data values
        if (hasData) {
            const emotionColors = {
                'Happy': '#10b981',
                'Surprise': '#22d3ee',
                'Neutral': '#8b5cf6',
                'Sad': '#6b7280',
                'Angry': '#ef4444',
                'Disgust': '#f97316',
                'Fear': '#f59e0b'
            };
            const legendContainer = document.getElementById('emotionLegendMini');
            if (legendContainer) {
                const emotions = ['Happy', 'Surprise', 'Neutral', 'Sad', 'Angry', 'Disgust', 'Fear'];
                legendContainer.innerHTML = emotions.map((emotion, i) => `
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: ${emotionColors[emotion]};"></div>
                        <span style="font-size: 9px; color: var(--text-secondary);">${emotion}: ${Math.round(data[i])}%</span>
                    </div>
                `).join('');
            }
        }
    }
}

function loadAnalytics() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
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
                        <p class="card-subtitle">High vs Low engagement levels within 30 minutes</p>
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
                        <p class="card-subtitle">Students detected within 30 minutes</p>
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
                                <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Occupancy</th>
                                <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Happy</th>
                                <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Surprise</th>
                                <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Neutral</th>
                                <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Sad</th>
                                <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Angry</th>
                                <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Disgust</th>
                                <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Fear</th>
                                <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Comfort Level</th>
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
        
        // Fetch emotion history for averaged emotion distribution
        const emotionHistoryResponse = await fetch('/api/emotions/history');
        const emotionHistory = await emotionHistoryResponse.json();
        
        // Update stat cards with real data
        updateAnalyticsStats(summary);
        
        // Fetch engagement trends (last 30 minutes)
        const minutes = 30;
        const trendsResponse = await fetch(`/api/analytics/engagement-trends?minutes=${minutes}`);
        const trendsData = await trendsResponse.json();
        
        // Initialize all charts with real data
        initAnalyticsEngagementChart(trendsData.data);
        initAnalyticsPresenceChart(trendsData.data);
        
        // Use emotion history averages instead of real-time data
        if (emotionHistory.success && emotionHistory.average_emotions) {
            initAnalyticsEmotionChart(emotionHistory.average_emotions);
        } else {
            initAnalyticsEmotionChart({});
        }
        
        await populateIoTTable();
        
        // Start continuous IoT data refresh every 10 seconds for synchronized logging
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
        
        // Auto-refresh analytics every 30 seconds
        setInterval(() => refreshAnalytics(30), 30000);
        
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
        
        // Auto-refresh every 15 seconds
        setInterval(async () => {
            const summaryResponse = await fetch('/api/analytics/summary');
            const summary = await summaryResponse.json();
            updateAnalyticsStats(summary);
            
            // Refresh emotion chart with averaged history data
            const emotionHistoryResponse = await fetch('/api/emotions/history');
            const emotionHistory = await emotionHistoryResponse.json();
            if (emotionHistory.success && emotionHistory.average_emotions) {
                // Update the emotion chart with new averages
                const ctx = document.getElementById('analyticsEmotionChart');
                if (ctx && ctx.chart) {
                    const chart = Chart.getChart(ctx);
                    if (chart) {
                        const data = [
                            emotionHistory.average_emotions.Happy || 0,
                            emotionHistory.average_emotions.Surprise || 0,
                            emotionHistory.average_emotions.Neutral || 0,
                            emotionHistory.average_emotions.Sad || 0,
                            emotionHistory.average_emotions.Angry || 0,
                            emotionHistory.average_emotions.Disgust || 0,
                            emotionHistory.average_emotions.Fear || 0
                        ];
                        const hasData = data.some(val => val > 0);
                        chart.data.datasets[0].data = hasData ? data : [1, 1, 1, 1, 1, 1, 1];
                        chart.update();
                    }
                }
            }
        }, 15000);
        
    } catch (error) {
        console.error('Error initializing analytics:', error);
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

// Refresh analytics with 30-minute window
async function refreshAnalytics(minutes = 30) {
    try {
        const trendsResponse = await fetch(`/api/analytics/engagement-trends?minutes=${minutes}`);
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
            console.warn('No data available to export');
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
        
        console.log('Analytics data exported successfully!');
    } catch (error) {
        console.error('Error exporting analytics:', error);
        console.error('Failed to export analytics data');
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
            labels: data.map(d => d.time || new Date(d.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })),
            datasets: [
                {
                    label: 'High Engaged (Happy, Surprise, Neutral)',
                    data: data.map(d => d.highlyEngaged || 0),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3
                },
                {
                    label: 'Low Engaged (Fear, Sad, Disgust, Angry)',
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
    
    // Extract students detected data from the API response
    const hasStudentData = data && data.some(d => d.studentsPresent !== undefined && d.studentsPresent > 0);
    const currentStudents = hasStudentData ? data[data.length - 1].studentsPresent : 0;
    
    // Build presence data array - use studentsPresent from API data
    const studentData = data.map((d) => ({
        date: d.date,
        time: d.time,
        students: d.studentsPresent || 0
    }));
    
    const hasData = studentData.some(d => d.students > 0);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: studentData.map(d => d.time || new Date(d.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })),
            datasets: [{
                label: 'Students Present (YOLO Detection)',
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
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    enabled: hasData,
                    callbacks: {
                        label: function(context) {
                            return hasData ? `Students Detected: ${context.parsed.y}` : 'No data available';
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
                        stepSize: 5,
                        callback: function(value) {
                            return hasData ? value : '';
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
                        padding: 15,
                        font: {
                            size: 12
                        },
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
                            const value = hasData ? context.parsed : 0;
                            return hasData ? `${context.label}: ${Math.round(value)}%` : `${context.label}: N/A`;
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
                    <td colspan="15" style="padding: 40px; text-align: center; color: var(--text-secondary);">
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
            
            const getComfortLevel = (score) => {
                if (score >= 80) return { level: 'Optimal', color: '#10b981' };
                if (score >= 60) return { level: 'Acceptable', color: '#f59e0b' };
                if (score >= 40) return { level: 'Poor', color: '#ef4444' };
                return { level: 'Critical', color: '#dc2626' };
            };
            
            const envScore = row.environmental_score || 0;
            const comfort = getComfortLevel(envScore);
            const occupancy = row.occupancy !== undefined ? row.occupancy : 'N/A';
            // Display emotion COUNTS (not percentages) - each is an integer representing number of faces
            const happy = row.happy !== undefined ? row.happy : 'N/A';
            const surprise = row.surprise !== undefined ? row.surprise : 'N/A';
            const neutral = row.neutral !== undefined ? row.neutral : 'N/A';
            const sad = row.sad !== undefined ? row.sad : 'N/A';
            const angry = row.angry !== undefined ? row.angry : 'N/A';
            const disgust = row.disgust !== undefined ? row.disgust : 'N/A';
            const fear = row.fear !== undefined ? row.fear : 'N/A';
            
            return `
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 10px; font-size: 13px;">${dateStr} ${timeStr}</td>
                    <td style="padding: 10px; text-align: center; font-size: 13px; font-weight: 600;">${row.temperature}°C</td>
                    <td style="padding: 10px; text-align: center; font-size: 13px; font-weight: 600;">${row.humidity}%</td>
                    <td style="padding: 10px; text-align: center; font-size: 13px; font-weight: 600;">${row.light}</td>
                    <td style="padding: 10px; text-align: center; font-size: 13px;">${row.sound}</td>
                    <td style="padding: 10px; text-align: center; font-size: 13px;">${row.gas}</td>
                    <td style="padding: 10px; text-align: center; font-size: 13px; font-weight: 600; color: #3b82f6;">${occupancy}</td>
                    <td style="padding: 10px; text-align: center; font-size: 12px; color: #10b981;">${happy}</td>
                    <td style="padding: 10px; text-align: center; font-size: 12px; color: #22d3ee;">${surprise}</td>
                    <td style="padding: 10px; text-align: center; font-size: 12px; color: #8b5cf6;">${neutral}</td>
                    <td style="padding: 10px; text-align: center; font-size: 12px; color: #6b7280;">${sad}</td>
                    <td style="padding: 10px; text-align: center; font-size: 12px; color: #ef4444;">${angry}</td>
                    <td style="padding: 10px; text-align: center; font-size: 12px; color: #f97316;">${disgust}</td>
                    <td style="padding: 10px; text-align: center; font-size: 12px; color: #f59e0b;">${fear}</td>
                    <td style="padding: 10px; text-align: center;">
                        <span class="badge" style="background: ${comfort.color};">${comfort.level}</span>
                    </td>
                </tr>
            `;
        }).join('');
        
        lucide.createIcons();
    } catch (error) {
        console.error('Error fetching IoT data:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="15" style="padding: 40px; text-align: center; color: var(--text-secondary);">
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
            console.warn('No IoT data available to export');
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
        
        console.log('IoT data exported successfully!');
    } catch (error) {
        console.error('Error exporting IoT data:', error);
        console.error('Failed to export IoT data');
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
                
                // Show success notification
                showNotification(
                    'Logging Stopped',
                    `Database logging stopped. ${result.record_count} records saved.`,
                    'success',
                    4000
                );
                console.log(`Stopped logging: ${result.record_count} records saved`);
            } else {
                // Show error notification
                showNotification(
                    'Error',
                    result.message || 'Failed to stop logging',
                    'error',
                    4000
                );
                console.error(result.message || 'Failed to stop logging');
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
                
                // Show success notification
                showNotification(
                    'Logging Started',
                    'Database logging has started successfully',
                    'success',
                    4000
                );
                console.log('Database logging started');
            } else {
                // Show error notification
                showNotification(
                    'Error',
                    result.message || 'Failed to start logging',
                    'error',
                    4000
                );
                console.error(result.message || 'Failed to start logging');
            }
        }
        
        lucide.createIcons();
    } catch (error) {
        // Show error notification
        showNotification(
            'Error',
            'An error occurred while toggling IoT logging',
            'error',
            4000
        );
        console.error('Error toggling IoT logging:', error);
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
            console.error(error.message || 'Failed to export');
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
        
        console.log('CSV exported successfully');
    } catch (error) {
        console.error('Error exporting IoT data:', error);
    }
}

/* ===================================
   NOTIFICATION SYSTEM
   =================================== */

/**
 * Display a notification to the user
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type: 'success', 'error', 'info', 'warning'
 * @param {number} duration - Duration in ms before auto-dismiss (0 = no auto-dismiss)
 */
function showNotification(title, message, type = 'info', duration = 4000) {
    const container = document.getElementById('notificationContainer');
    
    if (!container) {
        console.error('Notification container not found');
        return;
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Icon based on type
    const iconMap = {
        success: 'check-circle',
        error: 'alert-circle',
        info: 'info',
        warning: 'alert-triangle'
    };
    
    const icon = iconMap[type] || 'info';
    
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <i data-lucide="${icon}"></i>
            </div>
            <div class="notification-text">
                <div class="notification-title">${escapeHtml(title)}</div>
                <div class="notification-message">${escapeHtml(message)}</div>
            </div>
            <button class="notification-close" aria-label="Close notification">
                <i data-lucide="x"></i>
            </button>
        </div>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Re-render Lucide icons
    lucide.createIcons();
    
    // Close button handler
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        removeNotification(notification);
    });
    
    // Auto-dismiss if duration specified
    if (duration > 0) {
        setTimeout(() => {
            removeNotification(notification);
        }, duration);
    }
    
    return notification;
}

/**
 * Remove a notification with animation
 * @param {HTMLElement} notification - The notification element to remove
 */
function removeNotification(notification) {
    notification.classList.add('removing');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300); // Match slideOut animation duration
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}