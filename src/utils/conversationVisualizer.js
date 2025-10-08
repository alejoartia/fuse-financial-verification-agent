/**
 * Conversation Visualizer
 * Provides visualization tools for post-conversation analysis
 */

import fs from 'fs';
import path from 'path';
import { format, parseISO } from 'date-fns';

export class ConversationVisualizer {
  constructor(options = {}) {
    this.outputDir = options.outputDir || 'analysis';
    this.enableHTML = options.enableHTML !== false;
    this.enableJSON = options.enableJSON !== false;
    this.enableCSV = options.enableCSV !== false;
    
    this.ensureOutputDirectory();
  }

  /**
   * Ensure output directory exists
   */
  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate conversation flow diagram
   * @param {object} conversationData - Conversation data
   * @returns {string} Mermaid diagram
   */
  generateFlowDiagram(conversationData) {
    const { nodeTransitions, logs } = conversationData;
    
    let diagram = 'graph TD\n';
    diagram += '  Start([Start]) --> IDENTITY_VERIFICATION_DOB\n';
    
    // Add all nodes and transitions
    Object.keys(nodeTransitions).forEach(fromNode => {
      nodeTransitions[fromNode].forEach(transition => {
        const toNode = transition.to;
        const context = transition.context;
        
        // Add node if not already added
        if (!diagram.includes(toNode)) {
          diagram += `  ${toNode}[${toNode.replace(/_/g, ' ')}]\n`;
        }
        
        // Add transition
        diagram += `  ${fromNode} --> ${toNode}\n`;
      });
    });
    
    // Add terminal nodes
    diagram += '  IDENTITY_FAILURE_TERMINATION([Identity Failure])\n';
    diagram += '  COMPLETION([Completion])\n';
    
    return diagram;
  }

  /**
   * Generate conversation timeline
   * @param {object} conversationData - Conversation data
   * @returns {string} HTML timeline
   */
  generateTimeline(conversationData) {
    const { logs } = conversationData;
    
    let timeline = '<div class="timeline">\n';
    
    logs.forEach((log, index) => {
      const timestamp = format(parseISO(log.timestamp), 'HH:mm:ss.SSS');
      const stepClass = log.type === 'error' ? 'error' : 
                       log.type === 'success' ? 'success' : 'info';
      
      timeline += `
        <div class="timeline-item ${stepClass}">
          <div class="timeline-marker"></div>
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="timeline-time">${timestamp}</span>
              <span class="timeline-step">${log.step}</span>
            </div>
            <div class="timeline-data">
              ${JSON.stringify(log.data, null, 2)}
            </div>
          </div>
        </div>
      `;
    });
    
    timeline += '</div>';
    return timeline;
  }

  /**
   * Generate metrics dashboard
   * @param {object} conversationData - Conversation data
   * @returns {string} HTML dashboard
   */
  generateMetricsDashboard(conversationData) {
    const { metrics } = conversationData;
    
    const dashboard = `
      <div class="metrics-dashboard">
        <h2>Conversation Metrics</h2>
        
        <div class="metrics-grid">
          <div class="metric-card">
            <h3>Duration</h3>
            <div class="metric-value">${this.formatDuration(metrics.duration)}</div>
          </div>
          
          <div class="metric-card">
            <h3>Total Steps</h3>
            <div class="metric-value">${metrics.totalSteps}</div>
          </div>
          
          <div class="metric-card">
            <h3>Success Rate</h3>
            <div class="metric-value">${this.calculateSuccessRate(metrics).toFixed(1)}%</div>
          </div>
          
          <div class="metric-card">
            <h3>Error Rate</h3>
            <div class="metric-value">${this.calculateErrorRate(metrics).toFixed(1)}%</div>
          </div>
          
          <div class="metric-card">
            <h3>User Responses</h3>
            <div class="metric-value">${metrics.userResponses.length}</div>
          </div>
          
          <div class="metric-card">
            <h3>LLM Calls</h3>
            <div class="metric-value">${metrics.llmCalls.length}</div>
          </div>
        </div>
        
        <div class="charts-section">
          <h3>Node Transitions</h3>
          <div class="node-transitions">
            ${this.generateNodeTransitionsChart(metrics.nodeTransitions)}
          </div>
          
          <h3>Validation Results</h3>
          <div class="validation-results">
            ${this.generateValidationChart(metrics.validationResults)}
          </div>
          
          <h3>Response Times</h3>
          <div class="response-times">
            ${this.generateResponseTimeChart(metrics.llmCalls)}
          </div>
        </div>
      </div>
    `;
    
    return dashboard;
  }

