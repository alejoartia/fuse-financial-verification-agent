#!/usr/bin/env node

/**
 * Conversation Analysis Script
 * Analyzes conversation logs and generates comprehensive reports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ConversationVisualizer from '../src/utils/conversationVisualizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const logDir = args[0] || 'logs';
const outputDir = args[1] || 'analysis';
const sessionId = args[2] || null;

/**
 * Main analysis function
 */
async function main() {
  console.log('Starting Conversation Analysis...\n');
  
  try {
    // Check if log directory exists
    if (!fs.existsSync(logDir)) {
      console.error(`Log directory not found: ${logDir}`);
      console.log('Please run a conversation first to generate logs.');
      process.exit(1);
    }
    
    // Get log files
    const logFiles = fs.readdirSync(logDir)
      .filter(file => file.startsWith('conversation_') && file.endsWith('.json'));
    
    if (logFiles.length === 0) {
      console.log('No conversation log files found.');
      console.log('Please run a conversation first to generate logs.');
      process.exit(1);
    }
    
    console.log(`Found ${logFiles.length} conversation log files`);
    
    // Initialize visualizer
    const visualizer = new ConversationVisualizer({
      outputDir,
      enableHTML: true,
      enableJSON: true,
      enableCSV: true
    });
    
    // Process each log file
    for (const logFile of logFiles) {
      if (sessionId && !logFile.includes(sessionId)) {
        continue;
      }
      
      console.log(`\nProcessing: ${logFile}`);
      
      try {
        // Load conversation data
        const logPath = path.join(logDir, logFile);
        const conversationData = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        
        // Extract session ID from filename
        const fileSessionId = logFile.replace('conversation_', '').replace('.json', '');
        
        // Generate analysis report
        await visualizer.saveAnalysisReport(conversationData, fileSessionId);
        
        // Display summary
        const summary = visualizer.getSummary ? visualizer.getSummary() : {
          sessionId: fileSessionId,
          duration: conversationData.metrics?.duration || 0,
          totalSteps: conversationData.metrics?.totalSteps || 0,
          successRate: calculateSuccessRate(conversationData.metrics),
          errorRate: calculateErrorRate(conversationData.metrics)
        };
        
        console.log(`  Session ID: ${summary.sessionId}`);
        console.log(`  Duration: ${formatDuration(summary.duration)}`);
        console.log(`  Total Steps: ${summary.totalSteps}`);
        console.log(`  Success Rate: ${summary.successRate.toFixed(1)}%`);
        console.log(`  Error Rate: ${summary.errorRate.toFixed(1)}%`);
        
      } catch (error) {
        console.error(`  Error processing ${logFile}:`, error.message);
      }
    }
    
    // Generate aggregate report if multiple files
    if (logFiles.length > 1) {
      console.log('\nGenerating aggregate report...');
      await generateAggregateReport(logFiles, logDir, outputDir);
    }
    
    console.log('\nAnalysis completed successfully!');
    console.log(`Reports saved to: ${outputDir}`);
    
  } catch (error) {
    console.error('Analysis failed:', error);
    process.exit(1);
  }
}

/**
 * Generate aggregate report for multiple conversations
 */
async function generateAggregateReport(logFiles, logDir, outputDir) {
  const aggregateData = {
    totalSessions: logFiles.length,
    totalDuration: 0,
    totalSteps: 0,
    totalErrors: 0,
    totalValidations: 0,
    successfulValidations: 0,
    sessions: []
  };
  
  // Process each session
  for (const logFile of logFiles) {
    try {
      const logPath = path.join(logDir, logFile);
      const conversationData = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      
      const sessionData = {
        sessionId: logFile.replace('conversation_', '').replace('.json', ''),
        duration: conversationData.metrics?.duration || 0,
        totalSteps: conversationData.metrics?.totalSteps || 0,
        errors: conversationData.metrics?.errors?.length || 0,
        validations: Object.values(conversationData.metrics?.validationResults || {})
          .flat().length,
        successfulValidations: Object.values(conversationData.metrics?.validationResults || {})
          .flat().filter(v => v.isValid).length
      };
      
      aggregateData.sessions.push(sessionData);
      aggregateData.totalDuration += sessionData.duration;
      aggregateData.totalSteps += sessionData.totalSteps;
      aggregateData.totalErrors += sessionData.errors;
      aggregateData.totalValidations += sessionData.validations;
      aggregateData.successfulValidations += sessionData.successfulValidations;
      
    } catch (error) {
      console.error(`Error processing ${logFile} for aggregate:`, error.message);
    }
  }
  
  // Calculate aggregate metrics
  const avgDuration = aggregateData.totalDuration / aggregateData.totalSessions;
  const avgSteps = aggregateData.totalSteps / aggregateData.totalSessions;
  const overallSuccessRate = aggregateData.totalValidations > 0 ? 
    (aggregateData.successfulValidations / aggregateData.totalValidations) * 100 : 0;
  const avgErrorRate = aggregateData.totalSteps > 0 ? 
    (aggregateData.totalErrors / aggregateData.totalSteps) * 100 : 0;
  
  const aggregateReport = {
    summary: {
      totalSessions: aggregateData.totalSessions,
      totalDuration: aggregateData.totalDuration,
      averageDuration: avgDuration,
      totalSteps: aggregateData.totalSteps,
      averageSteps: avgSteps,
      overallSuccessRate,
      averageErrorRate: avgErrorRate
    },
    sessions: aggregateData.sessions
  };
  
  // Save aggregate report
  const aggregateFile = path.join(outputDir, 'aggregate_analysis.json');
  fs.writeFileSync(aggregateFile, JSON.stringify(aggregateReport, null, 2));
  
  console.log(`Aggregate report saved: ${aggregateFile}`);
  console.log(`Total Sessions: ${aggregateData.totalSessions}`);
  console.log(`Average Duration: ${formatDuration(avgDuration)}`);
  console.log(`Average Steps: ${avgSteps.toFixed(1)}`);
  console.log(`Overall Success Rate: ${overallSuccessRate.toFixed(1)}%`);
  console.log(`Average Error Rate: ${avgErrorRate.toFixed(1)}%`);
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
 * Calculate error rate from metrics
 */
function calculateErrorRate(metrics) {
  if (!metrics || !metrics.totalSteps) return 0;
  
  const errors = metrics.errors?.length || 0;
  return (errors / metrics.totalSteps) * 100;
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

/**
 * Display help information
 */
function displayHelp() {
  console.log(`
Conversation Analysis Tool

Usage:
  node scripts/analyze-conversations.js [logDir] [outputDir] [sessionId]

Arguments:
  logDir     Directory containing conversation logs (default: logs)
  outputDir  Directory to save analysis reports (default: analysis)
  sessionId  Specific session ID to analyze (optional)

Examples:
  node scripts/analyze-conversations.js
  node scripts/analyze-conversations.js logs analysis
  node scripts/analyze-conversations.js logs analysis session_1234567890_abc123

Output:
  - HTML reports with interactive visualizations
  - JSON reports with raw data
  - CSV exports for spreadsheet analysis
  - Aggregate reports for multiple sessions
`);
}

// Handle help flag
if (args.includes('--help') || args.includes('-h')) {
  displayHelp();
  process.exit(0);
}

// Run main function
main().catch(console.error);
