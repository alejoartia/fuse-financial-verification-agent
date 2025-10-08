import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";
import { HumanMessage } from "@langchain/core/messages";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Initialize OpenAI model for synthetic data generation
const model = new ChatOpenAI({ 
  temperature: 0.7, // Higher creativity for data generation
  modelName: "gpt-3.5-turbo",
  openAIApiKey: process.env.OPENAI_API_KEY
});

/**
 * Mock Data Generator for Financial Verification Agent
 * Generates synthetic data for testing without real PII
 */
class MockDataGenerator {
  constructor() {
    this.baseNames = [
      'Michael Thompson', 'Jennifer Martinez', 'Robert Johnson', 'Sarah Williams',
      'David Brown', 'Lisa Garcia', 'James Wilson', 'Maria Rodriguez',
      'Christopher Lee', 'Amanda Taylor', 'Daniel Anderson', 'Jessica Moore'
    ];
    
    this.states = [
      'California', 'Texas', 'Florida', 'New York', 'Colorado', 'Washington',
      'Oregon', 'Arizona', 'Nevada', 'Utah', 'Montana', 'Wyoming'
    ];
    
    this.cities = {
      'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento'],
      'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio'],
      'Florida': ['Miami', 'Tampa', 'Orlando', 'Jacksonville'],
      'New York': ['New York City', 'Buffalo', 'Rochester', 'Albany'],
      'Colorado': ['Denver', 'Colorado Springs', 'Boulder', 'Fort Collins'],
      'Washington': ['Seattle', 'Spokane', 'Tacoma', 'Vancouver']
    };
    
    this.emailDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'company.com', 'techcorp.com', 'business.org', 'enterprise.net'
    ];
  }

  /**
   * Generate random applicant data
   * @param {string} scenario - Type of scenario to generate
   * @returns {object} - Generated applicant data
   */
  async generateApplicant(scenario = 'successful') {
    const baseData = this.generateBaseData();
    
    switch (scenario) {
      case 'successful':
        return this.generateSuccessfulScenario(baseData);
      case 'identity_failure':
        return this.generateIdentityFailureScenario(baseData);
      case 'tenure_discrepancy':
        return this.generateTenureDiscrepancyScenario(baseData);
      case 'income_failure':
        return this.generateIncomeFailureScenario(baseData);
      case 'address_variations':
        return this.generateAddressVariationsScenario(baseData);
      case 'employment_variations':
        return this.generateEmploymentVariationsScenario(baseData);
      case 'self_employed':
        return this.generateSelfEmployedScenario(baseData);
      case 'no_email':
        return this.generateNoEmailScenario(baseData);
      case 'address_clarification':
        return this.generateAddressClarificationScenario(baseData);
      case 'recent_job_change':
        return this.generateRecentJobChangeScenario(baseData);
      case 'partial_identity_failure':
        return this.generatePartialIdentityFailureScenario(baseData);
      default:
        return this.generateSuccessfulScenario(baseData);
    }
  }

  /**
   * Generate base data for all scenarios
   * @returns {object} - Base applicant data
   */
  generateBaseData() {
    const name = this.getRandomItem(this.baseNames);
    const state = this.getRandomItem(this.states);
    const cityOptions = this.cities[state] || ['Default City'];
    const city = this.getRandomItem(cityOptions);
    const emailDomain = this.getRandomItem(this.emailDomains);
    
    return {
      name,
      date_of_birth: this.generateRandomDOB(),
      ssn_last_four: this.generateRandomSSN(),
      state,
      city,
      emailDomain
    };
  }

  /**
   * Generate successful verification scenario
   * @param {object} baseData - Base data
   * @returns {object} - Successful scenario data
   */
  generateSuccessfulScenario(baseData) {
    const income = this.generateRandomIncome(4000, 12000);
    const tenure = this.generateRandomTenure(12, 60);
    
    return {
      scenario_name: 'successful_verification',
      description: 'Standard successful flow with employed applicant',
      applicant_data: {
        name: baseData.name,
        date_of_birth: baseData.date_of_birth,
        ssn_last_four: baseData.ssn_last_four,
        mailing_address: this.generateAddress(baseData.state, baseData.city),
        email: this.generateEmail(baseData.name, baseData.emailDomain),
        monthly_income: income,
        job_tenure_months: tenure,
        application_job_tenure: tenure + this.getRandomInt(-6, 6) // Small variation
      },
      expected_flow: ['identity_verification', 'contact_information', 'employment_verification', 'final_confirmation'],
      expected_outcome: 'success'
    };
  }

  /**
   * Generate identity failure scenario
   * @param {object} baseData - Base data
   * @returns {object} - Identity failure scenario data
   */
  generateIdentityFailureScenario(baseData) {
    return {
      scenario_name: 'identity_verification_failure',
      description: 'Wrong SSN and DOB provided multiple times',
      applicant_data: {
        name: baseData.name,
        correct_date_of_birth: baseData.date_of_birth,
        correct_ssn_last_four: baseData.ssn_last_four,
        provided_date_of_birth: this.generateRandomDOB(), // Wrong DOB
        provided_ssn_last_four: this.generateRandomSSN() // Wrong SSN
      },
      expected_flow: ['identity_verification'],
      expected_outcome: 'failure',
      failure_reason: 'identity_verification_failed'
    };
  }

  /**
   * Generate tenure discrepancy scenario
   * @param {object} baseData - Base data
   * @returns {object} - Tenure discrepancy scenario data
   */
  generateTenureDiscrepancyScenario(baseData) {
    const statedTenure = this.generateRandomTenure(6, 18);
    const applicationTenure = statedTenure + this.getRandomInt(24, 48); // Significant difference
    
    return {
      scenario_name: 'job_tenure_discrepancy',
      description: 'Significant difference between stated and application tenure',
      applicant_data: {
        name: baseData.name,
        date_of_birth: baseData.date_of_birth,
        ssn_last_four: baseData.ssn_last_four,
        mailing_address: this.generateAddress(baseData.state, baseData.city),
        email: this.generateEmail(baseData.name, baseData.emailDomain),
        monthly_income: this.generateRandomIncome(5000, 10000),
        job_tenure_months: statedTenure,
        application_job_tenure: applicationTenure
      },
      expected_flow: ['identity_verification', 'contact_information', 'employment_verification', 'final_confirmation'],
      expected_outcome: 'success_with_clarification'
    };
  }

  /**
   * Generate income failure scenario
   * @param {object} baseData - Base data
   * @returns {object} - Income failure scenario data
   */
  generateIncomeFailureScenario(baseData) {
    return {
      scenario_name: 'income_verification_failure',
      description: 'Invalid income information provided',
      applicant_data: {
        name: baseData.name,
        date_of_birth: baseData.date_of_birth,
        ssn_last_four: baseData.ssn_last_four,
        mailing_address: this.generateAddress(baseData.state, baseData.city),
        email: this.generateEmail(baseData.name, baseData.emailDomain),
        monthly_income: this.generateRandomIncome(50000, 100000), // Very high income that might cause validation issues
        job_tenure_months: this.generateRandomTenure(12, 36)
      },
      expected_flow: ['identity_verification', 'contact_information', 'employment_verification'],
      expected_outcome: 'failure',
      failure_reason: 'income_verification_failed'
    };
  }

  /**
   * Generate address variations scenario
   * @param {object} baseData - Base data
   * @returns {object} - Address variations scenario data
   */
  generateAddressVariationsScenario(baseData) {
    const hasUnit = Math.random() > 0.5;
    const address = this.generateAddress(baseData.state, baseData.city, hasUnit);
    
    return {
      scenario_name: 'address_variations',
      description: 'Different address types and formats',
      applicant_data: {
        name: baseData.name,
        date_of_birth: baseData.date_of_birth,
        ssn_last_four: baseData.ssn_last_four,
        mailing_address: address,
        email: this.generateEmail(baseData.name, baseData.emailDomain),
        monthly_income: this.generateRandomIncome(3000, 8000),
        job_tenure_months: this.generateRandomTenure(6, 48)
      },
      expected_flow: ['identity_verification', 'contact_information', 'employment_verification', 'final_confirmation'],
      expected_outcome: 'success'
    };
  }

  /**
   * Generate employment variations scenario
   * @param {object} baseData - Base data
   * @returns {object} - Employment variations scenario data
   */
  generateEmploymentVariationsScenario(baseData) {
    const employmentTypes = ['employed', 'new_employee', 'contractor', 'part_time'];
    const employmentType = this.getRandomItem(employmentTypes);
    
    let income, tenure;
    switch (employmentType) {
      case 'new_employee':
        income = this.generateRandomIncome(3000, 5000);
        tenure = this.generateRandomTenure(1, 6);
        break;
      case 'contractor':
        income = this.generateRandomIncome(8000, 15000);
        tenure = this.generateRandomTenure(3, 12);
        break;
      case 'part_time':
        income = this.generateRandomIncome(1500, 3000);
        tenure = this.generateRandomTenure(6, 24);
        break;
      default:
        income = this.generateRandomIncome(4000, 10000);
        tenure = this.generateRandomTenure(12, 60);
    }
    
    return {
      scenario_name: 'employment_variations',
      description: `Different employment status: ${employmentType}`,
      applicant_data: {
        name: baseData.name,
        date_of_birth: baseData.date_of_birth,
        ssn_last_four: baseData.ssn_last_four,
        mailing_address: this.generateAddress(baseData.state, baseData.city),
        email: this.generateEmail(baseData.name, baseData.emailDomain),
        monthly_income: income,
        job_tenure_months: tenure,
        employment_type: employmentType
      },
      expected_flow: ['identity_verification', 'contact_information', 'employment_verification', 'final_confirmation'],
      expected_outcome: 'success'
    };
  }

  /**
   * Generate self-employed scenario
   * @param {object} baseData - Base data
   * @returns {object} - Self-employed scenario data
   */
  generateSelfEmployedScenario(baseData) {
    const address = this.generateAddress(baseData.state, baseData.city);
    return {
      scenario_name: 'self_employed_applicant',
      description: 'Self-employed applicant with variable income',
      applicant_data: {
        name: baseData.name,
        date_of_birth: baseData.date_of_birth,
        ssn_last_four: baseData.ssn_last_four,
        mailing_address: address,
        email: this.generateEmail(baseData.name, baseData.emailDomain),
        monthly_income: this.generateRandomIncome(5000, 12000),
        employment_status: 'self_employed',
        job_tenure_months: this.generateRandomTenure(12, 120) // Always generate tenure
      },
      expected_flow: ['identity_verification', 'contact_information', 'employment_verification', 'final_confirmation'],
      expected_outcome: 'success'
    };
  }

  /**
   * Generate no email scenario
   * @param {object} baseData - Base data
   * @returns {object} - No email scenario data
   */
  generateNoEmailScenario(baseData) {
    const address = this.generateAddress(baseData.state, baseData.city);
    return {
      scenario_name: 'no_email_provided',
      description: 'Applicant doesn\'t have email address',
      applicant_data: {
        name: baseData.name,
        date_of_birth: baseData.date_of_birth,
        ssn_last_four: baseData.ssn_last_four,
        mailing_address: address,
        email: this.generateEmail(baseData.name, baseData.emailDomain), // Always generate email
        monthly_income: this.generateRandomIncome(2000, 5000),
        job_tenure_months: this.generateRandomTenure(60, 240) // Older applicant
      },
      expected_flow: ['identity_verification', 'contact_information', 'employment_verification', 'final_confirmation'],
      expected_outcome: 'success'
    };
  }

  /**
   * Generate address clarification scenario
   * @param {object} baseData - Base data
   * @returns {object} - Address clarification scenario data
   */
  generateAddressClarificationScenario(baseData) {
    const address = this.generateAddress(baseData.state, baseData.city, true);
    return {
      scenario_name: 'address_with_unit_clarification',
      description: 'User initially forgets unit number',
      applicant_data: {
        name: baseData.name,
        date_of_birth: baseData.date_of_birth,
        ssn_last_four: baseData.ssn_last_four,
        initial_address: `${address.street}, ${address.city}, ${address.state}, ${address.zip_code}`,
        complete_address: {
          street: address.street,
          unit: address.unit,
          city: address.city,
          state: address.state,
          zip_code: address.zip_code
        },
        email: this.generateEmail(baseData.name, baseData.emailDomain),
        monthly_income: this.generateRandomIncome(4000, 8000),
        job_tenure_months: this.generateRandomTenure(12, 48)
      },
      expected_flow: ['identity_verification', 'contact_information', 'employment_verification', 'final_confirmation'],
      expected_outcome: 'success'
    };
  }

  /**
   * Generate recent job change scenario
   * @param {object} baseData - Base data
   * @returns {object} - Recent job change scenario data
   */
  generateRecentJobChangeScenario(baseData) {
    const tenure = this.generateRandomTenure(1, 12);
    const address = this.generateAddress(baseData.state, baseData.city);
    return {
      scenario_name: 'recent_job_change',
      description: 'Applicant changed jobs recently, under tenure threshold',
      applicant_data: {
        name: baseData.name,
        date_of_birth: baseData.date_of_birth,
        ssn_last_four: baseData.ssn_last_four,
        mailing_address: address,
        email: this.generateEmail(baseData.name, baseData.emailDomain),
        monthly_income: this.generateRandomIncome(3000, 7000),
        job_tenure_months: tenure,
        application_job_tenure: tenure,
        job_change_reason: 'Career advancement opportunity'
      },
      expected_flow: ['identity_verification', 'contact_information', 'employment_verification', 'final_confirmation'],
      expected_outcome: 'success_with_clarification'
    };
  }

  /**
   * Generate partial identity failure scenario
   * @param {object} baseData - Base data
   * @returns {object} - Partial identity failure scenario data
   */
  generatePartialIdentityFailureScenario(baseData) {
    const wrongDob = this.generateRandomDOB();
    const wrongSsn = this.generateRandomSSN();
    
    return {
      scenario_name: 'partial_identity_failure_then_success',
      description: 'User provides wrong info first, then corrects it',
      applicant_data: {
        name: baseData.name,
        date_of_birth: baseData.date_of_birth,
        ssn_last_four: baseData.ssn_last_four,
        first_attempt: {
          date_of_birth: wrongDob,
          ssn_last_four: wrongSsn
        },
        second_attempt: {
          date_of_birth: baseData.date_of_birth,
          ssn_last_four: baseData.ssn_last_four
        },
        mailing_address: this.generateAddress(baseData.state, baseData.city),
        email: this.generateEmail(baseData.name, baseData.emailDomain),
        monthly_income: this.generateRandomIncome(4000, 10000),
        job_tenure_months: this.generateRandomTenure(24, 120)
      },
      expected_flow: ['identity_verification', 'contact_information', 'employment_verification', 'final_confirmation'],
      expected_outcome: 'success'
    };
  }

  /**
   * Generate random date of birth
   * @returns {string} - Random DOB in YYYY-MM-DD format
   */
  generateRandomDOB() {
    const year = this.getRandomInt(1960, 2000);
    const month = this.getRandomInt(1, 12);
    const day = this.getRandomInt(1, 28);
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  /**
   * Generate random SSN last 4 digits
   * @returns {string} - Random SSN last 4
   */
  generateRandomSSN() {
    return this.getRandomInt(1000, 9999).toString();
  }

  /**
   * Generate random income
   * @param {number} min - Minimum income
   * @param {number} max - Maximum income
   * @returns {number} - Random income
   */
  generateRandomIncome(min, max) {
    return this.getRandomInt(min, max);
  }

  /**
   * Generate random tenure in months
   * @param {number} min - Minimum months
   * @param {number} max - Maximum months
   * @returns {number} - Random tenure
   */
  generateRandomTenure(min, max) {
    return this.getRandomInt(min, max);
  }

  /**
   * Generate random address
   * @param {string} state - State
   * @param {string} city - City
   * @param {boolean} hasUnit - Whether to include unit
   * @returns {object} - Address object
   */
  generateAddress(state, city, hasUnit = false) {
    const streetNumbers = this.getRandomInt(100, 9999);
    const streetNames = ['Main St', 'Oak Ave', 'Pine St', 'Elm St', 'Maple Ave', 'Cedar St'];
    const streetName = this.getRandomItem(streetNames);
    
    // Always generate a unit - never null
    const unitTypes = ['Apt', 'Unit', 'Suite', 'Apt', 'Unit']; // More Apt/Unit for realism
    const unitType = this.getRandomItem(unitTypes);
    const unitNumber = this.getRandomInt(1, 50);
    const unit = `${unitType} ${unitNumber}`;
    
    const address = {
      street: `${streetNumbers} ${streetName}`,
      city: city,
      state: state,
      zip_code: this.generateRandomZIP(state),
      unit: unit // Always include a unit value
    };
    
    return address;
  }

  /**
   * Generate random ZIP code based on state
   * @param {string} state - State
   * @returns {string} - Random ZIP code
   */
  generateRandomZIP(state) {
    const zipRanges = {
      'California': [90000, 96199],
      'Texas': [75000, 79999],
      'Florida': [32000, 34999],
      'New York': [10000, 14999],
      'Colorado': [80000, 81999],
      'Washington': [98000, 99999]
    };
    
    const range = zipRanges[state] || [10000, 99999];
    return this.getRandomInt(range[0], range[1]).toString();
  }

  /**
   * Generate random email
   * @param {string} name - Full name
   * @param {string} domain - Email domain
   * @returns {string} - Random email
   */
  generateEmail(name, domain) {
    const [firstName, lastName] = name.toLowerCase().split(' ');
    const emailVariations = [
      `${firstName}.${lastName}@${domain}`,
      `${firstName}${lastName}@${domain}`,
      `${firstName.charAt(0)}${lastName}@${domain}`,
      `${firstName}${lastName.charAt(0)}@${domain}`
    ];
    
    return this.getRandomItem(emailVariations);
  }

  /**
   * Generate multiple test scenarios
   * @param {number} count - Number of scenarios to generate
   * @param {string} scenarioType - Type of scenarios to generate
   * @returns {Array} - Array of generated scenarios
   */
  async generateMultipleScenarios(count = 5, scenarioType = 'mixed') {
    const scenarios = [];
    
    for (let i = 0; i < count; i++) {
      let scenario;
      if (scenarioType === 'mixed') {
        const scenarioTypes = [
          'successful', 'identity_failure', 'tenure_discrepancy', 'income_failure', 
          'address_variations', 'employment_variations', 'self_employed', 'no_email',
          'address_clarification', 'recent_job_change', 'partial_identity_failure'
        ];
        const randomType = this.getRandomItem(scenarioTypes);
        scenario = await this.generateApplicant(randomType);
      } else {
        scenario = await this.generateApplicant(scenarioType);
      }
      
      scenarios.push(scenario);
    }
    
    return scenarios;
  }

  /**
   * Save generated scenarios to file
   * @param {Array} scenarios - Generated scenarios
   * @param {string} filename - Output filename
   */
  async saveScenariosToFile(scenarios, filename = 'mock_test_data_generated.json') {
    const outputPath = path.join(process.cwd(), 'data', filename);
    const outputData = {
      test_scenarios: scenarios,
      system_variables: {
        job_tenure_threshold_months: 15,
        max_identity_attempts: 2,
        required_fields: ["name", "date_of_birth", "ssn_last_four", "mailing_address", "monthly_income"],
        optional_fields: ["email", "unit_number"]
      },
      response_templates: {
        identity_failure: "I understand this can be frustrating. However, the last four digits of your Social Security Number and date of birth are required to proceed with the verification. Since we're unable to verify this information today, I'll need to conclude our call. Thank you for your time, and please feel free to call back when you have this information available.",
        job_tenure_discrepancy: "I show on your application that you've been employed for {application_tenure} months. Can you help me understand the difference between what you're telling me now - {stated_tenure} months - and what's shown on the application?",
        unit_number_prompt: "Is there a unit number or apartment number for this address?",
        final_confirmation: "Let me summarize the information we've collected today to make sure everything is accurate..."
      }
    };
    
    try {
      await fs.promises.writeFile(outputPath, JSON.stringify(outputData, null, 2));
      console.log(`Generated scenarios saved to: ${outputPath}`);
      console.log(`Generated ${scenarios.length} scenarios`);
    } catch (error) {
      console.error('Error saving scenarios:', error);
    }
  }

  /**
   * Generate scenarios using LLM for more realistic data
   * @param {number} count - Number of scenarios to generate
   * @returns {Array} - LLM-generated scenarios
   */
  async generateWithLLM(count = 3) {
    console.log('Generating scenarios using LLM...');
    
    const functionSchema = {
      name: "generate_test_scenarios",
      description: "Generate realistic test scenarios for financial verification",
      parameters: {
        type: "object",
        properties: {
          scenarios: {
            type: "array",
            items: {
              type: "object",
              properties: {
                scenario_name: { type: "string" },
                description: { type: "string" },
                applicant_data: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    date_of_birth: { type: "string" },
                    ssn_last_four: { type: "string" },
                    mailing_address: {
                      type: "object",
                      properties: {
                        street: { type: "string" },
                        unit: { type: "string" },
                        city: { type: "string" },
                        state: { type: "string" },
                        zip_code: { type: "string" }
                      }
                    },
                    email: { type: "string" },
                    monthly_income: { type: "number" },
                    job_tenure_months: { type: "number" },
                    application_job_tenure: { type: "number" }
                  }
                },
                expected_outcome: { type: "string" }
              }
            }
          }
        },
        required: ["scenarios"]
      }
    };

    try {
      const runnable = model.bind({
        functions: [functionSchema],
        function_call: { name: "generate_test_scenarios" },
      }).pipe(new JsonOutputFunctionsParser());

      const result = await runnable.invoke([
        new HumanMessage(`Generate ${count} realistic test scenarios for a financial verification system. Include various scenarios: successful verification, identity failures, tenure discrepancies, and different employment statuses. Use realistic but fictional data - no real PII.`)
      ]);
      
      console.log('LLM-generated scenarios created');
      return result.scenarios;
    } catch (error) {
      console.error('Error generating with LLM:', error);
      console.log('Falling back to rule-based generation...');
      return await this.generateMultipleScenarios(count, 'mixed');
    }
  }

  // Utility methods
  getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

export default MockDataGenerator;
