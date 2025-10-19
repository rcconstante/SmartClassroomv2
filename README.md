# Smart Classroom

A modern web application for classroom monitoring and management with real-time engagement tracking, attendance monitoring, and environmental controls.

## Features

- 📊 Real-time student engagement monitoring
- 📋 Attendance tracking and reporting
- 🌡️ Environmental monitoring (temperature, humidity, CO2)
- 👥 Student management
- 📈 Analytics and reporting
- 🌙 Dark mode support
- ⚙️ Customizable settings

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

## Production Deployment

Before deploying to production:

1. Set `FLASK_ENV=production` in `.env`
2. Change the `SECRET_KEY` to a secure random value
3. Use a production WSGI server (e.g., Gunicorn)
4. Set up a proper database (PostgreSQL, MySQL)
5. Implement proper authentication (JWT, OAuth)
6. Enable HTTPS
7. Set up proper logging

## Future Enhancements

- [ ] Database integration (PostgreSQL/MySQL)
- [ ] Real authentication with JWT
- [ ] WebSocket support for real-time updates
- [ ] Video stream processing
- [ ] Machine learning for engagement detection
- [ ] Email notifications
- [ ] Report generation (PDF)
- [ ] Mobile app support

## License

This project is for educational purposes.

## Support

For issues and questions, please create an issue in the repository.
