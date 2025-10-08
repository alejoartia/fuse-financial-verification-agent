#!/usr/bin/env node

import VerificationAgent from '../src/agent/VerificationAgent.js';
import fs from 'fs';
import path from 'path';

/**
 * Multi-Dataset Evaluation Script
 * Evaluates the agent against multiple mock data files
 */

async function evaluateDataset(filePath) {
  console.log(`\nEvaluating dataset: ${filePath}`);
  
  try {
    const data = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
    const scenarios = data.test_scenarios || [];
    
    let results = {
      total: scenarios.length,
      passed: 0,
      failed: 0,
      errors: 0,
      scenarios: []
    };
    
    for (const scenario of scenarios) {
      try {
        console.log(`\nTesting scenario: ${scenario.scenario_name}`);
        console.log(`   Description: ${scenario.description}`);
        
        const agent = new VerificationAgent(scenario.applicant_data);
        let currentPrompt = agent.generatePrompt();
        let step = 0;
        const maxSteps = 20; // Prevent infinite loops
        
        while (currentPrompt && step < maxSteps) {
          step++;
          
          // Simulate user response based on scenario
          const userResponse = simulateUserResponse(scenario, agent.conversationState.currentNodeId);
          
          if (userResponse === null) {
            console.log(`   WARNING: No response simulation for node: ${agent.conversationState.currentNodeId}`);
            break;
          }
          
          console.log(`   Step ${step}: ${agent.conversationState.currentNodeId}`);
          console.log(`   User: ${userResponse}`);
          
          await agent.processUserInput(userResponse);
          currentPrompt = agent.generatePrompt();
          
          // Check for completion or failure
          if (agent.conversationState.currentNodeId === 'COMPLETION') {
            console.log(`   SUCCESS: Scenario completed successfully`);
            results.passed++;
            results.scenarios.push({
              name: scenario.scenario_name,
              status: 'passed',
              steps: step,
              collectedData: agent.conversationState.collectedData
            });
            break;
          } else if (agent.conversationState.currentNodeId === 'IDENTITY_FAILURE_TERMINATION') {
            console.log(`   FAILED: Identity verification failed`);
            results.failed++;
            results.scenarios.push({
              name: scenario.scenario_name,
              status: 'failed',
              reason: 'identity_verification_failed',
              steps: step
            });
            break;
          }
        }
        
        if (step >= maxSteps) {
          console.log(`   TIMEOUT: Scenario timed out after ${maxSteps} steps`);
          results.errors++;
          results.scenarios.push({
            name: scenario.scenario_name,
            status: 'error',
            reason: 'timeout',
            steps: step
          });
        }
        
      } catch (error) {
        console.error(`   ERROR: Error in scenario ${scenario.scenario_name}:`, error.message);
        results.errors++;
        results.scenarios.push({
          name: scenario.scenario_name,
          status: 'error',
          reason: error.message,
          steps: 0
        });
      }
    }
    
    return results;
    
  } catch (error) {
    console.error(`ERROR: Error reading dataset ${filePath}:`, error);
    return null;
  }
}

function simulateUserResponse(scenario, currentNodeId) {
  const applicantData = scenario.applicant_data;
  
  switch (currentNodeId) {
    case 'START':
      return 'Yes, this is me.';
      
    case 'IDENTITY_VERIFICATION_DOB':
      // Handle partial identity failure scenario
      if (scenario.scenario_name === 'partial_identity_failure_then_success') {
        // First attempt with wrong DOB, then correct
        return applicantData.first_attempt?.date_of_birth || applicantData.date_of_birth || '1985-03-15';
      }
      return applicantData.date_of_birth || '1985-03-15';
      
    case 'IDENTITY_VERIFICATION_SSN':
      // Handle partial identity failure scenario
      if (scenario.scenario_name === 'partial_identity_failure_then_success') {
        return applicantData.first_attempt?.ssn_last_four || applicantData.ssn_last_four || '7234';
      }
      return applicantData.ssn_last_four || '7234';
      
    case 'IDENTITY_VERIFICATION_CONFIRM':
      // Handle partial identity failure scenario - first attempt fails
      if (scenario.scenario_name === 'partial_identity_failure_then_success') {
        return 'No, that\'s not right. Let me try again.';
      }
      return 'Yes, that\'s correct.';
      
    case 'IDENTITY_VERIFICATION_RETRY':
      // Second attempt for partial identity failure
      if (scenario.scenario_name === 'partial_identity_failure_then_success') {
        return applicantData.second_attempt?.date_of_birth || applicantData.date_of_birth;
      }
      return applicantData.date_of_birth || '1985-03-15';
      
    case 'CONTACT_INFO_ADDRESS':
      const address = applicantData.mailing_address || applicantData.complete_address;
      if (scenario.scenario_name === 'address_with_unit_clarification') {
        // Initially provide address without unit
        return applicantData.initial_address || `${address.street}, ${address.city}, ${address.state} ${address.zip_code}`;
      }
      return `${address.street}, ${address.city}, ${address.state} ${address.zip_code}`;
      
    case 'CONTACT_INFO_UNIT':
      const addressForUnit = applicantData.mailing_address || applicantData.complete_address;
      if (scenario.scenario_name === 'address_with_unit_clarification') {
        // Provide unit number when asked
        return addressForUnit.unit || 'No unit number';
      }
      return addressForUnit.unit || 'No unit number';
      
    case 'CONTACT_INFO_EMAIL':
      // Handle no email scenario
      if (scenario.scenario_name === 'no_email_provided') {
        return 'I don\'t have an email address.';
      }
      return applicantData.email || 'test@example.com';
      
    case 'EMPLOYMENT_INCOME':
      return `$${applicantData.monthly_income} per month`;
      
    case 'EMPLOYMENT_TENURE':
      // Handle self-employed scenario
      if (scenario.scenario_name === 'self_employed_applicant') {
        return 'I\'m self-employed, so I don\'t have a traditional job tenure.';
      }
      return `${applicantData.job_tenure_months} months`;
      
    case 'TENURE_DISCREPANCY_CHECK':
      // Handle different scenarios
      if (scenario.scenario_name === 'recent_job_change') {
        return applicantData.job_change_reason || 'I changed jobs for career advancement.';
      }
      return 'I started working there 6 months ago, but I was at my previous job for 2 years before that.';
      
    case 'FINAL_CONFIRMATION':
      return 'Yes, everything looks correct.';
      
    default:
      return null;
  }
}

