# Data Directory

This directory contains training data for the LSTM engagement prediction model.

## Directory Structure

```
data/
├── training/          # Training data (70% of total)
│   └── class_YYYY-MM-DD.csv
├── validation/        # Validation data (15% of total)
│   └── class_YYYY-MM-DD.csv
├── test/             # Test data (15% of total)
│   └── class_YYYY-MM-DD.csv
├── X_train.npy       # Preprocessed training sequences (generated)
├── y_train.npy       # Training labels (generated)
├── X_val.npy         # Preprocessed validation sequences (generated)
└── y_val.npy         # Validation labels (generated)
```

## Data Format

Each CSV file should contain the following columns:

| Column | Type | Description | Range |
|--------|------|-------------|-------|
| timestamp | datetime | When the observation was recorded | ISO format |
| attention | float | Attention level | 0-100 |
| engagement | float | Engagement level | 0-100 |
| engaged | int | Number of engaged students | 0-50 |
| confused | int | Number of confused students | 0-50 |
| frustrated | int | Number of frustrated students | 0-50 |
| drowsy | int | Number of drowsy students | 0-50 |
| bored | int | Number of bored students | 0-50 |
| looking_away | int | Number of students looking away | 0-50 |
| student_count | int | Total students present | 0-50 |
| environmental_score | float | Classroom environment quality | 0-100 |

## Getting Started

### Option 1: Generate Sample Data (for testing)

```bash
cd ../training_scripts
python generate_sample_data.py
```

This will create 30 synthetic class sessions:
- 21 training sessions
- 4 validation sessions
- 5 test sessions

### Option 2: Use Real Data (for production)

1. **Collect data** from actual class sessions using the camera system
2. **Export data** in the CSV format specified above
3. **Place files** in the appropriate folders:
   - Most files (70%) → `training/`
   - Some files (15%) → `validation/`
   - Remaining files (15%) → `test/`

### Data Collection Tips

✅ **Best Practices:**
- Collect at least 20 real class sessions
- Include different times of day
- Include different class types (lecture, lab, discussion)
- Record observations every 1-2 minutes
- Ensure consistent student count within each session

❌ **Avoid:**
- Mixing data from different class sizes without normalization
- Inconsistent time intervals
- Incomplete sessions
- Missing columns

## Next Steps

After adding data:

1. **Prepare data for training:**
   ```bash
   cd ../training_scripts
   python prepare_data.py
   ```

2. **Train the model:**
   ```bash
   python train_lstm.py
   ```

3. **Verify model was created:**
   ```bash
   ls ../static/model/lstm_classroom_model.h5
   ```

## File Size Guidelines

- Each CSV file: ~50-200 KB (depending on session length)
- Total dataset size: 5-20 MB typical
- Preprocessed .npy files: 10-50 MB (generated automatically)

## Data Privacy

⚠️ **Important:** This data should:
- Be anonymized (no student names or IDs)
- Not include any personally identifiable information
- Be stored securely with appropriate access controls
- Comply with your institution's data policies

## Troubleshooting

**Issue: "No files found in training/"**
- Solution: Run `generate_sample_data.py` or add real CSV files

**Issue: "Missing column 'engagement'"**
- Solution: Ensure all CSV files have all required columns

**Issue: "Data preprocessing failed"**
- Solution: Check that CSV files are in correct format with valid data

## More Information

See `LSTM_TRAINING_GUIDE.md` in the project root for complete training documentation.
