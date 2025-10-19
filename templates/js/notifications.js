// Notifications Module

// Sample notification data
const notifications = [
    {
        id: 1,
        type: 'success',
        icon: 'user-check',
        text: 'Student attendance marked successfully for CS101',
        time: '5 minutes ago',
        unread: true
    },
    {
        id: 2,
        type: 'warning',
        icon: 'alert-triangle',
        text: 'Low engagement detected in 3 students',
        time: '15 minutes ago',
        unread: true
    },
    {
        id: 3,
        type: 'info',
        icon: 'bell',
        text: 'New class scheduled for tomorrow at 2:00 PM',
        time: '1 hour ago',
        unread: true
    },
    {
        id: 4,
        type: 'error',
        icon: 'x-circle',
        text: 'Camera connection lost - please check',
        time: '2 hours ago',
        unread: false
    },
    {
        id: 5,
        type: 'success',
        icon: 'check-circle',
        text: 'Weekly report generated successfully',
        time: '3 hours ago',
        unread: false
    }
];

// Notification state
let notificationState = {
    notifications: [...notifications],
    unreadCount: notifications.filter(n => n.unread).length
};

// Initialize notifications
function initNotifications() {
    const notificationBtn = document.querySelector('.icon-button[title="Notifications"]');
    const notificationBadge = document.querySelector('.notification-badge');
    
    if (!notificationBtn) return;
    
    // Create notification dropdown
    const dropdown = createNotificationDropdown();
    document.querySelector('.content-header').appendChild(dropdown);
    
    // Update badge
    updateNotificationBadge();
    
    // Toggle dropdown
    notificationBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNotificationDropdown();
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
}

// Create notification dropdown HTML
function createNotificationDropdown() {
    const dropdown = document.createElement('div');
    dropdown.id = 'notificationDropdown';
    dropdown.className = 'notification-dropdown';
    dropdown.innerHTML = `
        <div class="notification-header">
            <span class="notification-title">Notifications</span>
            <button class="notification-clear" onclick="clearAllNotifications()">
                Clear All
            </button>
        </div>
        <div class="notification-list" id="notificationList">
            ${renderNotifications()}
        </div>
        <div class="notification-footer">
            <a href="#" class="notification-view-all" onclick="viewAllNotifications(event)">
                View All Notifications
            </a>
        </div>
    `;
    return dropdown;
}

// Render notifications
function renderNotifications() {
    if (notificationState.notifications.length === 0) {
        return `
            <div class="notification-empty">
                <i data-lucide="bell-off"></i>
                <p>No notifications</p>
            </div>
        `;
    }
    
    return notificationState.notifications.map(notification => `
        <div class="notification-item ${notification.unread ? 'unread' : ''}" 
             onclick="markAsRead(${notification.id})">
            <div class="notification-icon-wrapper ${notification.type}">
                <i data-lucide="${notification.icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-text">${notification.text}</div>
                <div class="notification-time">${notification.time}</div>
            </div>
        </div>
    `).join('');
}

// Toggle notification dropdown
function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
        if (dropdown.classList.contains('show')) {
            // Reinitialize icons
            lucide.createIcons();
        }
    }
}

// Update notification badge
function updateNotificationBadge() {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        badge.textContent = notificationState.unreadCount;
        badge.style.display = notificationState.unreadCount > 0 ? 'flex' : 'none';
    }
}

// Mark notification as read
function markAsRead(notificationId) {
    const notification = notificationState.notifications.find(n => n.id === notificationId);
    if (notification && notification.unread) {
        notification.unread = false;
        notificationState.unreadCount--;
        updateNotificationBadge();
        refreshNotificationList();
    }
}

// Clear all notifications
function clearAllNotifications() {
    notificationState.notifications = [];
    notificationState.unreadCount = 0;
    updateNotificationBadge();
    refreshNotificationList();
}

// Refresh notification list
function refreshNotificationList() {
    const list = document.getElementById('notificationList');
    if (list) {
        list.innerHTML = renderNotifications();
        lucide.createIcons();
    }
}

// View all notifications
function viewAllNotifications(event) {
    event.preventDefault();
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
    // Here you could navigate to a full notifications page
    alert('Full notifications page - Coming soon!');
}

// Add new notification (for simulating real-time)
function addNotification(type, icon, text) {
    const newNotification = {
        id: Date.now(),
        type: type,
        icon: icon,
        text: text,
        time: 'Just now',
        unread: true
    };
    
    notificationState.notifications.unshift(newNotification);
    notificationState.unreadCount++;
    updateNotificationBadge();
    refreshNotificationList();
    
    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('DLSUD Smart Classroom', {
            body: text,
            icon: '/static/images/dlsudlogo.png'
        });
    }
}

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted');
            }
        });
    }
}

// Simulate real-time notifications (for demo)
function simulateNotifications() {
    const messages = [
        { type: 'success', icon: 'check-circle', text: 'Student John Doe submitted assignment' },
        { type: 'warning', icon: 'alert-triangle', text: 'Room temperature rising above threshold' },
        { type: 'info', icon: 'info', text: 'New message from admin' },
        { type: 'error', icon: 'x-circle', text: 'Network connectivity issue detected' }
    ];
    
    // Add a random notification every 30 seconds (for demo)
    setInterval(() => {
        const random = messages[Math.floor(Math.random() * messages.length)];
        addNotification(random.type, random.icon, random.text);
    }, 30000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
        initNotifications();
        requestNotificationPermission();
        // Uncomment to enable simulated notifications
        // simulateNotifications();
    }, 100);
});
