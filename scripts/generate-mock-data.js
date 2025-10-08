#!/usr/bin/env node

import MockDataGenerator from '../src/utils/mockDataGenerator.js';
import path from 'path';
import fs from 'fs';

/**
 * Mock Data Generation Script
 * Generates synthetic test data for the financial verification agent
 */

async function main() {
  console.log('Starting Mock Data Generation...\n');
  
  const generator = new MockDataGenerator();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const count = parseInt(args[0]) || 10;
  const type = args[1] || 'mixed';
  const useLLM = args.includes('--llm');
  const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || `mock_test_data_${Date.now()}.json`;
  
  console.log(`Configuration:`);
  console.log(`   Count: ${count} scenarios`);
  console.log(`   Type: ${type}`);
  console.log(`   Use LLM: ${useLLM ? 'Yes' : 'No'}`);
  console.log(`   Output: ${outputFile}\n`);
  
  try {
    let scenarios;
    
    if (useLLM) {
      console.log('Generating scenarios using LLM...');
      scenarios = await generator.generateWithLLM(count);
    } else {
      console.log('Generating scenarios using rule-based approach...');
      scenarios = await generator.generateMultipleScenarios(count, type);
    }
    
    // Save to file
    await generator.saveScenariosToFile(scenarios, outputFile);
    
    console.log('\nMock data generation completed!');
    console.log(`Output file: data/${outputFile}`);
    console.log(`Generated ${scenarios.length} scenarios`);
    
    // Display summary
    const scenarioTypes = scenarios.reduce((acc, scenario) => {
      acc[scenario.scenario_name] = (acc[scenario.scenario_name] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nScenario Summary:');
    Object.entries(scenarioTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
    
  } catch (error) {
    console.error('Error generating mock data:', error);
    process.exit(1);
  }
}

// Help function
function showHelp() {
  console.log(`
Mock Data Generator for Financial Verification Agent

Usage:
  node scripts/generate-mock-data.js [count] [type] [options]

Arguments:
  count     Number of scenarios to generate (default: 10)
  type      Type of scenarios: mixed, successful, identity_failure, tenure_discrepancy, income_failure, address_variations, employment_variations (default: mixed)

Options:
  --llm                    Use LLM for more realistic data generation
  --output=filename.json   Specify output filename (default: mock_test_data_TIMESTAMP.json)

Examples:
  node scripts/generate-mock-data.js 5 mixed
  node scripts/generate-mock-data.js 10 successful --llm
  node scripts/generate-mock-data.js 20 mixed --output=test_scenarios.json
  node scripts/generate-mock-data.js 15 identity_failure --llm --output=failure_scenarios.json

Generated files will be saved in the data/ directory.
`);
}

// Check for help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run the generator
main().catch(console.error);
