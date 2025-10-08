import readline from 'readline';
import VerificationAgent from './agent/VerificationAgent.js';
import fs from 'fs';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

/**
 * Load generated mock data from files
 */
async function loadGeneratedData() {
  const dataDir = path.join(process.cwd(), 'data');
  
  try {
    const files = await fs.promises.readdir(dataDir);
    const mockDataFiles = files.filter(file => 
      file.startsWith('mock_test_data') && file.endsWith('.json')
    );
    
    if (mockDataFiles.length === 0) {
      console.log('No generated mock data files found. Using default data.');
      return null;
    }
    
    // Load the most recent file
    const latestFile = mockDataFiles.sort().pop();
    const filePath = path.join(dataDir, latestFile);
    const data = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
    
    console.log(`Loaded generated data from: ${latestFile}`);
    console.log(`Available scenarios: ${data.test_scenarios.length}`);
    
    return data;
  } catch (error) {
    console.error('Error loading generated data:', error);
    return null;
  }
}

/**
 * Select a scenario from generated data
 */
async function selectScenario(generatedData) {
  if (!generatedData) {
    return null;
  }
  
  console.log('\nAvailable scenarios:');
  generatedData.test_scenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.scenario_name} - ${scenario.description}`);
  });
  
  const choice = await askQuestion('\nSelect scenario (number) or press Enter for random: ');
  
  if (choice.trim() === '') {
    // Random selection
    const randomIndex = Math.floor(Math.random() * generatedData.test_scenarios.length);
    return generatedData.test_scenarios[randomIndex];
  }
  
  const selectedIndex = parseInt(choice) - 1;
  if (selectedIndex >= 0 && selectedIndex < generatedData.test_scenarios.length) {
    return generatedData.test_scenarios[selectedIndex];
  }
  
  console.log('Invalid selection, using random scenario.');
  const randomIndex = Math.floor(Math.random() * generatedData.test_scenarios.length);
  return generatedData.test_scenarios[randomIndex];
}

/**
 * Run simulation with generated data
 */
async function runSimulationWithGeneratedData() {
  console.log("=== Financial Verification Agent Simulator with Generated Data ===\n");
  
  // Load generated data
  const generatedData = await loadGeneratedData();
  
  if (generatedData) {
    // Select scenario
    const selectedScenario = await selectScenario(generatedData);
    
    if (selectedScenario) {
      console.log(`\nSelected scenario: ${selectedScenario.scenario_name}`);
      console.log(`Description: ${selectedScenario.description}`);
      console.log(`Expected outcome: ${selectedScenario.expected_outcome}`);
      
      // Use generated applicant data
      const agent = new VerificationAgent(selectedScenario.applicant_data);
      
      console.log(`\nRunning simulation for: ${selectedScenario.applicant_data.name}`);
      console.log(`DOB: ${selectedScenario.applicant_data.date_of_birth}`);
      console.log(`SSN Last 4: ${selectedScenario.applicant_data.ssn_last_four}`);
      console.log(`Address: ${selectedScenario.applicant_data.mailing_address.street}, ${selectedScenario.applicant_data.mailing_address.city}`);
      console.log(`Email: ${selectedScenario.applicant_data.email}`);
      console.log(`Income: $${selectedScenario.applicant_data.monthly_income}/month`);
      console.log(`Tenure: ${selectedScenario.applicant_data.job_tenure_months} months\n`);
      
      let agentPrompt = agent.generatePrompt();
      while (agentPrompt) {
        console.log(`\nAgent: ${agentPrompt}`);
        
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
      console.log(`Scenario outcome: ${selectedScenario.expected_outcome}`);
    }
  } else {
    // Fallback to default data
    console.log('Using default test data...');
    const testApplicant = {
      name: 'Michael Thompson',
      date_of_birth: '1985-03-15',
      ssn_last_four: '7234',
      application_job_tenure: 36
    };
    
    const agent = new VerificationAgent(testApplicant);
    let agentPrompt = agent.generatePrompt();
    
    while (agentPrompt) {
      console.log(`\nAgent: ${agentPrompt}`);
      
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
  }
  
  rl.close();
}

runSimulationWithGeneratedData().catch(console.error);
