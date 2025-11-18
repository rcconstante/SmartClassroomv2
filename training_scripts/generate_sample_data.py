"""
Sample Data Generator for LSTM Training
Generates synthetic classroom data for testing the training pipeline
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path

def generate_class_session(
    duration_minutes=90,
    interval_minutes=2,
    student_count=30,
    base_engagement=75,
    trend='stable'
):
    """
    Generate synthetic data for one class session
    
    Args:
        duration_minutes: Length of class
        interval_minutes: Time between observations
        student_count: Number of students
        base_engagement: Starting engagement level (0-100)
        trend: 'improving', 'declining', or 'stable'
    
    Returns:
        DataFrame with synthetic classroom data
    """
    
    num_observations = duration_minutes // interval_minutes
    timestamps = [
        datetime.now() + timedelta(minutes=i * interval_minutes)
        for i in range(num_observations)
    ]
    
    data = []
    current_engagement = base_engagement
    current_attention = base_engagement + 5
    
    # Set trend direction
    if trend == 'improving':
        trend_direction = 0.3
    elif trend == 'declining':
        trend_direction = -0.3
    else:
        trend_direction = 0
    
    for i, timestamp in enumerate(timestamps):
        # Simulate natural variation
        
        # Beginning of class: settling in
        if i < 3:
            modifier = -5
        # Middle of class: peak engagement
        elif 10 < i < 25:
            modifier = 8
        # End of class: fatigue
        elif i > 35:
            modifier = -10
        else:
            modifier = 0
        
        # Add trend
        current_engagement += trend_direction
        current_attention += trend_direction * 0.8
        
        # Add natural variation
        engagement = current_engagement + modifier + np.random.normal(0, 5)
        attention = current_attention + modifier + np.random.normal(0, 5)
        
        # Clamp values
        engagement = np.clip(engagement, 30, 95)
        attention = np.clip(attention, 30, 95)
        
        # Calculate state distribution based on engagement
        if engagement > 80:
            engaged_pct = 0.7 + np.random.uniform(-0.1, 0.1)
            confused_pct = 0.15 + np.random.uniform(-0.05, 0.05)
            frustrated_pct = 0.05 + np.random.uniform(-0.02, 0.02)
            drowsy_pct = 0.02 + np.random.uniform(-0.01, 0.01)
            bored_pct = 0.05 + np.random.uniform(-0.02, 0.02)
            looking_away_pct = 0.03 + np.random.uniform(-0.02, 0.02)
        elif engagement > 65:
            engaged_pct = 0.5 + np.random.uniform(-0.1, 0.1)
            confused_pct = 0.25 + np.random.uniform(-0.05, 0.05)
            frustrated_pct = 0.08 + np.random.uniform(-0.03, 0.03)
            drowsy_pct = 0.05 + np.random.uniform(-0.02, 0.02)
            bored_pct = 0.08 + np.random.uniform(-0.03, 0.03)
            looking_away_pct = 0.04 + np.random.uniform(-0.02, 0.02)
        else:
            engaged_pct = 0.3 + np.random.uniform(-0.1, 0.1)
            confused_pct = 0.2 + np.random.uniform(-0.05, 0.05)
            frustrated_pct = 0.15 + np.random.uniform(-0.05, 0.05)
            drowsy_pct = 0.1 + np.random.uniform(-0.03, 0.03)
            bored_pct = 0.15 + np.random.uniform(-0.05, 0.05)
            looking_away_pct = 0.1 + np.random.uniform(-0.03, 0.03)
        
        # Normalize to sum to 1
        total = (engaged_pct + confused_pct + frustrated_pct + 
                drowsy_pct + bored_pct + looking_away_pct)
        
        engaged_pct /= total
        confused_pct /= total
        frustrated_pct /= total
        drowsy_pct /= total
        bored_pct /= total
        looking_away_pct /= total
        
        # Convert to counts
        engaged = int(student_count * engaged_pct)
        confused = int(student_count * confused_pct)
        frustrated = int(student_count * frustrated_pct)
        drowsy = int(student_count * drowsy_pct)
        bored = int(student_count * bored_pct)
        looking_away = int(student_count * looking_away_pct)
        
        # Ensure total equals student count
        total_students = engaged + confused + frustrated + drowsy + bored + looking_away
        if total_students < student_count:
            engaged += (student_count - total_students)
        elif total_students > student_count:
            engaged -= (total_students - student_count)
        
        # Environmental score (temperature, lighting, etc.)
        env_score = 75 + np.random.normal(0, 10)
        env_score = np.clip(env_score, 50, 95)
        
        observation = {
            'timestamp': timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'attention': round(attention, 2),
            'engagement': round(engagement, 2),
            'engaged': engaged,
            'confused': confused,
            'frustrated': frustrated,
            'drowsy': drowsy,
            'bored': bored,
            'looking_away': looking_away,
            'student_count': student_count,
            'environmental_score': round(env_score, 2)
        }
        
        data.append(observation)
    
    return pd.DataFrame(data)

def generate_dataset(num_sessions=30):
    """
    Generate a complete dataset with multiple class sessions
    
    Args:
        num_sessions: Number of class sessions to generate
    """
    
    print(f"Generating {num_sessions} synthetic class sessions...")
    
    # Split into training, validation, and test sets
    num_train = int(num_sessions * 0.7)  # 70% training
    num_val = int(num_sessions * 0.15)   # 15% validation
    num_test = num_sessions - num_train - num_val  # 15% test
    
    # Generate training data
    print(f"Generating {num_train} training sessions...")
    for i in range(num_train):
        # Vary parameters for diversity
        student_count = np.random.randint(25, 35)
        base_engagement = np.random.randint(60, 85)
        trend = np.random.choice(['improving', 'declining', 'stable'], 
                                p=[0.3, 0.3, 0.4])
        
        df = generate_class_session(
            duration_minutes=90,
            interval_minutes=2,
            student_count=student_count,
            base_engagement=base_engagement,
            trend=trend
        )
        
        # Add some date variation
        date_offset = timedelta(days=i)
        session_date = (datetime.now() - timedelta(days=num_sessions) + date_offset)
        filename = f"class_{session_date.strftime('%Y-%m-%d')}.csv"
        
        output_path = Path('../data/training') / filename
        df.to_csv(output_path, index=False)
        
        if (i + 1) % 10 == 0:
            print(f"  ✓ Generated {i + 1}/{num_train} training sessions")
    
    # Generate validation data
    print(f"Generating {num_val} validation sessions...")
    for i in range(num_val):
        student_count = np.random.randint(25, 35)
        base_engagement = np.random.randint(60, 85)
        trend = np.random.choice(['improving', 'declining', 'stable'])
        
        df = generate_class_session(
            duration_minutes=90,
            interval_minutes=2,
            student_count=student_count,
            base_engagement=base_engagement,
            trend=trend
        )
        
        date_offset = timedelta(days=num_train + i)
        session_date = (datetime.now() - timedelta(days=num_sessions) + date_offset)
        filename = f"class_{session_date.strftime('%Y-%m-%d')}.csv"
        
        output_path = Path('../data/validation') / filename
        df.to_csv(output_path, index=False)
    
    print(f"  ✓ Generated {num_val} validation sessions")
    
    # Generate test data
    print(f"Generating {num_test} test sessions...")
    for i in range(num_test):
        student_count = np.random.randint(25, 35)
        base_engagement = np.random.randint(60, 85)
        trend = np.random.choice(['improving', 'declining', 'stable'])
        
        df = generate_class_session(
            duration_minutes=90,
            interval_minutes=2,
            student_count=student_count,
            base_engagement=base_engagement,
            trend=trend
        )
        
        date_offset = timedelta(days=num_train + num_val + i)
        session_date = (datetime.now() - timedelta(days=num_sessions) + date_offset)
        filename = f"class_{session_date.strftime('%Y-%m-%d')}.csv"
        
        output_path = Path('../data/test') / filename
        df.to_csv(output_path, index=False)
    
    print(f"  ✓ Generated {num_test} test sessions")
    
    print("\n✅ Dataset generation complete!")
    print(f"   Training: {num_train} sessions")
    print(f"   Validation: {num_val} sessions")
    print(f"   Test: {num_test} sessions")
    print(f"   Total: {num_sessions} sessions")

if __name__ == '__main__':
    # Generate sample dataset
    # Adjust num_sessions based on your needs
    generate_dataset(num_sessions=30)
    
    print("\n📝 Next steps:")
    print("   1. Run: python prepare_data.py")
    print("   2. Run: python train_lstm.py")
    print("   3. Check: ../static/model/lstm_classroom_model.h5")
