// Smart Classroom Notification System
// Displays alerts based on real sensor data and predictions
// Prevents spam with 1-minute cooldown per alert type

let lastAlertCheck = 0;
const ALERT_CHECK_INTERVAL = 60000; // 1 minute in milliseconds
let shownAlerts = new Set(); // Track shown alerts to prevent duplicates

// Start notification monitoring
function startNotificationMonitoring() {
    // Check alerts every 1 minute
    setInterval(checkAndShowAlerts, ALERT_CHECK_INTERVAL);
    
    // Initial check after 5 seconds
    setTimeout(checkAndShowAlerts, 5000);
    
    console.log('Notification monitoring started (1-minute intervals)');
}

// Check for alerts and show notifications
async function checkAndShowAlerts() {
    const currentTime = Date.now();
    
    // Skip if checked too recently (prevent spam)
    if (currentTime - lastAlertCheck < ALERT_CHECK_INTERVAL) {
        return;
    }
    
    lastAlertCheck = currentTime;
    
    try {
        const response = await fetch('/api/alerts');
        const alerts = await response.json();
        
        if (Array.isArray(alerts) && alerts.length > 0) {
            alerts.forEach(alert => {
                // Check if we've already shown this alert type recently
                const alertKey = `${alert.id}_${alert.type}`;
                
                if (!shownAlerts.has(alertKey)) {
                    showNotification(alert);
                    shownAlerts.add(alertKey);
                    
                    // Remove from shown alerts after 2 minutes (allows re-alerting if condition persists)
                    setTimeout(() => {
                        shownAlerts.delete(alertKey);
                    }, 120000);
                }
            });
        }
    } catch (error) {
        console.error('Error checking alerts:', error);
    }
}

// Show notification toast
function showNotification(alert) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${alert.type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i data-lucide="${getAlertIcon(alert.type)}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${alert.title}</div>
            <div class="notification-message">${alert.message}</div>
            <div class="notification-time">${formatAlertTime(alert.timestamp)}</div>
        </div>
        <button class="notification-close" onclick="closeNotification(this)">
            <i data-lucide="x"></i>
        </button>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Reinitialize icons
    lucide.createIcons();
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.add('notification-fade-out');
            setTimeout(() => notification.remove(), 300);
        }
    }, 10000);
    
    // Play sound (optional)
    playNotificationSound(alert.type);
}

// Close notification
function closeNotification(button) {
    const notification = button.closest('.notification');
    if (notification) {
        notification.classList.add('notification-fade-out');
        setTimeout(() => notification.remove(), 300);
    }
}

// Get icon based on alert type
function getAlertIcon(type) {
    switch (type) {
        case 'warning': return 'alert-triangle';
        case 'error': return 'alert-circle';
        case 'success': return 'check-circle';
        case 'info': return 'info';
        default: return 'bell';
    }
}

// Format alert timestamp
function formatAlertTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Play notification sound (optional, can be muted in settings)
function playNotificationSound(type) {
    // Only play for warning and error alerts
    if (type === 'warning' || type === 'error') {
        const audio = new Audio('data:audio/wav;base64,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');
        audio.volume = 0.3;
        audio.play().catch(() => {
            // Ignore autoplay errors
        });
    }
}

// Add CSS for notifications if not already present
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        .notification-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        }
        
        .notification {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            padding: 16px;
            margin-bottom: 12px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            animation: slideIn 0.3s ease-out;
            border-left: 4px solid;
        }
        
        .notification-warning {
            border-left-color: #f59e0b;
        }
        
        .notification-error {
            border-left-color: #ef4444;
        }
        
        .notification-info {
            border-left-color: #3b82f6;
        }
        
        .notification-success {
            border-left-color: #10b981;
        }
        
        .notification-icon {
            flex-shrink: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .notification-warning .notification-icon {
            color: #f59e0b;
        }
        
        .notification-error .notification-icon {
            color: #ef4444;
        }
        
        .notification-info .notification-icon {
            color: #3b82f6;
        }
        
        .notification-success .notification-icon {
            color: #10b981;
        }
        
        .notification-content {
            flex: 1;
        }
        
        .notification-title {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 4px;
            color: var(--text-primary);
        }
        
        .notification-message {
            font-size: 13px;
            color: var(--text-secondary);
            margin-bottom: 4px;
        }
        
        .notification-time {
            font-size: 11px;
            color: var(--text-tertiary);
        }
        
        .notification-close {
            flex-shrink: 0;
            width: 20px;
            height: 20px;
            border: none;
            background: none;
            cursor: pointer;
            opacity: 0.5;
            transition: opacity 0.2s;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .notification-close:hover {
            opacity: 1;
        }
        
        .notification-fade-out {
            animation: fadeOut 0.3s ease-out forwards;
        }
        
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
        
        @keyframes fadeOut {
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
    document.head.appendChild(style);
}

// Auto-start notification monitoring when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startNotificationMonitoring);
} else {
    startNotificationMonitoring();
}
