import VerificationAgent from '../agent/VerificationAgent.js';
import testData from '../../data/mock_test_data.json' assert { type: 'json' };

/**
 * Comprehensive evaluation framework for the verification agent
 * Tests all scenarios from mock_test_data.json
 */
class AgentEvaluator {
  constructor() {
    this.results = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  /**
   * Run evaluation for a single scenario
   * @param {object} scenario - Test scenario from mock data
   * @returns {object} - Evaluation result
   */
  async evaluateScenario(scenario) {
    console.log(`\n=== Evaluating: ${scenario.scenario_name} ===`);
    console.log(`Description: ${scenario.description}`);
    
    const agent = new VerificationAgent(scenario.applicant_data, testData.system_variables);
    const result = {
      scenario_name: scenario.scenario_name,
      expected_outcome: scenario.expected_outcome,
      actual_outcome: null,
      passed: false,
      steps: [],
      errors: []
    };

    try {
      // Simulate the conversation flow
      await this.simulateConversation(agent, scenario, result);
      
      // Determine if test passed
      result.passed = this.evaluateResult(result, scenario);
      
    } catch (error) {
      result.errors.push(error.message);
      console.error(`Error in scenario ${scenario.scenario_name}:`, error);
    }

    this.results.push(result);
    this.totalTests++;
    if (result.passed) this.passedTests++;

    return result;
  }

  /**
   * Simulate the conversation flow for a scenario
   * @param {VerificationAgent} agent - The agent instance
   * @param {object} scenario - Test scenario
   * @param {object} result - Result object to populate
   */
  async simulateConversation(agent, scenario, result) {
    let step = 0;
    let agentPrompt = agent.generatePrompt();
    
    while (agentPrompt && step < 20) { // Prevent infinite loops
      result.steps.push({
        step: step + 1,
        node: agent.conversationState.currentNodeId,
        agent_prompt: agentPrompt,
        user_response: this.getMockUserResponse(agent, scenario, step)
      });

      // Get mock user response
      const userResponse = this.getMockUserResponse(agent, scenario, step);
      
      // Process the response
      await agent.processUserInput(userResponse);
      
      // Check if we've reached a terminal state
      if (agent.conversationState.currentNodeId === 'COMPLETION' || 
          agent.conversationState.currentNodeId === 'IDENTITY_FAILURE_TERMINATION') {
        result.actual_outcome = agent.conversationState.currentNodeId === 'COMPLETION' ? 'success' : 'failure';
        break;
      }
      
      agentPrompt = agent.generatePrompt();
      step++;
    }

    // Final state analysis
    result.final_state = {
      node: agent.conversationState.currentNodeId,
      identity_verified: agent.identityVerified,
      collected_data: agent.conversationState.collectedData
    };
  }

  /**
   * Get mock user response based on current state and scenario
   * @param {VerificationAgent} agent - The agent instance
   * @param {object} scenario - Test scenario
   * @param {number} step - Current step number
   * @returns {string} - Mock user response
   */
  getMockUserResponse(agent, scenario, step) {
    const currentNode = agent.conversationState.currentNodeId;
    const data = scenario.applicant_data;

    switch (currentNode) {
      case 'START':
        return 'Yes, that\'s me.';
      
      case 'IDENTITY_VERIFICATION_DOB':
        return data.provided_date_of_birth || data.date_of_birth || '1985-03-15';
      
      case 'IDENTITY_VERIFICATION_SSN':
        return data.provided_ssn_last_four || data.ssn_last_four || '7234';
      
      case 'IDENTITY_VERIFICATION_CONFIRM':
        return 'Yes, that\'s correct.';
      
      case 'CONTACT_INFO_ADDRESS':
        if (data.mailing_address) {
          const addr = data.mailing_address;
          return `${addr.street}, ${addr.city}, ${addr.state}, ${addr.zip_code}`;
        }
        return '123 Main Street, Denver, Colorado, 80202';
      
      case 'CONTACT_INFO_UNIT':
        return data.mailing_address?.unit ? 'Yes, it\'s ' + data.mailing_address.unit : 'No, there is no unit number';
      
      case 'CONTACT_INFO_EMAIL':
        return data.email || 'test@example.com';
      
      case 'EMPLOYMENT_INCOME':
        return `$${data.monthly_income || 5000} per month`;
      
      case 'EMPLOYMENT_TENURE':
        return `About ${data.job_tenure_months || 24} months`;
      
      case 'TENURE_DISCREPANCY_CHECK':
        return 'I got promoted to a new position recently, but I\'ve been with the same company for years.';
      
      case 'FINAL_CONFIRMATION':
        return 'Yes, that\'s all correct.';
      
      default:
        return 'Yes';
    }
  }

  /**
   * Evaluate if the test result matches expectations
   * @param {object} result - Test result
   * @param {object} scenario - Test scenario
   * @returns {boolean} - Whether test passed
   */
  evaluateResult(result, scenario) {
    const expected = scenario.expected_outcome;
    const actual = result.actual_outcome;

    // Check basic outcome match
    if (expected === 'success' && actual === 'success') {
      return true;
    }
    if (expected === 'failure' && actual === 'failure') {
      return true;
    }
    if (expected === 'success_with_clarification' && actual === 'success') {
      return true;
    }

    return false;
  }

  /**
   * Run all evaluation scenarios
   */
  async runAllEvaluations() {
    console.log('🚀 Starting Agent Evaluation Framework');
    console.log('=====================================');

    for (const scenario of testData.test_scenarios) {
      await this.evaluateScenario(scenario);
    }

    this.printResults();
  }

  /**
   * Print evaluation results
   */
  printResults() {
    console.log('\n📊 EVALUATION RESULTS');
    console.log('====================');
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.totalTests - this.passedTests}`);
    console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);

    console.log('\n📋 DETAILED RESULTS');
    console.log('==================');
    
    this.results.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`\n${index + 1}. ${result.scenario_name} - ${status}`);
      console.log(`   Expected: ${result.expected_outcome}`);
      console.log(`   Actual: ${result.actual_outcome}`);
      console.log(`   Steps: ${result.steps.length}`);
      
      if (result.errors.length > 0) {
        console.log(`   Errors: ${result.errors.join(', ')}`);
      }
    });

    // Performance metrics
    const avgSteps = this.results.reduce((sum, r) => sum + r.steps.length, 0) / this.results.length;
    console.log(`\n📈 PERFORMANCE METRICS`);
    console.log(`Average Steps per Conversation: ${avgSteps.toFixed(1)}`);
    
    // Security analysis
    const securityTests = this.results.filter(r => r.scenario_name.includes('identity'));
    const securityPassed = securityTests.filter(r => r.passed).length;
    console.log(`Security Tests: ${securityPassed}/${securityTests.length} passed`);
  }
}

// Run the evaluation
async function main() {
  const evaluator = new AgentEvaluator();
  await evaluator.runAllEvaluations();
}

// Export for use in other modules
export { AgentEvaluator };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
