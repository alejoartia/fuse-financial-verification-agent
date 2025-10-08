#!/usr/bin/env node

/**
 * Conversation Dashboard
 * Real-time dashboard for monitoring conversation metrics and performance
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format } from 'date-fns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  logDir: 'logs',
  outputDir: 'dashboard',
  refreshInterval: 5000, // 5 seconds
  maxSessions: 50
};

/**
 * Main dashboard function
 */
async function main() {
  console.log('Starting Conversation Dashboard...\n');
  
  try {
    // Ensure output directory exists
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
    }
    
    // Generate initial dashboard
    await generateDashboard();
    
    console.log(`Dashboard generated: ${config.outputDir}/index.html`);
    console.log(`Open in browser: file://${path.resolve(config.outputDir, 'index.html')}`);
    console.log('\nPress Ctrl+C to stop monitoring...');
    
    // Set up file watching for real-time updates
    if (fs.existsSync(config.logDir)) {
      fs.watch(config.logDir, { recursive: true }, async (eventType, filename) => {
        if (filename && filename.endsWith('.json')) {
          console.log(`\n[${format(new Date(), 'HH:mm:ss')}] Log file updated: ${filename}`);
          await generateDashboard();
        }
      });
    }
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\nDashboard stopped.');
      process.exit(0);
    });
    
    // Keep alive
    setInterval(() => {
      // Silent keep-alive
    }, config.refreshInterval);
    
  } catch (error) {
    console.error('Dashboard failed:', error);
    process.exit(1);
  }
}

/**
 * Generate the main dashboard
 */
async function generateDashboard() {
  try {
    // Get all conversation data
    const conversationData = await loadAllConversations();
    
    // Generate HTML dashboard
    const html = generateHTMLDashboard(conversationData);
    const htmlFile = path.join(config.outputDir, 'index.html');
    fs.writeFileSync(htmlFile, html);
    
    // Generate JSON data for AJAX updates
    const jsonData = generateJSONData(conversationData);
    const jsonFile = path.join(config.outputDir, 'data.json');
    fs.writeFileSync(jsonFile, JSON.stringify(jsonData, null, 2));
    
  } catch (error) {
    console.error('Error generating dashboard:', error);
  }
}

/**
 * Load all conversation data
 */
async function loadAllConversations() {
  const conversations = [];
  
  if (!fs.existsSync(config.logDir)) {
    return conversations;
  }
  
  const logFiles = fs.readdirSync(config.logDir)
    .filter(file => file.startsWith('conversation_') && file.endsWith('.json'))
    .sort((a, b) => {
      const statA = fs.statSync(path.join(config.logDir, a));
      const statB = fs.statSync(path.join(config.logDir, b));
      return statB.mtime - statA.mtime;
    })
    .slice(0, config.maxSessions);
  
  for (const logFile of logFiles) {
    try {
      const logPath = path.join(config.logDir, logFile);
      const data = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      conversations.push({
        sessionId: logFile.replace('conversation_', '').replace('.json', ''),
        ...data
      });
    } catch (error) {
      console.error(`Error loading ${logFile}:`, error.message);
    }
  }
  
  return conversations;
}

/**
 * Generate HTML dashboard
 */
