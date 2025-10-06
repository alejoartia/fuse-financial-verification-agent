import VerificationAgent from './src/agent/VerificationAgent.js';

// Test data
const testApplicant = {
  name: 'Michael Thompson',
  date_of_birth: '1985-03-15',
  ssn_last_four: '7234',
  application_job_tenure: 36
};

// Create agent instance
const agent = new VerificationAgent(testApplicant);

console.log('=== Testing VerificationAgent ===\n');

// Test 1: Initial prompt
console.log('Test 1: Initial prompt');
console.log('Agent:', agent.generatePrompt());
console.log('Current node:', agent.conversationState.currentNodeId);
console.log('');

// Test 2: Process greeting confirmation
console.log('Test 2: Processing greeting confirmation');
await agent.processUserInput('Yes, that\'s me.');
console.log('Agent:', agent.generatePrompt());
console.log('Current node:', agent.conversationState.currentNodeId);
console.log('');

// Test 3: Process DOB
console.log('Test 3: Processing date of birth');
await agent.processUserInput('March 15th, 1985');
console.log('Agent:', agent.generatePrompt());
console.log('Current node:', agent.conversationState.currentNodeId);
console.log('Collected data:', agent.conversationState.collectedData);
console.log('');

// Test 4: Process SSN
console.log('Test 4: Processing SSN');
await agent.processUserInput('7234');
console.log('Agent:', agent.generatePrompt());
console.log('Current node:', agent.conversationState.currentNodeId);
console.log('Collected data:', agent.conversationState.collectedData);
console.log('');

// Test 5: Identity confirmation
console.log('Test 5: Identity confirmation');
await agent.processUserInput('Yes, that\'s correct');
console.log('Agent:', agent.generatePrompt());
console.log('Current node:', agent.conversationState.currentNodeId);
console.log('Identity verified:', agent.identityVerified);
console.log('');

// Test 6: Address collection
console.log('Test 6: Address collection');
await agent.processUserInput('123 Main Street, Denver, Colorado, 80202');
console.log('Agent:', agent.generatePrompt());
console.log('Current node:', agent.conversationState.currentNodeId);
console.log('Collected data:', agent.conversationState.collectedData);
console.log('');

// Test 7: Unit number
console.log('Test 7: Unit number check');
await agent.processUserInput('No, there is no unit number');
console.log('Agent:', agent.generatePrompt());
console.log('Current node:', agent.conversationState.currentNodeId);
console.log('');

// Test 8: Email collection
console.log('Test 8: Email collection');
await agent.processUserInput('michael.thompson@example.com');
console.log('Agent:', agent.generatePrompt());
console.log('Current node:', agent.conversationState.currentNodeId);
console.log('Collected data:', agent.conversationState.collectedData);
console.log('');

// Test 9: Income collection
console.log('Test 9: Income collection');
await agent.processUserInput('$6,500 per month');
console.log('Agent:', agent.generatePrompt());
console.log('Current node:', agent.conversationState.currentNodeId);
console.log('Collected data:', agent.conversationState.collectedData);
console.log('');

// Test 10: Tenure collection
console.log('Test 10: Tenure collection');
await agent.processUserInput('About 8 months now');
console.log('Agent:', agent.generatePrompt());
console.log('Current node:', agent.conversationState.currentNodeId);
console.log('Collected data:', agent.conversationState.collectedData);
console.log('');

// Test 11: Tenure discrepancy check
console.log('Test 11: Tenure discrepancy check');
await agent.processUserInput('I got promoted to a new position 8 months ago, but I\'ve been with the same company for 3 years');
console.log('Agent:', agent.generatePrompt());
console.log('Current node:', agent.conversationState.currentNodeId);
console.log('');

// Test 12: Final confirmation
console.log('Test 12: Final confirmation');
await agent.processUserInput('Yes, that\'s all correct');
console.log('Agent:', agent.generatePrompt());
console.log('Current node:', agent.conversationState.currentNodeId);
console.log('');

console.log('=== Test Complete ===');
console.log('Final collected data:', agent.conversationState.collectedData);
console.log('Identity verified:', agent.identityVerified);
