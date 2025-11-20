// Settings module

// Default settings
const defaultSettings = {
    darkMode: false,
    engagementThreshold: 50,
    temperature: 0,
    humidity: 0,
    lightLevel: 0,
    airQuality: 0,
    noiseLevel: 0,
    camera: 0,
    videoQuality: 'high'
};

// Global camera list
let availableCameras = [];

// Apply dark mode
function applyDarkMode(isDark) {
    if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
}

// Initialize settings including dark mode
document.addEventListener('DOMContentLoaded', () => {
    const settings = JSON.parse(localStorage.getItem('settings')) || defaultSettings;
    applyDarkMode(settings.darkMode);
});

// Detect available cameras
async function detectCameras() {
    try {
        // Suppress notifications during camera detection in settings
        const originalShowNotification = window.showNotification;
        window.showNotification = () => {}; // Temporarily disable notifications
        
        console.log('Detecting cameras...');
        const response = await fetch('/api/camera/detect');
        console.log('Camera detect response status:', response.status);
        const data = await response.json();
        console.log('Camera detect data:', data);
        
        // Restore notification function
        window.showNotification = originalShowNotification;
        
        if (data.success) {
            availableCameras = data.cameras;
            console.log('Found cameras:', data.cameras.length);
            return data.cameras;
        } else {
            console.error('Failed to detect cameras:', data.error);
            return [];
        }
    } catch (error) {
        // Restore notification function in case of error
        if (window.showNotification && window.showNotification.name === '') {
            window.showNotification = originalShowNotification;
        }
        console.error('Error detecting cameras:', error);
        console.error('Error details:', error.message);
        // Return empty array instead of failing
        return [];
    }
}