  /**
   * Generate complete HTML report
   * @param {object} conversationData - Conversation data
   * @param {string} sessionId - Session ID
   * @returns {string} Complete HTML report
   */
  generateHTMLReport(conversationData, sessionId) {
    const { logs, metrics } = conversationData;
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Conversation Analysis - ${sessionId}</title>
        <style>
          ${this.getCSS()}
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h1>Conversation Analysis Report</h1>
            <div class="session-info">
              <p><strong>Session ID:</strong> ${sessionId}</p>
              <p><strong>Generated:</strong> ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</p>
            </div>
          </header>
          
          <main>
            ${this.generateMetricsDashboard(conversationData)}
            
            <section class="conversation-flow">
              <h2>Conversation Flow</h2>
              <div class="flow-diagram">
                <pre>${this.generateFlowDiagram(conversationData)}</pre>
              </div>
            </section>
            
            <section class="conversation-timeline">
              <h2>Conversation Timeline</h2>
              ${this.generateTimeline(conversationData)}
            </section>
            
            <section class="detailed-logs">
              <h2>Detailed Logs</h2>
              <div class="logs-container">
                ${this.generateDetailedLogs(logs)}
              </div>
            </section>
          </main>
        </div>
        
        <script>
          ${this.getJavaScript()}
        </script>
      </body>
      </html>
    `;
    
    return html;
  }

  /**
   * Generate detailed logs section
   * @param {Array} logs - Conversation logs
   * @returns {string} HTML logs section
   */
  generateDetailedLogs(logs) {
    let logsHTML = '<div class="logs-list">\n';
    
    logs.forEach((log, index) => {
      const timestamp = format(parseISO(log.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS');
      const stepClass = log.type === 'error' ? 'error' : 
                       log.type === 'success' ? 'success' : 'info';
      
      logsHTML += `
        <div class="log-entry ${stepClass}">
          <div class="log-header">
            <span class="log-timestamp">${timestamp}</span>
            <span class="log-step">${log.step}</span>
            <span class="log-type">${log.type}</span>
          </div>
          <div class="log-data">
            <pre>${JSON.stringify(log.data, null, 2)}</pre>
          </div>
        </div>
      `;
    });
    
    logsHTML += '</div>';
    return logsHTML;
  }

  /**
   * Generate node transitions chart
   * @param {object} nodeTransitions - Node transitions data
   * @returns {string} HTML chart
   */
  generateNodeTransitionsChart(nodeTransitions) {
    let chart = '<div class="node-transitions-chart">\n';
    
    Object.keys(nodeTransitions).forEach(node => {
      const transitions = nodeTransitions[node];
      chart += `
        <div class="node-transition">
          <div class="node-name">${node.replace(/_/g, ' ')}</div>
          <div class="transition-count">${transitions.length} transitions</div>
        </div>
      `;
    });
    
    chart += '</div>';
    return chart;
  }

  /**
   * Generate validation chart
   * @param {object} validationResults - Validation results
   * @returns {string} HTML chart
   */
  generateValidationChart(validationResults) {
    let chart = '<div class="validation-chart">\n';
    
    Object.keys(validationResults).forEach(field => {
      const validations = validationResults[field];
      const validCount = validations.filter(v => v.isValid).length;
      const totalCount = validations.length;
      const successRate = totalCount > 0 ? (validCount / totalCount) * 100 : 0;
      
      chart += `
        <div class="validation-field">
          <div class="field-name">${field}</div>
          <div class="validation-bar">
            <div class="validation-fill" style="width: ${successRate}%"></div>
          </div>
          <div class="validation-text">${validCount}/${totalCount} (${successRate.toFixed(1)}%)</div>
        </div>
      `;
    });
    
    chart += '</div>';
    return chart;
  }

  /**
   * Generate response time chart
   * @param {Array} llmCalls - LLM calls data
   * @returns {string} HTML chart
   */
  generateResponseTimeChart(llmCalls) {
    if (llmCalls.length === 0) return '<p>No LLM calls recorded</p>';
    
    const times = llmCalls.map(call => call.duration);
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    
    let chart = `
      <div class="response-time-chart">
        <div class="time-stats">
          <div class="time-stat">
            <span class="stat-label">Average:</span>
            <span class="stat-value">${avgTime.toFixed(0)}ms</span>
          </div>
          <div class="time-stat">
            <span class="stat-label">Max:</span>
            <span class="stat-value">${maxTime}ms</span>
          </div>
          <div class="time-stat">
            <span class="stat-label">Min:</span>
            <span class="stat-value">${minTime}ms</span>
          </div>
        </div>
        <div class="time-bars">
          ${times.map((time, index) => `
            <div class="time-bar" style="height: ${(time / maxTime) * 100}%"></div>
          `).join('')}
        </div>
      </div>
    `;
    
    return chart;
  }

  /**
   * Get CSS styles
   * @returns {string} CSS styles
   */
  getCSS() {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #f5f5f5;
      }
      
      .container {
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
      }
      
      .session-info {
        margin-top: 10px;
        color: #666;
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
      
      .metric-card h3 {
        color: #666;
        margin-bottom: 10px;
      }
      
      .metric-value {
        font-size: 2em;
        font-weight: bold;
        color: #2c3e50;
      }
      
      .timeline {
        background: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .timeline-item {
        display: flex;
        margin-bottom: 20px;
        position: relative;
      }
      
      .timeline-item:not(:last-child)::after {
        content: '';
        position: absolute;
        left: 15px;
        top: 30px;
        bottom: -20px;
        width: 2px;
        background: #ddd;
      }
      
      .timeline-marker {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: #3498db;
        margin-right: 20px;
        flex-shrink: 0;
      }
      
      .timeline-item.success .timeline-marker {
        background: #27ae60;
      }
      
      .timeline-item.error .timeline-marker {
        background: #e74c3c;
      }
      
      .timeline-content {
        flex: 1;
        background: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
      }
      
      .timeline-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      
      .timeline-time {
        color: #666;
        font-size: 0.9em;
      }
      
      .timeline-step {
        font-weight: bold;
      }
      
      .timeline-data {
        font-family: monospace;
        font-size: 0.8em;
        background: white;
        padding: 10px;
        border-radius: 4px;
        overflow-x: auto;
      }
      
      .logs-container {
        background: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .log-entry {
        border-left: 4px solid #3498db;
        padding: 15px;
        margin-bottom: 15px;
        background: #f8f9fa;
      }
      
      .log-entry.success {
        border-left-color: #27ae60;
      }
      
      .log-entry.error {
        border-left-color: #e74c3c;
      }
      
      .log-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      
      .log-timestamp {
        color: #666;
        font-size: 0.9em;
      }
      
      .log-step {
        font-weight: bold;
      }
      
      .log-type {
        background: #3498db;
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.8em;
      }
      
      .log-entry.success .log-type {
        background: #27ae60;
      }
      
      .log-entry.error .log-type {
        background: #e74c3c;
      }
      
      .log-data pre {
        background: white;
        padding: 10px;
        border-radius: 4px;
        overflow-x: auto;
        font-size: 0.8em;
      }
      
      .node-transitions-chart {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
      }
      
      .node-transition {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
        text-align: center;
      }
      
      .node-name {
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .transition-count {
        color: #666;
        font-size: 0.9em;
      }
      
      .validation-chart {
        display: grid;
        gap: 15px;
      }
      
      .validation-field {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
      }
      
      .field-name {
        font-weight: bold;
        margin-bottom: 10px;
      }
      
      .validation-bar {
        height: 20px;
        background: #e9ecef;
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 5px;
      }
      
      .validation-fill {
        height: 100%;
        background: linear-gradient(90deg, #27ae60, #2ecc71);
        transition: width 0.3s ease;
      }
      
      .validation-text {
        color: #666;
        font-size: 0.9em;
      }
      
      .response-time-chart {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 6px;
      }
      
      .time-stats {
        display: flex;
        justify-content: space-around;
        margin-bottom: 20px;
      }
      
      .time-stat {
        text-align: center;
      }
      
      .stat-label {
        display: block;
        color: #666;
        font-size: 0.9em;
      }
      
      .stat-value {
        display: block;
        font-weight: bold;
        font-size: 1.2em;
        color: #2c3e50;
      }
      
      .time-bars {
        display: flex;
        align-items: end;
        height: 100px;
        gap: 2px;
      }
      
      .time-bar {
        flex: 1;
        background: #3498db;
        border-radius: 2px 2px 0 0;
        min-height: 2px;
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
      
      h3 {
        color: #34495e;
        margin-bottom: 15px;
      }
    `;
  }

