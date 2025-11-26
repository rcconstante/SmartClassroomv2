"""
Analytics Database Module
Tracks engagement trends and classroom presence over time
"""

import sqlite3
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import threading


class AnalyticsDatabase:
    """
    SQLite database for storing classroom analytics data
    - Engagement trends (high/low engagement counts)
    - Classroom presence (student count over time)
    """
    
    def __init__(self, db_file: str = 'data/analytics.db'):
        self.db_file = db_file
        self.connection = None
        self.lock = threading.Lock()
        self._ensure_database_exists()
    
    def _ensure_database_exists(self):
        """Create database and tables if they don't exist"""
        # Create data directory if it doesn't exist
        os.makedirs(os.path.dirname(self.db_file), exist_ok=True)
        
        # Connect to database
        self.connection = sqlite3.connect(self.db_file, check_same_thread=False)
        self.connection.row_factory = sqlite3.Row
        cursor = self.connection.cursor()
        
        # Create engagement_data table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS engagement_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP NOT NULL,
                date DATE NOT NULL,
                high_engagement INTEGER DEFAULT 0,
                low_engagement INTEGER DEFAULT 0,
                students_detected INTEGER DEFAULT 0,
                happy_count INTEGER DEFAULT 0,
                surprise_count INTEGER DEFAULT 0,
                neutral_count INTEGER DEFAULT 0,
                sad_count INTEGER DEFAULT 0,
                angry_count INTEGER DEFAULT 0,
                disgust_count INTEGER DEFAULT 0,
                fear_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create presence_data table (for detailed tracking)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS presence_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP NOT NULL,
                date DATE NOT NULL,
                students_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create indexes for faster queries
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_engagement_date 
            ON engagement_data(date)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_engagement_timestamp 
            ON engagement_data(timestamp)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_presence_date 
            ON presence_data(date)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_presence_timestamp 
            ON presence_data(timestamp)
        ''')
        
        self.connection.commit()
        print(f"[Analytics DB] ✓ Database initialized: {self.db_file}")
    
    def log_engagement(self, high_engagement: int, low_engagement: int, 
                      students_detected: int, emotion_counts: Dict[str, int]):
        """
        Log engagement data point
        
        Args:
            high_engagement: Number of students with high engagement
            low_engagement: Number of students with low engagement
            students_detected: Total number of students detected
            emotion_counts: Dictionary with emotion counts (happy, sad, etc.)
        """
        with self.lock:
            try:
                cursor = self.connection.cursor()
                now = datetime.now()
                
                cursor.execute('''
                    INSERT INTO engagement_data 
                    (timestamp, date, high_engagement, low_engagement, students_detected,
                     happy_count, surprise_count, neutral_count, sad_count, 
                     angry_count, disgust_count, fear_count)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    now.isoformat(),
                    now.date().isoformat(),
                    high_engagement,
                    low_engagement,
                    students_detected,
                    emotion_counts.get('Happy', 0),
                    emotion_counts.get('Surprise', 0),
                    emotion_counts.get('Neutral', 0),
                    emotion_counts.get('Sad', 0),
                    emotion_counts.get('Angry', 0),
                    emotion_counts.get('Disgust', 0),
                    emotion_counts.get('Fear', 0)
                ))
                
                self.connection.commit()
                return True
            except Exception as e:
                print(f"[Analytics DB] ✗ Error logging engagement: {e}")
                return False
    
    def log_presence(self, students_count: int):
        """
        Log classroom presence data point
        
        Args:
            students_count: Number of students detected
        """
        with self.lock:
            try:
                cursor = self.connection.cursor()
                now = datetime.now()
                
                cursor.execute('''
                    INSERT INTO presence_data 
                    (timestamp, date, students_count)
                    VALUES (?, ?, ?)
                ''', (
                    now.isoformat(),
                    now.date().isoformat(),
                    students_count
                ))
                
                self.connection.commit()
                return True
            except Exception as e:
                print(f"[Analytics DB] ✗ Error logging presence: {e}")
                return False
    
    def get_engagement_trends(self, start_date: str = None, end_date: str = None, 
                             days: int = 7) -> List[Dict]:
        """
        Get engagement trends for date range
        
        Args:
            start_date: Start date (YYYY-MM-DD) or None for auto-calculate
            end_date: End date (YYYY-MM-DD) or None for today
            days: Number of days to retrieve if start_date is None
        
        Returns:
            List of daily engagement summaries
        """
        with self.lock:
            try:
                cursor = self.connection.cursor()
                
                # Calculate date range
                if end_date is None:
                    end_date = datetime.now().date().isoformat()
                
                if start_date is None:
                    start = datetime.strptime(end_date, '%Y-%m-%d') - timedelta(days=days-1)
                    start_date = start.date().isoformat()
                
                # Query daily aggregated data
                cursor.execute('''
                    SELECT 
                        date,
                        AVG(high_engagement) as avg_high_engagement,
                        AVG(low_engagement) as avg_low_engagement,
                        AVG(students_detected) as avg_students,
                        MAX(high_engagement) as max_high_engagement,
                        MAX(low_engagement) as max_low_engagement,
                        MAX(students_detected) as max_students,
                        COUNT(*) as reading_count
                    FROM engagement_data
                    WHERE date BETWEEN ? AND ?
                    GROUP BY date
                    ORDER BY date ASC
                ''', (start_date, end_date))
                
                results = cursor.fetchall()
                
                # Convert to list of dictionaries
                trends = []
                for row in results:
                    trends.append({
                        'date': row['date'],
                        'highlyEngaged': round(row['avg_high_engagement'] or 0),
                        'disengaged': round(row['avg_low_engagement'] or 0),
                        'studentsPresent': round(row['avg_students'] or 0),
                        'maxHighEngagement': row['max_high_engagement'] or 0,
                        'maxLowEngagement': row['max_low_engagement'] or 0,
                        'maxStudents': row['max_students'] or 0,
                        'dataPoints': row['reading_count']
                    })
                
                # Fill in missing dates with zeros
                all_dates = []
                current = datetime.strptime(start_date, '%Y-%m-%d')
                end = datetime.strptime(end_date, '%Y-%m-%d')
                
                while current <= end:
                    all_dates.append(current.date().isoformat())
                    current += timedelta(days=1)
                
                # Merge with actual data
                result_map = {t['date']: t for t in trends}
                filled_trends = []
                
                for date in all_dates:
                    if date in result_map:
                        filled_trends.append(result_map[date])
                    else:
                        filled_trends.append({
                            'date': date,
                            'highlyEngaged': 0,
                            'disengaged': 0,
                            'studentsPresent': 0,
                            'maxHighEngagement': 0,
                            'maxLowEngagement': 0,
                            'maxStudents': 0,
                            'dataPoints': 0
                        })
                
                return filled_trends
                
            except Exception as e:
                print(f"[Analytics DB] ✗ Error fetching engagement trends: {e}")
                return []
    
    def get_presence_trends(self, start_date: str = None, end_date: str = None,
                           days: int = 7) -> List[Dict]:
        """
        Get classroom presence trends for date range
        
        Args:
            start_date: Start date (YYYY-MM-DD) or None for auto-calculate
            end_date: End date (YYYY-MM-DD) or None for today
            days: Number of days to retrieve if start_date is None
        
        Returns:
            List of daily presence summaries
        """
        with self.lock:
            try:
                cursor = self.connection.cursor()
                
                # Calculate date range
                if end_date is None:
                    end_date = datetime.now().date().isoformat()
                
                if start_date is None:
                    start = datetime.strptime(end_date, '%Y-%m-%d') - timedelta(days=days-1)
                    start_date = start.date().isoformat()
                
                # Query daily aggregated data
                cursor.execute('''
                    SELECT 
                        date,
                        AVG(students_count) as avg_students,
                        MAX(students_count) as max_students,
                        MIN(students_count) as min_students,
                        COUNT(*) as reading_count
                    FROM presence_data
                    WHERE date BETWEEN ? AND ?
                    GROUP BY date
                    ORDER BY date ASC
                ''', (start_date, end_date))
                
                results = cursor.fetchall()
                
                # Convert to list of dictionaries
                trends = []
                for row in results:
                    trends.append({
                        'date': row['date'],
                        'avgStudents': round(row['avg_students'] or 0),
                        'maxStudents': row['max_students'] or 0,
                        'minStudents': row['min_students'] or 0,
                        'dataPoints': row['reading_count']
                    })
                
                # Fill in missing dates with zeros
                all_dates = []
                current = datetime.strptime(start_date, '%Y-%m-%d')
                end = datetime.strptime(end_date, '%Y-%m-%d')
                
                while current <= end:
                    all_dates.append(current.date().isoformat())
                    current += timedelta(days=1)
                
                # Merge with actual data
                result_map = {t['date']: t for t in trends}
                filled_trends = []
                
                for date in all_dates:
                    if date in result_map:
                        filled_trends.append(result_map[date])
                    else:
                        filled_trends.append({
                            'date': date,
                            'avgStudents': 0,
                            'maxStudents': 0,
                            'minStudents': 0,
                            'dataPoints': 0
                        })
                
                return filled_trends
                
            except Exception as e:
                print(f"[Analytics DB] ✗ Error fetching presence trends: {e}")
                return []
    
    def get_available_dates(self) -> List[str]:
        """Get list of all dates with recorded data"""
        with self.lock:
            try:
                cursor = self.connection.cursor()
                cursor.execute('''
                    SELECT DISTINCT date 
                    FROM engagement_data 
                    ORDER BY date DESC
                ''')
                
                results = cursor.fetchall()
                return [row['date'] for row in results]
            except Exception as e:
                print(f"[Analytics DB] ✗ Error fetching available dates: {e}")
                return []
    
    def get_stats_summary(self) -> Dict:
        """Get overall statistics summary"""
        with self.lock:
            try:
                cursor = self.connection.cursor()
                
                # Total engagement records
                cursor.execute('SELECT COUNT(*) as count FROM engagement_data')
                engagement_count = cursor.fetchone()['count']
                
                # Total presence records
                cursor.execute('SELECT COUNT(*) as count FROM presence_data')
                presence_count = cursor.fetchone()['count']
                
                # Date range
                cursor.execute('''
                    SELECT 
                        MIN(date) as first_date,
                        MAX(date) as last_date
                    FROM engagement_data
                ''')
                date_range = cursor.fetchone()
                
                return {
                    'total_engagement_records': engagement_count,
                    'total_presence_records': presence_count,
                    'first_date': date_range['first_date'],
                    'last_date': date_range['last_date'],
                    'database_file': self.db_file
                }
            except Exception as e:
                print(f"[Analytics DB] ✗ Error fetching stats summary: {e}")
                return {}
    
    def clear_old_data(self, days_to_keep: int = 90):
        """
        Clear data older than specified days
        
        Args:
            days_to_keep: Number of days to keep (default 90)
        """
        with self.lock:
            try:
                cursor = self.connection.cursor()
                cutoff_date = (datetime.now() - timedelta(days=days_to_keep)).date().isoformat()
                
                cursor.execute('DELETE FROM engagement_data WHERE date < ?', (cutoff_date,))
                engagement_deleted = cursor.rowcount
                
                cursor.execute('DELETE FROM presence_data WHERE date < ?', (cutoff_date,))
                presence_deleted = cursor.rowcount
                
                self.connection.commit()
                
                print(f"[Analytics DB] ✓ Cleared old data: {engagement_deleted} engagement, {presence_deleted} presence records")
                return True
            except Exception as e:
                print(f"[Analytics DB] ✗ Error clearing old data: {e}")
                return False
    
    def close(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            print("[Analytics DB] ✓ Connection closed")


# Global analytics database instance
_analytics_db = None

def get_analytics_db() -> AnalyticsDatabase:
    """Get or create global analytics database instance"""
    global _analytics_db
    if _analytics_db is None:
        _analytics_db = AnalyticsDatabase()
    return _analytics_db
