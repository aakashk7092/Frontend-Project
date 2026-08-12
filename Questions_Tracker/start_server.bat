@echo off
echo ========================================
echo  Interview Prep Tracker - Local Server
echo ========================================
echo.
echo Starting local web server...
echo.
echo Once started, open your browser and go to:
echo http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.
python -m http.server 8000