  /**
   * Get JavaScript for interactivity
   * @returns {string} JavaScript code
   */
  getJavaScript() {
    return `
      // Add interactivity to the report
      document.addEventListener('DOMContentLoaded', function() {
        // Add click handlers for log entries
        const logEntries = document.querySelectorAll('.log-entry');
        logEntries.forEach(entry => {
          entry.addEventListener('click', function() {
            this.classList.toggle('expanded');
          });
        });
        
        // Add search functionality
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search logs...';
        searchInput.style.cssText = 'width: 100%; padding: 10px; margin-bottom: 20px; border: 1px solid #ddd; border-radius: 4px;';
        
        const logsContainer = document.querySelector('.logs-container');
        logsContainer.insertBefore(searchInput, logsContainer.firstChild);
        
        searchInput.addEventListener('input', function() {
          const searchTerm = this.value.toLowerCase();
          logEntries.forEach(entry => {
            const text = entry.textContent.toLowerCase();
            entry.style.display = text.includes(searchTerm) ? 'block' : 'none';
          });
          });
        });
      });
    `;
  }

  /**
   * Format duration in human readable format
   * @param {number} duration - Duration in milliseconds
   * @returns {string} Formatted duration
   */
  formatDuration(duration) {
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

  /**
   * Calculate success rate
   * @param {object} metrics - Metrics data
   * @returns {number} Success rate percentage
   */
  calculateSuccessRate(metrics) {
    const totalValidations = Object.values(metrics.validationResults)
      .flat().length;
    const successfulValidations = Object.values(metrics.validationResults)
      .flat().filter(v => v.isValid).length;
    
    return totalValidations > 0 ? (successfulValidations / totalValidations) * 100 : 0;
  }

  /**
   * Calculate error rate
   * @param {object} metrics - Metrics data
   * @returns {number} Error rate percentage
   */
  calculateErrorRate(metrics) {
    return metrics.totalSteps > 0 ? 
      (metrics.errors.length / metrics.totalSteps) * 100 : 0;
  }

  /**
   * Generate CSV export
   * @param {object} conversationData - Conversation data
   * @param {string} sessionId - Session ID
   * @returns {string} CSV data
   */
  generateCSV(conversationData, sessionId) {
    const { logs, metrics } = conversationData;
    
    let csv = 'Timestamp,Step,Type,Data\n';
    
    logs.forEach(log => {
      const timestamp = format(parseISO(log.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS');
      const data = JSON.stringify(log.data).replace(/"/g, '""');
      csv += `"${timestamp}","${log.step}","${log.type}","${data}"\n`;
    });
    
    return csv;
  }

  /**
   * Save analysis report
   * @param {object} conversationData - Conversation data
   * @param {string} sessionId - Session ID
   */
  async saveAnalysisReport(conversationData, sessionId) {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    
    if (this.enableHTML) {
      const htmlReport = this.generateHTMLReport(conversationData, sessionId);
      const htmlFile = path.join(this.outputDir, `analysis_${sessionId}_${timestamp}.html`);
      fs.writeFileSync(htmlFile, htmlReport);
      console.log(`HTML report saved: ${htmlFile}`);
    }
    
    if (this.enableJSON) {
      const jsonFile = path.join(this.outputDir, `analysis_${sessionId}_${timestamp}.json`);
      fs.writeFileSync(jsonFile, JSON.stringify(conversationData, null, 2));
      console.log(`JSON report saved: ${jsonFile}`);
    }
    
    if (this.enableCSV) {
      const csvData = this.generateCSV(conversationData, sessionId);
      const csvFile = path.join(this.outputDir, `analysis_${sessionId}_${timestamp}.csv`);
      fs.writeFileSync(csvFile, csvData);
      console.log(`CSV report saved: ${csvFile}`);
    }
  }
}

export default ConversationVisualizer;
