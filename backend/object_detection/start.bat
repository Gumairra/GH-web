@echo off
REM Start Object Detection Server
echo Starting Object Detection Server...
echo Camera Index: %CAMERA_INDEX% (default: 0)
echo Press Ctrl+C to stop
echo.
uvicorn main:app --host 0.0.0.0 --port 8000 --reload