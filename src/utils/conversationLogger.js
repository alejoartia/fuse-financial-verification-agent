/**
 * Conversation State Logger
 * Provides detailed logging and tracking of conversation states, transitions, and metrics
 */

import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

export class ConversationLogger {
  constructor(options = {}) {
    this.logDir = options.logDir || 'logs';
    this.enableFileLogging = options.enableFileLogging !== false;
    this.enableConsoleLogging = options.enableConsoleLogging !== false;
    this.sessionId = this.generateSessionId();
    this.startTime = new Date();
    this.logs = [];
    this.metrics = {
      totalSteps: 0,
      nodeTransitions: {},
      userResponses: [],
      agentPrompts: [],
      llmCalls: [],
      validationResults: {},
      errors: [],
      duration: 0
    };
    
    this.ensureLogDirectory();
  }

  /**
   * Generate unique session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    if (this.enableFileLogging && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Log conversation step
   * @param {string} step - Step name
   * @param {object} data - Step data
   * @param {string} type - Log type (info, success, error, warning)
   */
  logStep(step, data = {}, type = 'info') {
    const timestamp = new Date();
    const logEntry = {
      sessionId: this.sessionId,
      timestamp: timestamp.toISOString(),
      step,
      type,
      data: {
        ...data,
        stepNumber: this.metrics.totalSteps + 1
      }
    };

    this.logs.push(logEntry);
    this.metrics.totalSteps++;

    if (this.enableConsoleLogging) {
      this.logToConsole(logEntry);
    }

    if (this.enableFileLogging) {
      this.logToFile(logEntry);
    }
  }

  /**
   * Log node transition
   * @param {string} fromNode - Source node
   * @param {string} toNode - Destination node
   * @param {object} context - Transition context
   */
  logNodeTransition(fromNode, toNode, context = {}) {
    const transition = {
      from: fromNode,
      to: toNode,
      timestamp: new Date().toISOString(),
      context
    };

    if (!this.metrics.nodeTransitions[fromNode]) {
      this.metrics.nodeTransitions[fromNode] = [];
    }
    this.metrics.nodeTransitions[fromNode].push(transition);

    this.logStep('node_transition', {
      fromNode,
      toNode,
      context
    }, 'info');
  }

  /**
   * Log user response
   * @param {string} response - User response text
   * @param {string} currentNode - Current conversation node
   * @param {object} extractedData - Extracted data from response
   */
  logUserResponse(response, currentNode, extractedData = {}) {
    const userResponse = {
      response,
      currentNode,
      extractedData,
      timestamp: new Date().toISOString(),
      responseLength: response.length
    };

    this.metrics.userResponses.push(userResponse);

    this.logStep('user_response', userResponse, 'info');
  }

  /**
   * Log agent prompt
   * @param {string} prompt - Agent prompt text
   * @param {string} nodeId - Node ID
   * @param {object} context - Prompt context
   */
  logAgentPrompt(prompt, nodeId, context = {}) {
    const agentPrompt = {
      prompt,
      nodeId,
      context,
      timestamp: new Date().toISOString(),
      promptLength: prompt.length
    };

    this.metrics.agentPrompts.push(agentPrompt);

    this.logStep('agent_prompt', agentPrompt, 'info');
  }

  /**
   * Log LLM call
   * @param {string} function - LLM function called
   * @param {object} input - Input data
   * @param {object} output - Output data
   * @param {number} duration - Call duration in ms
   * @param {boolean} success - Whether call was successful
   */
  logLLMCall(functionName, input, output, duration, success = true) {
    const llmCall = {
      function: functionName,
      input,
      output,
      duration,
      success,
      timestamp: new Date().toISOString()
    };

    this.metrics.llmCalls.push(llmCall);

    this.logStep('llm_call', llmCall, success ? 'info' : 'error');
  }

  /**
   * Log validation result
   * @param {string} field - Field being validated
   * @param {any} value - Value being validated
   * @param {boolean} isValid - Validation result
   * @param {string} reason - Validation reason
   */
  logValidation(field, value, isValid, reason = '') {
    const validation = {
      field,
      value,
      isValid,
      reason,
      timestamp: new Date().toISOString()
    };

    if (!this.metrics.validationResults[field]) {
      this.metrics.validationResults[field] = [];
    }
    this.metrics.validationResults[field].push(validation);

    this.logStep('validation', validation, isValid ? 'success' : 'error');
  }

  /**
   * Log error
   * @param {string} error - Error message
   * @param {object} context - Error context
   * @param {string} severity - Error severity (low, medium, high, critical)
   */
  logError(error, context = {}, severity = 'medium') {
    const errorEntry = {
      error,
      context,
      severity,
      timestamp: new Date().toISOString()
    };

    this.metrics.errors.push(errorEntry);

    this.logStep('error', errorEntry, 'error');
  }

