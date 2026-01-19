#!/bin/bash
# Local Execution Script for Kite Trading System
# Run this script to execute all operations locally and see immediate results

echo "🏠 Kite Trading - Local Execution"
echo "================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "   Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Function to show menu
show_menu() {
    echo "What would you like to do?"
    echo ""
    echo "1. Generate Recommendations (see immediate results)"
    echo "2. View Dashboard (open in browser)"
    echo "3. Execute Sell Order (simulation mode)"
    echo "4. Execute Buy Order (simulation mode)"
    echo "5. Run Strategic Analysis"
    echo "6. Track Daily Performance"
    echo "7. Start Mobile Trigger Server"
    echo "8. Run Complete Daily Automation"
    echo "9. Exit"
    echo ""
    read -p "Enter your choice (1-9): " choice
}

# Generate recommendations
generate_recommendations() {
    echo ""
    echo "📊 Generating Recommendations..."
    echo "================================"
    node config/recommendations/generate-recommendations.js
    echo ""
    echo "✅ Recommendations generated!"
    echo "   CSV: portfolio_recommendations.csv"
    echo "   JSON: config/recommendations/recommendations.json"
    echo ""
    read -p "Press Enter to continue..."
}

# View dashboard
view_dashboard() {
    echo ""
    echo "🌐 Opening Dashboard..."
    echo "======================="
    
    # Detect OS and open dashboard
    case "$OSTYPE" in
        darwin*)
            open config/recommendations/webapp/index.html
            ;;
        linux*)
            xdg-open config/recommendations/webapp/index.html
            ;;
        msys*|cygwin*)
            start config/recommendations/webapp/index.html
            ;;
        *)
            echo "⚠️  Please manually open: config/recommendations/webapp/index.html"
            ;;
    esac
    
    echo ""
    echo "✅ Dashboard opened in browser!"
    echo ""
    read -p "Press Enter to continue..."
}

# Execute sell order
execute_sell() {
    echo ""
    echo "🔴 Execute Sell Order"
    echo "====================="
    echo ""
    read -p "Stock symbol (e.g., GENSOL-BZ): " symbol
    read -p "Quantity: " qty
    echo ""
    echo "⚠️  Running in SIMULATION mode (safe - no real order)"
    echo ""
    node config/sell/sell-stocks.js --symbol "$symbol" --qty "$qty"
    echo ""
    echo "💡 To execute REAL order, add --confirm flag:"
    echo "   node config/sell/sell-stocks.js --symbol $symbol --qty $qty --confirm"
    echo ""
    read -p "Press Enter to continue..."
}

# Execute buy order
execute_buy() {
    echo ""
    echo "🟢 Execute Buy Order"
    echo "===================="
    echo ""
    read -p "Stock symbol (e.g., BSOFT): " symbol
    read -p "Quantity: " qty
    echo ""
    echo "⚠️  Running in SIMULATION mode (safe - no real order)"
    echo ""
    node config/buy/buy-stocks.js --symbol "$symbol" --qty "$qty"
    echo ""
    echo "💡 To execute REAL order, add --confirm flag:"
    echo "   node config/buy/buy-stocks.js --symbol $symbol --qty $qty --confirm"
    echo ""
    read -p "Press Enter to continue..."
}

# Strategic analysis
strategic_analysis() {
    echo ""
    echo "📈 Running Strategic Analysis..."
    echo "================================"
    node config/analysis/strategic-analysis.js
    echo ""
    echo "✅ Analysis complete!"
    echo ""
    read -p "Press Enter to continue..."
}

# Track performance
track_performance() {
    echo ""
    echo "📊 Tracking Daily Performance..."
    echo "================================"
    node config/automation/track-daily-performance.js
    echo ""
    echo "✅ Performance tracked!"
    echo "   View at: config/automation/performance_history.json"
    echo ""
    read -p "Press Enter to continue..."
}

# Start mobile server
start_mobile_server() {
    echo ""
    echo "📱 Starting Mobile Trigger Server..."
    echo "===================================="
    echo ""
    echo "Server will start on http://localhost:3456"
    echo ""
    echo "To access from mobile:"
    echo "  1. Find your IP address:"
    echo "     - Mac/Linux: ifconfig | grep 'inet '"
    echo "     - Windows: ipconfig"
    echo "  2. On mobile browser: http://YOUR_IP:3456"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    node config/mobile/mobile-triggers.js
}

# Run daily automation
daily_automation() {
    echo ""
    echo "🤖 Running Complete Daily Automation..."
    echo "======================================="
    node config/automation/daily-runner.js
    echo ""
    echo "✅ Daily automation complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Review recommendations in dashboard"
    echo "  2. Execute orders using options 3 or 4"
    echo ""
    read -p "Press Enter to continue..."
}

# Main loop
while true; do
    clear
    show_menu
    
    case $choice in
        1) generate_recommendations ;;
        2) view_dashboard ;;
        3) execute_sell ;;
        4) execute_buy ;;
        5) strategic_analysis ;;
        6) track_performance ;;
        7) start_mobile_server ;;
        8) daily_automation ;;
        9) 
            echo ""
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo ""
            echo "❌ Invalid choice. Please try again."
            sleep 2
            ;;
    esac
done