function generateHTMLDashboard(conversations) {
  const totalSessions = conversations.length;
  const totalDuration = conversations.reduce((sum, conv) => sum + (conv.metrics?.duration || 0), 0);
  const totalSteps = conversations.reduce((sum, conv) => sum + (conv.metrics?.totalSteps || 0), 0);
  const totalErrors = conversations.reduce((sum, conv) => sum + (conv.metrics?.errors?.length || 0), 0);
  
  const avgDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
  const avgSteps = totalSessions > 0 ? totalSteps / totalSessions : 0;
  const errorRate = totalSteps > 0 ? (totalErrors / totalSteps) * 100 : 0;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conversation Dashboard</title>
    <style>
        ${getDashboardCSS()}
    </style>
</head>
<body>
    <div class="dashboard">
        <header>
            <h1>Conversation Dashboard</h1>
            <div class="last-updated">
                Last updated: <span id="lastUpdated">${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</span>
            </div>
        </header>
        
        <main>
            <section class="overview">
                <h2>Overview</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">${totalSessions}</div>
                        <div class="metric-label">Total Sessions</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${formatDuration(avgDuration)}</div>
                        <div class="metric-label">Avg Duration</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${avgSteps.toFixed(1)}</div>
                        <div class="metric-label">Avg Steps</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${errorRate.toFixed(1)}%</div>
                        <div class="metric-label">Error Rate</div>
                    </div>
                </div>
            </section>
            
            <section class="sessions">
                <h2>Recent Sessions</h2>
                <div class="sessions-list">
                    ${generateSessionsList(conversations)}
                </div>
            </section>
            
            <section class="charts">
                <h2>Analytics</h2>
                <div class="charts-grid">
                    <div class="chart-container">
                        <h3>Session Duration</h3>
                        <div class="chart" id="durationChart">
                            ${generateDurationChart(conversations)}
                        </div>
                    </div>
                    <div class="chart-container">
                        <h3>Steps per Session</h3>
                        <div class="chart" id="stepsChart">
                            ${generateStepsChart(conversations)}
                        </div>
                    </div>
                    <div class="chart-container">
                        <h3>Error Distribution</h3>
                        <div class="chart" id="errorChart">
                            ${generateErrorChart(conversations)}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    </div>
    
    <script>
        ${getDashboardJavaScript()}
    </script>
</body>
</html>
  `;
}

/**
 * Generate sessions list
 */
function generateSessionsList(conversations) {
  return conversations.slice(0, 10).map(conv => {
    const duration = conv.metrics?.duration || 0;
    const steps = conv.metrics?.totalSteps || 0;
    const errors = conv.metrics?.errors?.length || 0;
    const successRate = calculateSuccessRate(conv.metrics);
    
    return `
      <div class="session-item">
        <div class="session-header">
          <span class="session-id">${conv.sessionId}</span>
          <span class="session-time">${format(new Date(conv.startTime), 'MM-dd HH:mm')}</span>
        </div>
        <div class="session-metrics">
          <span class="metric">Duration: ${formatDuration(duration)}</span>
          <span class="metric">Steps: ${steps}</span>
          <span class="metric">Errors: ${errors}</span>
          <span class="metric">Success: ${successRate.toFixed(1)}%</span>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Generate duration chart
 */
function generateDurationChart(conversations) {
  const durations = conversations.map(conv => conv.metrics?.duration || 0);
  const maxDuration = Math.max(...durations, 1);
  
  return durations.map((duration, index) => {
    const height = (duration / maxDuration) * 100;
    return `<div class="bar" style="height: ${height}%" title="Session ${index + 1}: ${formatDuration(duration)}"></div>`;
  }).join('');
}

/**
 * Generate steps chart
 */
function generateStepsChart(conversations) {
  const steps = conversations.map(conv => conv.metrics?.totalSteps || 0);
  const maxSteps = Math.max(...steps, 1);
  
  return steps.map((step, index) => {
    const height = (step / maxSteps) * 100;
    return `<div class="bar" style="height: ${height}%" title="Session ${index + 1}: ${step} steps"></div>`;
  }).join('');
}

/**
 * Generate error chart
 */
function generateErrorChart(conversations) {
  const errors = conversations.map(conv => conv.metrics?.errors?.length || 0);
  const maxErrors = Math.max(...errors, 1);
  
  return errors.map((error, index) => {
    const height = (error / maxErrors) * 100;
    const color = error > 0 ? '#e74c3c' : '#27ae60';
    return `<div class="bar" style="height: ${height}%; background-color: ${color}" title="Session ${index + 1}: ${error} errors"></div>`;
  }).join('');
}

/**
 * Generate JSON data for AJAX updates
 */
function generateJSONData(conversations) {
  return {
    timestamp: new Date().toISOString(),
    totalSessions: conversations.length,
    conversations: conversations.map(conv => ({
      sessionId: conv.sessionId,
      startTime: conv.startTime,
      duration: conv.metrics?.duration || 0,
      totalSteps: conv.metrics?.totalSteps || 0,
      errors: conv.metrics?.errors?.length || 0,
      successRate: calculateSuccessRate(conv.metrics)
    }))
  };
}

/**
 * Get dashboard CSS
 */
function getDashboardCSS() {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f5f5f5;
      color: #333;
    }
    
    .dashboard {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    header {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    h1 {
      color: #2c3e50;
    }
    
    .last-updated {
      color: #666;
      font-size: 0.9em;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .metric-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    
    .metric-value {
      font-size: 2.5em;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 5px;
    }
    
    .metric-label {
      color: #666;
      font-size: 0.9em;
    }
    
    .sessions-list {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .session-item {
      border-bottom: 1px solid #eee;
      padding: 15px 0;
    }
    
    .session-item:last-child {
      border-bottom: none;
    }
    
    .session-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    
    .session-id {
      font-weight: bold;
      color: #2c3e50;
    }
    
    .session-time {
      color: #666;
      font-size: 0.9em;
    }
    
    .session-metrics {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }
    
    .metric {
      background: #f8f9fa;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 0.9em;
      color: #666;
    }
    
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .chart-container {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .chart-container h3 {
      margin-bottom: 15px;
      color: #2c3e50;
    }
    
    .chart {
      display: flex;
      align-items: end;
      height: 150px;
      gap: 2px;
      background: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
    }
    
    .bar {
      flex: 1;
      background: #3498db;
      border-radius: 2px 2px 0 0;
      min-height: 2px;
      transition: all 0.3s ease;
    }
    
    .bar:hover {
      background: #2980b9;
    }
    
    section {
      margin-bottom: 30px;
    }
    
    h2 {
      color: #2c3e50;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #3498db;
    }
  `;
}

/**
 * Get dashboard JavaScript
 */
function getDashboardJavaScript() {
  return `
    // Auto-refresh functionality
    let refreshInterval;
    
    function startAutoRefresh() {
      refreshInterval = setInterval(async () => {
        try {
          const response = await fetch('data.json');
          const data = await response.json();
          updateDashboard(data);
        } catch (error) {
          console.error('Failed to refresh data:', error);
        }
      }, 5000);
    }
    
    function updateDashboard(data) {
      // Update last updated time
      document.getElementById('lastUpdated').textContent = 
        new Date(data.timestamp).toLocaleString();
      
      // Update overview metrics
      const totalSessions = data.totalSessions;
      const avgDuration = data.conversations.reduce((sum, conv) => sum + conv.duration, 0) / totalSessions;
      const avgSteps = data.conversations.reduce((sum, conv) => sum + conv.totalSteps, 0) / totalSessions;
      const totalErrors = data.conversations.reduce((sum, conv) => sum + conv.errors, 0);
      const totalSteps = data.conversations.reduce((sum, conv) => sum + conv.totalSteps, 0);
      const errorRate = totalSteps > 0 ? (totalErrors / totalSteps) * 100 : 0;
      
      // Update metric cards
      const metricCards = document.querySelectorAll('.metric-card');
      if (metricCards.length >= 4) {
        metricCards[0].querySelector('.metric-value').textContent = totalSessions;
        metricCards[1].querySelector('.metric-value').textContent = formatDuration(avgDuration);
        metricCards[2].querySelector('.metric-value').textContent = avgSteps.toFixed(1);
        metricCards[3].querySelector('.metric-value').textContent = errorRate.toFixed(1) + '%';
      }
    }
    
    function formatDuration(duration) {
      const seconds = Math.floor(duration / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      
      if (hours > 0) {
        return hours + 'h ' + (minutes % 60) + 'm ' + (seconds % 60) + 's';
      } else if (minutes > 0) {
        return minutes + 'm ' + (seconds % 60) + 's';
      } else {
        return seconds + 's';
      }
    }
    
    // Start auto-refresh when page loads
    document.addEventListener('DOMContentLoaded', () => {
      startAutoRefresh();
    });
    
    // Stop auto-refresh when page unloads
    window.addEventListener('beforeunload', () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    });
  `;
}

/**
 * Calculate success rate from metrics
 */
function calculateSuccessRate(metrics) {
  if (!metrics || !metrics.validationResults) return 0;
  
  const totalValidations = Object.values(metrics.validationResults)
    .flat().length;
  const successfulValidations = Object.values(metrics.validationResults)
    .flat().filter(v => v.isValid).length;
  
  return totalValidations > 0 ? (successfulValidations / totalValidations) * 100 : 0;
}

/**
 * Format duration in human readable format
 */
function formatDuration(duration) {
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Run main function
main().catch(console.error);
