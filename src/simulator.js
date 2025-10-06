import readline from 'readline';
import VerificationAgent from './agent/VerificationAgent.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function runSimulation() {
  console.log("=== Financial Verification Agent Simulator ===\n");
  
  // Test data
  const testApplicant = {
    name: 'Michael Thompson',
    date_of_birth: '1985-03-15',
    ssn_last_four: '7234',
    application_job_tenure: 36
  };
  
  console.log(`Running simulation for: ${testApplicant.name}\n`);
  
  const agent = new VerificationAgent(testApplicant);
  
  let agentPrompt = agent.generatePrompt();
  while (agentPrompt) {
    console.log(`\nAgent: ${agentPrompt}`);
    
    const currentNode = agent.conversationState.currentNodeId;
    if (agent.conversationState.currentNodeId === 'COMPLETION' || 
        agent.conversationState.currentNodeId === 'IDENTITY_FAILURE_TERMINATION') {
      break;
    }
    
    const userResponse = await askQuestion('You: ');
    await agent.processUserInput(userResponse);
    agentPrompt = agent.generatePrompt();
  }
  
  console.log("\n=== Simulation Ended ===");
  console.log("Final collected data:", agent.conversationState.collectedData);
  console.log("Identity verified:", agent.identityVerified);
  rl.close();
}

runSimulation().catch(console.error);