  /**
   * Log conversation completion
   * @param {object} finalState - Final conversation state
   * @param {string} outcome - Conversation outcome
   * @param {object} collectedData - Final collected data
   */
  logCompletion(finalState, outcome, collectedData = {}) {
    this.metrics.duration = new Date() - this.startTime;
    
    const completion = {
      finalState,
      outcome,
      collectedData,
      duration: this.metrics.duration,
      totalSteps: this.metrics.totalSteps,
      timestamp: new Date().toISOString()
    };

    this.logStep('completion', completion, 'success');
    this.generateSessionReport();
  }

  /**
   * Log to console
   * @param {object} logEntry - Log entry
   */
  logToConsole(logEntry) {
    const timestamp = format(new Date(logEntry.timestamp), 'HH:mm:ss.SSS');
    const prefix = `[${timestamp}] [${logEntry.type.toUpperCase()}]`;
    
    switch (logEntry.type) {
      case 'success':
        console.log(`${prefix} [SUCCESS] ${logEntry.step}`);
        break;
      case 'error':
        console.error(`${prefix} [ERROR] ${logEntry.step}: ${logEntry.data.error || 'Unknown error'}`);
        break;
      case 'warning':
        console.warn(`${prefix} [WARNING] ${logEntry.step}`);
        break;
      default:
        console.log(`${prefix} [INFO] ${logEntry.step}`);
    }
  }

  /**
   * Log to file
   * @param {object} logEntry - Log entry
   */
  logToFile(logEntry) {
    const logFile = path.join(this.logDir, `conversation_${this.sessionId}.json`);
    const logData = {
      sessionId: this.sessionId,
      startTime: this.startTime.toISOString(),
      logs: this.logs,
      metrics: this.metrics
    };

    try {
      fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
    } catch (error) {
      console.error('Failed to write log file:', error);
    }
  }

  /**
   * Generate session report
   */
  generateSessionReport() {
    const report = {
      sessionId: this.sessionId,
      startTime: this.startTime.toISOString(),
      endTime: new Date().toISOString(),
      duration: this.metrics.duration,
      totalSteps: this.metrics.totalSteps,
      nodeTransitions: this.metrics.nodeTransitions,
      userResponses: this.metrics.userResponses.length,
      agentPrompts: this.metrics.agentPrompts.length,
      llmCalls: this.metrics.llmCalls.length,
      validationResults: this.metrics.validationResults,
      errors: this.metrics.errors.length,
      successRate: this.calculateSuccessRate(),
      averageResponseTime: this.calculateAverageResponseTime(),
      mostFrequentNode: this.getMostFrequentNode(),
      errorRate: this.calculateErrorRate()
    };

    if (this.enableFileLogging) {
      const reportFile = path.join(this.logDir, `report_${this.sessionId}.json`);
      try {
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      } catch (error) {
        console.error('Failed to write report file:', error);
      }
    }

    return report;
  }

  /**
   * Calculate success rate
   * @returns {number} Success rate percentage
   */
  calculateSuccessRate() {
    const totalValidations = Object.values(this.metrics.validationResults)
      .flat().length;
    const successfulValidations = Object.values(this.metrics.validationResults)
      .flat().filter(v => v.isValid).length;
    
    return totalValidations > 0 ? (successfulValidations / totalValidations) * 100 : 0;
  }

  /**
   * Calculate average response time
   * @returns {number} Average response time in ms
   */
  calculateAverageResponseTime() {
    if (this.metrics.llmCalls.length === 0) return 0;
    
    const totalDuration = this.metrics.llmCalls.reduce((sum, call) => sum + call.duration, 0);
    return totalDuration / this.metrics.llmCalls.length;
  }

  /**
   * Get most frequent node
   * @returns {string} Most frequent node
   */
  getMostFrequentNode() {
    const nodeCounts = {};
    Object.keys(this.metrics.nodeTransitions).forEach(node => {
      nodeCounts[node] = this.metrics.nodeTransitions[node].length;
    });
    
    return Object.keys(nodeCounts).reduce((a, b) => 
      nodeCounts[a] > nodeCounts[b] ? a : b, 'START');
  }

  /**
   * Calculate error rate
   * @returns {number} Error rate percentage
   */
  calculateErrorRate() {
    return this.metrics.totalSteps > 0 ? 
      (this.metrics.errors.length / this.metrics.totalSteps) * 100 : 0;
  }

  /**
   * Get conversation summary
   * @returns {object} Conversation summary
   */
  getSummary() {
    return {
      sessionId: this.sessionId,
      duration: this.metrics.duration,
      totalSteps: this.metrics.totalSteps,
      successRate: this.calculateSuccessRate(),
      errorRate: this.calculateErrorRate(),
      averageResponseTime: this.calculateAverageResponseTime(),
      nodeTransitions: Object.keys(this.metrics.nodeTransitions).length,
      userResponses: this.metrics.userResponses.length,
      llmCalls: this.metrics.llmCalls.length,
      errors: this.metrics.errors.length
    };
  }
}

export default ConversationLogger;
