// Analytics Real-Time Data Patch
// This file patches the refreshAnalyticsCharts function to use real-time CV data
// for the Classroom Presence and Student Engagement charts

// Analytics data history buffers (for real-time charts)
window.analyticsEngagementHistory = [];
window.analyticsPresenceHistory = [];

// Store the original refreshAnalyticsCharts function
const originalRefreshAnalyticsCharts = window.refreshAnalyticsCharts;

// Override refreshAnalyticsCharts to use real-time CV data
window.refreshAnalyticsCharts = async function () {
    try {
        // Fetch real-time CV emotion data (same API as dashboard uses)
        const emotionsResponse = await fetch('/api/emotions');
        const emotionsResult = await emotionsResponse.json();

        if (emotionsResult.success && emotionsResult.data) {
            const data = emotionsResult.data;
            const engagementSummary = data.engagement_summary || {};

            // Get counts (number of students in each engagement level)
            const highCount = engagementSummary.high_engaged_count || 0;
            const lowCount = engagementSummary.low_engaged_count || 0;
            const totalStudents = engagementSummary.total_faces || 0;

            // Add to engagement history buffer
            window.analyticsEngagementHistory.push({
                timestamp: new Date(),
                high: highCount,
                low: lowCount
            });

            // Add to presence history buffer
            window.analyticsPresenceHistory.push({
                timestamp: new Date(),
                students: totalStudents
            });

            // Keep only last 30 data points for analytics
            if (window.analyticsEngagementHistory.length > 30) {
                window.analyticsEngagementHistory.shift();
            }
            if (window.analyticsPresenceHistory.length > 30) {
                window.analyticsPresenceHistory.shift();
            }

            // Update engagement chart if it exists
            if (window.analyticsEngagementChart) {
                // Filter to only show data points with actual data
                const filteredEngagement = window.analyticsEngagementHistory.filter(
                    item => item.high > 0 || item.low > 0
                );
                const hasEngagementData = filteredEngagement.length > 0;
                const engagementDataToShow = hasEngagementData 
                    ? filteredEngagement 
                    : window.analyticsEngagementHistory;
                
                // Update chart labels and data
                window.analyticsEngagementChart.data.labels = engagementDataToShow.map(item =>
                    item.timestamp.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit' 
                    })
                );
                window.analyticsEngagementChart.data.datasets[0].data = engagementDataToShow.map(item => item.high);
                window.analyticsEngagementChart.data.datasets[1].data = engagementDataToShow.map(item => item.low);
                window.analyticsEngagementChart.options.plugins.tooltip.enabled = hasEngagementData;
                window.analyticsEngagementChart.update('none');
            }

            // Update presence chart if it exists
            if (window.analyticsPresenceChart) {
                // Filter to only show data points with students detected
                const filteredPresence = window.analyticsPresenceHistory.filter(
                    item => item.students > 0
                );
                const hasPresenceData = filteredPresence.length > 0;
                const presenceDataToShow = hasPresenceData 
                    ? filteredPresence 
                    : window.analyticsPresenceHistory;
                
                // Update chart labels and data
                window.analyticsPresenceChart.data.labels = presenceDataToShow.map(item =>
                    item.timestamp.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit' 
                    })
                );
                window.analyticsPresenceChart.data.datasets[0].data = presenceDataToShow.map(item => item.students);
                window.analyticsPresenceChart.options.plugins.tooltip.enabled = hasPresenceData;
                window.analyticsPresenceChart.update('none');
            }

            if (totalStudents > 0 || highCount > 0 || lowCount > 0) {
                console.log(`✓ Analytics updated with real-time CV data (${totalStudents} students, ${highCount} highly engaged, ${lowCount} disengaged)`);
            }
        }

    } catch (error) {
        console.error('Error refreshing analytics with real-time data:', error);
        // Fall back to original function if available
        if (typeof originalRefreshAnalyticsCharts === 'function') {
            return originalRefreshAnalyticsCharts();
        }
    }
};

console.log('✓ Analytics real-time CV data patch loaded successfully');