async function main() {
  console.log('Starting Multi-Dataset Evaluation...\n');
  
  const dataDir = path.join(process.cwd(), 'data');
  
  // Find all mock data files
  const files = await fs.promises.readdir(dataDir);
  const mockDataFiles = files.filter(file => 
    file.startsWith('mock_test_data') && file.endsWith('.json')
  );
  
  if (mockDataFiles.length === 0) {
    console.log('ERROR: No mock data files found in data/ directory');
    console.log('INFO: Run the generator first: node scripts/generate-mock-data.js');
    process.exit(1);
  }
  
  console.log(`Found ${mockDataFiles.length} mock data files:`);
  mockDataFiles.forEach(file => console.log(`   - ${file}`));
  
  let totalResults = {
    datasets: 0,
    totalScenarios: 0,
    totalPassed: 0,
    totalFailed: 0,
    totalErrors: 0,
    datasetResults: []
  };
  
  // Evaluate each dataset
  for (const file of mockDataFiles) {
    const filePath = path.join(dataDir, file);
    const results = await evaluateDataset(filePath);
    
    if (results) {
      totalResults.datasets++;
      totalResults.totalScenarios += results.total;
      totalResults.totalPassed += results.passed;
      totalResults.totalFailed += results.failed;
      totalResults.totalErrors += results.errors;
      totalResults.datasetResults.push({
        file,
        ...results
      });
      
      console.log(`\nResults for ${file}:`);
      console.log(`   Total: ${results.total}`);
      console.log(`   Passed: ${results.passed} (${((results.passed/results.total)*100).toFixed(1)}%)`);
      console.log(`   Failed: ${results.failed} (${((results.failed/results.total)*100).toFixed(1)}%)`);
      console.log(`   Errors: ${results.errors} (${((results.errors/results.total)*100).toFixed(1)}%)`);
    }
  }
  
  // Overall summary
  console.log('\nOVERALL EVALUATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`Datasets evaluated: ${totalResults.datasets}`);
  console.log(`Total scenarios: ${totalResults.totalScenarios}`);
  console.log(`Total passed: ${totalResults.totalPassed} (${((totalResults.totalPassed/totalResults.totalScenarios)*100).toFixed(1)}%)`);
  console.log(`Total failed: ${totalResults.totalFailed} (${((totalResults.totalFailed/totalResults.totalScenarios)*100).toFixed(1)}%)`);
  console.log(`Total errors: ${totalResults.totalErrors} (${((totalResults.totalErrors/totalResults.totalScenarios)*100).toFixed(1)}%)`);
  
  // Detailed breakdown by dataset
  console.log('\nDETAILED BREAKDOWN BY DATASET');
  console.log('='.repeat(50));
  totalResults.datasetResults.forEach(result => {
    console.log(`\n${result.file}:`);
    console.log(`   Scenarios: ${result.total}`);
    console.log(`   Passed: ${result.passed} (${((result.passed/result.total)*100).toFixed(1)}%)`);
    console.log(`   Failed: ${result.failed} (${((result.failed/result.total)*100).toFixed(1)}%)`);
    console.log(`   Errors: ${result.errors} (${((result.errors/result.total)*100).toFixed(1)}%)`);
  });
  
  // Save detailed results
  const resultsFile = path.join(dataDir, `evaluation_results_${Date.now()}.json`);
  await fs.promises.writeFile(resultsFile, JSON.stringify(totalResults, null, 2));
  console.log(`\nDetailed results saved to: ${resultsFile}`);
  
  console.log('\nMulti-dataset evaluation completed!');
}

// Run the evaluation
main().catch(console.error);
