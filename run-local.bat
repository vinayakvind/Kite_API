@echo off
REM Local Execution Script for Kite Trading System (Windows)
REM Run this script to execute all operations locally and see immediate results

:MENU
cls
echo ================================================
echo    Kite Trading - Local Execution (Windows)
echo ================================================
echo.
echo What would you like to do?
echo.
echo 1. Generate Recommendations (see immediate results)
echo 2. View Dashboard (open in browser)
echo 3. Execute Sell Order (simulation mode)
echo 4. Execute Buy Order (simulation mode)
echo 5. Run Strategic Analysis
echo 6. Track Daily Performance
echo 7. Start Mobile Trigger Server
echo 8. Run Complete Daily Automation
echo 9. Exit
echo.
set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto GENERATE
if "%choice%"=="2" goto DASHBOARD
if "%choice%"=="3" goto SELL
if "%choice%"=="4" goto BUY
if "%choice%"=="5" goto ANALYSIS
if "%choice%"=="6" goto TRACK
if "%choice%"=="7" goto MOBILE
if "%choice%"=="8" goto DAILY
if "%choice%"=="9" goto EXIT
goto INVALID

:GENERATE
cls
echo.
echo ================================================
echo    Generating Recommendations...
echo ================================================
echo.
node config\recommendations\generate-recommendations.js
echo.
echo ================================================
echo    Recommendations generated!
echo ================================================
echo    CSV: portfolio_recommendations.csv
echo    JSON: config\recommendations\recommendations.json
echo.
pause
goto MENU

:DASHBOARD
cls
echo.
echo ================================================
echo    Opening Dashboard...
echo ================================================
echo.
start config\recommendations\webapp\index.html
echo.
echo Dashboard opened in browser!
echo.
pause
goto MENU

:SELL
cls
echo.
echo ================================================
echo    Execute Sell Order
echo ================================================
echo.
set /p symbol="Stock symbol (e.g., GENSOL-BZ): "
set /p qty="Quantity: "
echo.
echo Running in SIMULATION mode (safe - no real order)
echo.
node config\sell\sell-stocks.js --symbol %symbol% --qty %qty%
echo.
echo ================================================
echo    To execute REAL order, add --confirm flag:
echo    node config\sell\sell-stocks.js --symbol %symbol% --qty %qty% --confirm
echo ================================================
echo.
pause
goto MENU

:BUY
cls
echo.
echo ================================================
echo    Execute Buy Order
echo ================================================
echo.
set /p symbol="Stock symbol (e.g., BSOFT): "
set /p qty="Quantity: "
echo.
echo Running in SIMULATION mode (safe - no real order)
echo.
node config\buy\buy-stocks.js --symbol %symbol% --qty %qty%
echo.
echo ================================================
echo    To execute REAL order, add --confirm flag:
echo    node config\buy\buy-stocks.js --symbol %symbol% --qty %qty% --confirm
echo ================================================
echo.
pause
goto MENU

:ANALYSIS
cls
echo.
echo ================================================
echo    Running Strategic Analysis...
echo ================================================
echo.
node config\analysis\strategic-analysis.js
echo.
echo Analysis complete!
echo.
pause
goto MENU

:TRACK
cls
echo.
echo ================================================
echo    Tracking Daily Performance...
echo ================================================
echo.
node config\automation\track-daily-performance.js
echo.
echo ================================================
echo    Performance tracked!
echo    View at: config\automation\performance_history.json
echo ================================================
echo.
pause
goto MENU

:MOBILE
cls
echo.
echo ================================================
echo    Starting Mobile Trigger Server...
echo ================================================
echo.
echo Server will start on http://localhost:3456
echo.
echo To access from mobile:
echo   1. Find your IP address: ipconfig
echo   2. On mobile browser: http://YOUR_IP:3456
echo.
echo Press Ctrl+C to stop the server
echo.
node config\mobile\mobile-triggers.js
pause
goto MENU

:DAILY
cls
echo.
echo ================================================
echo    Running Complete Daily Automation...
echo ================================================
echo.
node config\automation\daily-runner.js
echo.
echo ================================================
echo    Daily automation complete!
echo ================================================
echo.
echo Next steps:
echo   1. Review recommendations in dashboard
echo   2. Execute orders using options 3 or 4
echo.
pause
goto MENU

:INVALID
echo.
echo Invalid choice. Please try again.
timeout /t 2 >nul
goto MENU

:EXIT
cls
echo.
echo Goodbye!
echo.
exit /b 0
