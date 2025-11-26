// Analytics Real-Time DataPatch
// This file patches the refreshAnalyticsCharts function to use real-time CV data

// Analytics data history buffers (for real-time charts like dashboard)
window.analyticsEngagementHistory = [];
window.analyticsPresenceHistory = [];

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

            // Build engagement chart data with timestamps
            const engagementData = window.analyticsEngagementHistory.map((item) => ({
                date: item.timestamp.toISOString(),
                highlyEngaged: item.high,
                disengaged: item.low,
                dataPoints: 1
            }));

            // Build presence chart data with timestamps
            const presenceData = window.analyticsPresenceHistory.map((item) => ({
                date: item.timestamp.toISOString(),
                studentsPresent: item.students,
                avgStudents: item.students,
                dataPoints: 1
            }));

            // Update or initialize engagement chart
            if (window.analyticsEngagementChart) {
                updateAnalyticsEngagementChart(engagementData);
            } else if (typeof initAnalyticsEngagementChart === 'function') {
                initAnalyticsEngagementChart(engagementData);
            }

            // Update or initialize presence chart
            if (window.analyticsPresenceChart) {
                updateAnalyticsPresenceChart(presenceData);
            } else if (typeof initAnalyticsPresenceChart === 'function') {
                initAnalyticsPresenceChart(presenceData);
            }

            console.log(`✓ Analytics updated with real-time CV data (${totalStudents} students, ${highCount} highly engaged, ${lowCount} disengaged)`);
        }

    } catch (error) {
        console.error('Error refreshing analytics:', error);
    }
};

console.log('✓ Analytics real-time CV data patch loaded successfully');
