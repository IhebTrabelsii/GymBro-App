/**
 * Generates a simple HTML report from daily data entries
 * @param {Array} entries - Array of daily data entries
 * @param {string} userName - User's name
 * @param {string} month - Month name (e.g., "April 2026")
 * @returns {string} - HTML report as string
 */
function generateMonthlyReport(entries, userName, month) {
  if (!entries || entries.length === 0) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GymBro - Monthly Report</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .container {
            max-width: 600px;
            background: #1e1e1e;
            border-radius: 24px;
            padding: 32px;
            text-align: center;
            border: 2px solid #39FF14;
            box-shadow: 0 10px 40px rgba(57, 255, 20, 0.2);
          }
          h1 { color: #39FF14; margin-bottom: 8px; }
          .subtitle { color: #888; margin-bottom: 32px; }
          .no-data { color: #ff6b6b; font-size: 18px; margin: 32px 0; }
          .message { color: #ccc; line-height: 1.6; }
          .footer { margin-top: 32px; color: #555; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🏋️ GymBro</h1>
          <div class="subtitle">Monthly Progress Report • ${month}</div>
          <div class="no-data">📭 No Data Recorded</div>
          <div class="message">
            Hello ${userName},<br><br>
            You didn't record any data this month.<br>
            Use the Calculator daily to track your progress!
          </div>
          <div class="footer">Keep going! 💪</div>
        </div>
      </body>
      </html>
    `;
  }

  // Calculate stats
  const firstEntry = entries[0];
  const lastEntry = entries[entries.length - 1];
  
  const startWeight = firstEntry.weight;
  const endWeight = lastEntry.weight;
  const weightChange = (endWeight - startWeight).toFixed(1);
  const weightChangeAbs = Math.abs(weightChange).toFixed(1);
  const weightTrend = weightChange < 0 ? 'loss' : weightChange > 0 ? 'gain' : 'maintained';
  
  // Calculate average values
  const avgBMI = (entries.reduce((sum, e) => sum + e.bmi, 0) / entries.length).toFixed(1);
  const avgBMR = Math.round(entries.reduce((sum, e) => sum + e.bmr, 0) / entries.length);
  const avgTDEE = Math.round(entries.reduce((sum, e) => sum + e.tdee, 0) / entries.length);
  
  // Get best and worst weights
  const weights = entries.map(e => e.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  
  // Generate HTML
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GymBro - Monthly Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          padding: 20px;
          min-height: 100vh;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #1e1e1e;
          border-radius: 32px;
          overflow: hidden;
          border: 2px solid #39FF14;
          box-shadow: 0 20px 60px rgba(57, 255, 20, 0.15);
        }
        .header {
          background: linear-gradient(135deg, #39FF14 0%, #2ECC40 100%);
          padding: 32px 24px;
          text-align: center;
        }
        .header h1 { color: #000; font-size: 28px; margin-bottom: 4px; }
        .header p { color: rgba(0,0,0,0.7); font-size: 14px; }
        .content { padding: 24px; }
        .greeting { color: #39FF14; font-size: 20px; margin-bottom: 16px; }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: #2a2a2a;
          border-radius: 16px;
          padding: 16px;
          text-align: center;
        }
        .stat-label { color: #888; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; }
        .stat-value { color: #39FF14; font-size: 28px; font-weight: bold; }
        .stat-unit { color: #666; font-size: 12px; }
        .weight-change {
          background: #2a2a2a;
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          margin-bottom: 24px;
          border-left: 4px solid #39FF14;
        }
        .change-value { font-size: 36px; font-weight: bold; color: #39FF14; }
        .change-label { color: #888; margin-top: 8px; }
        .insight {
          background: rgba(57, 255, 20, 0.1);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 24px;
          border: 1px solid rgba(57, 255, 20, 0.3);
        }
        .insight-title { color: #39FF14; font-weight: bold; margin-bottom: 8px; }
        .insight-text { color: #ccc; line-height: 1.5; }
        .progress-bar-container {
          background: #2a2a2a;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .progress-label { color: #888; font-size: 12px; margin-bottom: 8px; }
        .progress-bar-bg { background: #333; border-radius: 10px; height: 12px; overflow: hidden; }
        .progress-fill { background: #39FF14; height: 100%; width: 0%; border-radius: 10px; }
        .days-tracked { color: #39FF14; text-align: center; margin-top: 16px; font-size: 14px; }
        .footer {
          background: #161616;
          padding: 16px;
          text-align: center;
          color: #555;
          font-size: 12px;
        }
        .motivation { color: #39FF14; font-weight: bold; margin-top: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏋️ GymBro</h1>
          <p>Monthly Progress Report</p>
        </div>
        <div class="content">
          <div class="greeting">Hello, ${userName}! 👋</div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Days Tracked</div>
              <div class="stat-value">${entries.length}</div>
              <div class="stat-unit">/ ${new Date().getDate()} days</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Avg BMI</div>
              <div class="stat-value">${avgBMI}</div>
              <div class="stat-unit">kg/m²</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Avg BMR</div>
              <div class="stat-value">${avgBMR}</div>
              <div class="stat-unit">kcal/day</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Avg TDEE</div>
              <div class="stat-value">${avgTDEE}</div>
              <div class="stat-unit">kcal/day</div>
            </div>
          </div>

          <div class="weight-change">
            <div class="change-value">
              ${weightChange > 0 ? '+' : ''}${weightChange} kg
            </div>
            <div class="change-label">
              ${weightTrend === 'loss' ? '🎉 Weight Loss!' : weightTrend === 'gain' ? '📈 Weight Gain' : '⚖️ Weight Maintained'}
              <br>${startWeight}kg → ${endWeight}kg
            </div>
          </div>

          <div class="insight">
            <div class="insight-title">💡 Monthly Insight</div>
            <div class="insight-text">
              ${generateInsight(weightChange, entries.length, weightTrend)}
            </div>
          </div>

          <div class="progress-bar-container">
            <div class="progress-label">📊 Tracking Consistency</div>
            <div class="progress-bar-bg">
              <div class="progress-fill" style="width: ${(entries.length / 30) * 100}%"></div>
            </div>
            <div class="days-tracked">🎯 ${entries.length} out of 30 days tracked</div>
          </div>

          <div class="motivation">
            ${getMotivationMessage(weightChange, entries.length)}
          </div>
        </div>
        <div class="footer">
          GymBro • Your Fitness Journey • ${month}
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateInsight(weightChange, daysTracked, trend) {
  const absChange = Math.abs(weightChange);
  
  if (daysTracked < 5) {
    return "You've just started tracking! Keep logging daily to see meaningful insights next month. Consistency is key! 🔑";
  }
  
  if (trend === 'loss') {
    if (absChange >= 2) {
      return `Excellent progress! You lost ${absChange}kg this month. Your consistency is paying off. Stay on this path! 🔥`;
    } else {
      return `You lost ${absChange}kg this month. Small consistent steps lead to big results. Keep going! 💪`;
    }
  } else if (trend === 'gain') {
    if (absChange >= 2) {
      return `You gained ${absChange}kg this month. Consider reviewing your nutrition and workout routine. 💡`;
    } else {
      return `Minor weight fluctuation of ${absChange}kg. Stay consistent with your tracking. 📊`;
    }
  } else {
    return `You maintained your weight this month. Great job staying consistent! 🎯`;
  }
}

function getMotivationMessage(weightChange, daysTracked) {
  if (daysTracked >= 25) {
    return "🏆 INCREDIBLE! You tracked almost every day this month! Elite consistency!";
  } else if (daysTracked >= 15) {
    return "🌟 Great job! You're building a strong tracking habit. Keep it up!";
  } else if (daysTracked >= 5) {
    return "📈 Good start! Try to track more days next month for better insights.";
  } else {
    return "✨ Every journey starts with a single step. Start tracking today!";
  }
}

export { generateMonthlyReport };