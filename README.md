# Smart Classroom

A modern web application for classroom monitoring and management with real-time engagement tracking, attendance monitoring, and environmental controls.

# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=development
FLASK_DEBUG=True

# Security
SECRET_KEY=your-secret-key-change-in-production

# Server Configuration
HOST=0.0.0.0
PORT=5000

## Features

- 📊 **Real-time student engagement monitoring** with AI-powered computer vision
- 🎯 **Engagement state detection** (Engaged, Confused, Frustrated, Drowsy, Bored, Looking Away)
- � **LSTM-based prediction** for engagement trend forecasting
- �📋 **Attendance tracking** and reporting
- 🌡️ **Environmental monitoring** (temperature, humidity, CO2)
- 👥 **Student management**
- 📈 **Analytics and reporting** with CSV export
- 🎥 **Dedicated camera monitor page** with full-screen view
- 🌙 **Dark mode support**
- ⚙️ **Customizable settings**

## Technology Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Tailwind CSS for styling
- Chart.js for data visualization
- Lucide Icons

### Backend
- Python 3.8+
- Flask web framework
- Flask-CORS for cross-origin requests

### AI/ML
- **TensorFlow/Keras** for deep learning models
- **OpenCV** for computer vision and face detection
- **Student Engagement Model** for real-time state classification
- **LSTM Model** for temporal pattern analysis and prediction

## Project Structure

```
SmartClassroom/
├── app.py                 # Flask backend application
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables
├── .gitignore            # Git ignore file
├── README.md             # Project documentation
├── index.html            # Main HTML file
├── css/
│   └── style.css         # Custom styles
├── js/
│   ├── app.js            # Main application logic
│   ├── auth.js           # Authentication logic
│   ├── dashboard.js      # Dashboard functionality
│   └── settings.js       # Settings management
└── assets/               # Static assets (images, etc.)
```

## Setup Instructions

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Clone or download the repository**

2. **Set up Python virtual environment** (recommended)
   ```bash
   # Create virtual environment
   python -m venv venv

   # Activate virtual environment
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   - Update the `.env` file with your configuration
   - Change the `SECRET_KEY` in production

### Running the Application

1. **Start the Flask backend**
   ```bash
   python app.py
   ```

2. **Access the application**
   - Open your browser and navigate to: `http://localhost:5000`
   - The backend API is available at: `http://localhost:5000/api/`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/engagement` - Get engagement data
- `GET /api/dashboard/attendance` - Get attendance data
- `GET /api/dashboard/environment` - Get environmental data

### Students
- `GET /api/students` - Get all students
- `GET /api/students/<id>` - Get specific student details

### Settings
- `GET /api/settings` - Get user settings
- `POST /api/settings` - Update user settings

### Analytics
- `GET /api/analytics/engagement-trends` - Get engagement trends
- `GET /api/analytics/attendance-report` - Get attendance report

### Alerts
- `GET /api/alerts` - Get current alerts

### Health Check
- `GET /api/health` - API health check

## Development

### Frontend Development
The frontend files are served directly by Flask. Any changes to HTML, CSS, or JavaScript files will be reflected immediately after refreshing the browser.

### Backend Development
The Flask app runs in debug mode during development, which enables:
- Auto-reload on code changes
- Detailed error messages
- Interactive debugger

### AI Model Training

The system uses two main AI models:

1. **Student Engagement Model** (`Student_Engagement_Model.h5`)
   - Classifies student states in real-time
   - 6 classes: Engaged, Confused, Frustrated, Drowsy, Bored, Looking Away
   - Location: `static/model/Student_Engagement_Model.h5`

2. **LSTM Prediction Model** (`lstm_classroom_model.h5`)
   - Predicts engagement trends over time
   - Forecasts next 10 minutes of classroom dynamics
   - Location: `static/model/lstm_classroom_model.h5`

**To train the LSTM model:**

```bash
# 1. Generate sample data (or use real data)
cd training_scripts
python generate_sample_data.py

# 2. Prepare data for training
python prepare_data.py

# 3. Train the model
python train_lstm.py

# 4. Verify model file
ls ../static/model/lstm_classroom_model.h5
```

**📚 For detailed training instructions, see:** `LSTM_TRAINING_GUIDE.md`

## Production Deployment

Before deploying to production:

1. Set `FLASK_ENV=production` in `.env`
2. Change the `SECRET_KEY` to a secure random value
3. Use a production WSGI server (e.g., Gunicorn)
4. Set up a proper database (PostgreSQL, MySQL)
5. Implement proper authentication (JWT, OAuth)
6. Enable HTTPS
7. Set up proper logging
8. **Train and deploy custom LSTM model** with your classroom data

## Key Features Implemented

### ✅ Completed Features

- ✅ Real-time engagement detection with 6 states
- ✅ LSTM-based trend prediction and forecasting
- ✅ Dedicated camera monitor page with full-screen support
- ✅ Comprehensive analytics with CSV export
- ✅ Interactive charts and visualizations
- ✅ Dark mode UI
- ✅ Engagement trend indicators
- ✅ Temporal pattern analysis

### 🚧 Future Enhancements

- [ ] Database integration (PostgreSQL/MySQL)
- [ ] Real authentication with JWT
- [ ] WebSocket support for real-time updates
- [ ] Multi-camera support
- [ ] Email notifications and alerts
- [ ] Report generation (PDF)
- [ ] Mobile app support
- [ ] Student individual tracking
- [ ] Historical comparison reports
- [ ] Integration with LMS systems

## Documentation

- **`README.md`** - Main project documentation (this file)
- **`LSTM_TRAINING_GUIDE.md`** - Complete guide for training LSTM models
- **`ENGAGEMENT_MODEL_UPDATE.md`** - Documentation of engagement model changes
- **`data/README.md`** - Data collection and format guide

## License

This project is for educational purposes.

## Support

For issues and questions, please create an issue in the repository.