// Test camera
async function testCamera(cameraId) {
    try {
        const response = await fetch(`/api/camera/test/${cameraId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error testing camera:', error);
        return { success: false, error: error.message };
    }
}

// Load settings
async function loadSettings() {
    try {
        const settings = JSON.parse(localStorage.getItem('settings')) || defaultSettings;
        
        // Detect cameras first
        const cameras = await detectCameras();
    
    // Generate camera options
    const cameraOptions = cameras.length > 0 
        ? cameras.map(cam => `
            <option value="${cam.id}" ${settings.camera === cam.id ? 'selected' : ''}>
                Camera ${cam.id} ${cam.name ? `(${cam.name})` : ''} - ${cam.resolution}
            </option>
        `).join('')
        : '<option value="0">No cameras detected</option>';

    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="settings-container">
            <!-- Settings Header -->
            <div class="settings-header">
                <div>
                    <h2 class="settings-title">Settings</h2>
                    <p class="settings-subtitle">Manage your classroom preferences and configurations</p>
                </div>
            </div>

            <!-- Settings Grid -->
            <div class="settings-grid">
                <!-- General Settings Card -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <div class="settings-icon" style="background: rgba(16, 185, 129, 0.1);">
                            <i data-lucide="settings" style="color: #10b981;"></i>
                        </div>
                        <div>
                            <h3 class="settings-card-title">General Settings</h3>
                            <p class="settings-card-subtitle">Configure basic application preferences</p>
                        </div>
                    </div>
                    <div class="settings-card-body">
                        <!-- Dark Mode toggle removed from General Settings by request. Dark mode functions remain available programmatically. -->
                    </div>
                </div>

                <!-- Monitoring Settings Card -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <div class="settings-icon" style="background: rgba(59, 130, 246, 0.1);">
                            <i data-lucide="activity" style="color: #3b82f6;"></i>
                        </div>
                        <div>
                            <h3 class="settings-card-title">Monitoring Settings</h3>
                            <p class="settings-card-subtitle">Configure classroom monitoring thresholds</p>
                        </div>
                    </div>
                    <div class="settings-card-body">
                        <div class="setting-item">
                            <div class="setting-label-group">
                                <label class="setting-label">Engagement Alert Threshold</label>
                                <span class="setting-value" id="engagementValue">${settings.engagementThreshold}%</span>
                            </div>
                            <input 
                                type="range"
                                min="0"
                                max="100"
                                value="${settings.engagementThreshold}"
                                class="range-slider"
                                data-setting="engagementThreshold"
                                oninput="document.getElementById('engagementValue').textContent = this.value + '%'"
                            >
                            <div class="range-labels">
                                <span>0%</span>
                                <span>50%</span>
                                <span>100%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Environmental Settings Card -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <div class="settings-icon" style="background: rgba(245, 158, 11, 0.1);">
                            <i data-lucide="thermometer" style="color: #f59e0b;"></i>
                        </div>
                        <div>
                            <h3 class="settings-card-title">Environmental Settings</h3>
                            <p class="settings-card-subtitle">Set environmental alert thresholds</p>
                        </div>
                    </div>
                    <div class="settings-card-body">
                        <div class="input-grid">
                            <div class="input-group">
                                <label class="input-label">
                                    <i data-lucide="thermometer" style="width: 16px; height: 16px;"></i>
                                    Temperature (°C)
                                </label>
                                <input 
                                    type="number"
                                    value="${settings.temperature}"
                                    class="modern-input"
                                    data-setting="temperature"
                                    min="15"
                                    max="35"
                                >
                            </div>
                            <div class="input-group">
                                <label class="input-label">
                                    <i data-lucide="droplets" style="width: 16px; height: 16px;"></i>
                                    Humidity (%)
                                </label>
                                <input 
                                    type="number"
                                    value="${settings.humidity}"
                                    class="modern-input"
                                    data-setting="humidity"
                                    min="30"
                                    max="80"
                                >
                            </div>
                            <div class="input-group">
                                <label class="input-label">
                                    <i data-lucide="sun" style="width: 16px; height: 16px;"></i>
                                    Light Level (lux)
                                </label>
                                <input 
                                    type="number"
                                    value="${settings.lightLevel || 500}"
                                    class="modern-input"
                                    data-setting="lightLevel"
                                    min="0"
                                    max="1000"
                                >
                            </div>
                            <div class="input-group">
                                <label class="input-label">
                                    <i data-lucide="wind" style="width: 16px; height: 16px;"></i>
                                    Air Quality (AQI)
                                </label>
                                <input 
                                    type="number"
                                    value="${settings.airQuality || 100}"
                                    class="modern-input"
                                    data-setting="airQuality"
                                    min="0"
                                    max="500"
                                >
                            </div>
                            <div class="input-group">
                                <label class="input-label">
                                    <i data-lucide="volume-2" style="width: 16px; height: 16px;"></i>
                                    Noise Level (dB)
                                </label>
                                <input 
                                    type="number"
                                    value="${settings.noiseLevel || 50}"
                                    class="modern-input"
                                    data-setting="noiseLevel"
                                    min="0"
                                    max="100"
                                >
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Camera Settings Card -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <div class="settings-icon" style="background: rgba(139, 92, 246, 0.1);">
                            <i data-lucide="video" style="color: #8b5cf6;"></i>
                        </div>
                        <div>
                            <h3 class="settings-card-title">Camera & Video Settings</h3>
                            <p class="settings-card-subtitle">Configure camera and video quality</p>
                        </div>
                    </div>
                    <div class="settings-card-body">
                        <div class="input-group">
                            <label class="input-label">
                                <i data-lucide="camera" style="width: 16px; height: 16px;"></i>
                                Camera Selection
                            </label>
                            <select class="modern-select" data-setting="camera" id="cameraSelect">
                                ${cameraOptions}
                            </select>
                            <button class="btn btn-secondary" id="refreshCameras" style="margin-top: 8px;">
                                <i data-lucide="refresh-cw"></i>
                                Refresh Cameras
                            </button>
                            <button class="btn btn-secondary" id="testCamera" style="margin-top: 8px;">
                                <i data-lucide="play-circle"></i>
                                Test Selected Camera
                            </button>
                        </div>

                        <div class="input-group">
                            <label class="input-label">
                                <i data-lucide="monitor" style="width: 16px; height: 16px;"></i>
                                Video Quality
                            </label>
                            <select class="modern-select" data-setting="videoQuality">
                                <option value="high" ${settings.videoQuality === 'high' ? 'selected' : ''}>High (1080p)</option>
                                <option value="medium" ${settings.videoQuality === 'medium' ? 'selected' : ''}>Medium (720p)</option>
                                <option value="low" ${settings.videoQuality === 'low' ? 'selected' : ''}>Low (480p)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Save Button -->
            <div class="settings-footer">
                <button id="saveSettings" class="btn btn-primary">
                    <i data-lucide="save"></i>
                    Save Changes
                </button>
            </div>
        </div>
    `;

        // Reinitialize Lucide icons
        lucide.createIcons();

        // Initialize settings handlers
        initSettingsHandlers();
        
    } catch (error) {
        console.error('Error in loadSettings:', error);
        const mainContent = document.getElementById('mainContent');
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
                    <p style="margin-bottom: 8px;">Unable to load settings</p>
                    <p style="font-size: 14px; color: #6b7280;">${error.message}</p>
                    <button onclick="loadSettings()" class="btn btn-primary" style="margin-top: 20px;">
                        <i data-lucide="refresh-cw"></i>
                        Retry
                    </button>
                </div>
            </div>
        `;
        lucide.createIcons();
        throw error;
    }
}

// Create toggle setting
function createToggleSetting(key, label, description, checked) {
    return `
        <div class="flex items-center justify-between">
            <div>
                <label class="text-sm font-medium text-gray-700">${label}</label>
                <p class="text-sm text-gray-500">${description}</p>
            </div>
            <label class="toggle-switch">
                <input 
                    type="checkbox" 
                    ${checked ? 'checked' : ''} 
                    data-setting="${key}"
                >
                <span class="toggle-slider"></span>
            </label>
        </div>
    `;
}

// Create modern toggle setting
function createModernToggleSetting(key, label, description, checked, icon) {
    return `
        <div class="setting-item">
            <div class="setting-info">
                <div class="setting-icon-small">
                    <i data-lucide="${icon}"></i>
                </div>
                <div>
                    <div class="setting-label">${label}</div>
                    <div class="setting-description">${description}</div>
                </div>
            </div>
            <label class="toggle-switch">
                <input 
                    type="checkbox" 
                    ${checked ? 'checked' : ''} 
                    data-setting="${key}"
                >
                <span class="toggle-slider"></span>
            </label>
        </div>
    `;
}

// Initialize settings handlers
function initSettingsHandlers() {
    const settings = JSON.parse(localStorage.getItem('settings')) || defaultSettings;
    
    // Handle input changes
    document.querySelectorAll('[data-setting]').forEach(input => {
        input.addEventListener('change', (e) => {
            const key = e.target.dataset.setting;
            const value = e.target.type === 'checkbox' ? e.target.checked : 
                         e.target.type === 'number' ? parseFloat(e.target.value) :
                         isNaN(e.target.value) ? e.target.value : parseInt(e.target.value);
            
            // Apply dark mode immediately when toggled
            if (key === 'darkMode') {
                applyDarkMode(value);
            }
            settings[key] = value;
        });
    });
    
    // Handle refresh cameras button
    const refreshButton = document.getElementById('refreshCameras');
    if (refreshButton) {
        refreshButton.addEventListener('click', async () => {
            const icon = refreshButton.querySelector('i');
            icon.style.animation = 'spin 1s linear infinite';
            
            const cameras = await detectCameras();
            
            // Update camera select
            const cameraSelect = document.getElementById('cameraSelect');
            if (cameras.length > 0) {
                cameraSelect.innerHTML = cameras.map(cam => `
                    <option value="${cam.id}">
                        Camera ${cam.id} ${cam.name ? `(${cam.name})` : ''} - ${cam.resolution}
                    </option>
                `).join('');
            } else {
                cameraSelect.innerHTML = '<option value="0">No cameras detected</option>';
            }
            
            icon.style.animation = '';
        });
    }
    
    // Handle test camera button
    const testButton = document.getElementById('testCamera');
    if (testButton) {
        testButton.addEventListener('click', async () => {
            const cameraSelect = document.getElementById('cameraSelect');
            const cameraId = parseInt(cameraSelect.value);
            
            testButton.disabled = true;
            testButton.innerHTML = '<i data-lucide="loader"></i> Testing...';
            lucide.createIcons();
            
            const result = await testCamera(cameraId);
            
            if (result.success) {
                testButton.innerHTML = '<i data-lucide="check-circle"></i> Camera Works!';
                testButton.style.background = '#10b981';
            } else {
                testButton.innerHTML = '<i data-lucide="x-circle"></i> Test Failed';
                testButton.style.background = '#ef4444';
            }
            
            lucide.createIcons();
            
            setTimeout(() => {
                testButton.disabled = false;
                testButton.innerHTML = '<i data-lucide="play-circle"></i> Test Selected Camera';
                testButton.style.background = '';
                lucide.createIcons();
            }, 2000);
        });
    }

    // Handle save button
    const saveButton = document.getElementById('saveSettings');
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            // Collect all settings
            const newSettings = {...defaultSettings};
            document.querySelectorAll('[data-setting]').forEach(input => {
                const value = input.type === 'checkbox' ? input.checked : 
                             input.type === 'number' ? parseFloat(input.value) :
                             isNaN(input.value) ? input.value : parseInt(input.value);
                newSettings[input.dataset.setting] = value;
            });
            
            localStorage.setItem('settings', JSON.stringify(newSettings));
            
            // Show success state
            const icon = saveButton.querySelector('i');
            const originalHTML = saveButton.innerHTML;
            
            saveButton.innerHTML = '<i data-lucide="check"></i> Saved Successfully!';
            saveButton.style.background = '#10b981';
            lucide.createIcons();
            
            setTimeout(() => {
                saveButton.innerHTML = originalHTML;
                saveButton.style.background = '';
                lucide.createIcons();
            }, 2000);
        });
    }
}

// Add CSS for spin animation
if (!document.getElementById('settings-animations-style')) {
    const settingsAnimationStyle = document.createElement('style');
    settingsAnimationStyle.id = 'settings-animations-style';
    settingsAnimationStyle.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(settingsAnimationStyle);
}
