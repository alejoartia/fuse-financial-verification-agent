import { nodes } from './conversationFlow.js';
import { extractEntities, getConfirmation } from '../services/llmService.js';
import { validateDob, validateSsnLast4, validateEmail, validateIncome, validateTenure, validateAddress } from '../utils/validators.js';
import { formatSpokenDate, formatSpokenDigits, formatSpokenEmail, formatSpokenCurrency, formatSpokenAddress } from '../utils/formatters.js';
import ConversationLogger from '../utils/conversationLogger.js';

class VerificationAgent {
  constructor(applicantData, config = {}) {
    // Store the "ground truth" data from the database
    this.applicantData = applicantData;
    
    // Initialize conversation state
    this.conversationState = {
      currentNodeId: 'START',
      attempts: {
        identity: 0
      },
      collectedData: {},
      context: {
        applicantName: this.applicantData.name
      }
    };
    
    // Configuration with defaults
    this.config = {
      jobTenureThreshold: config.jobTenureThreshold || parseInt(process.env.JOB_TENURE_THRESHOLD_MONTHS) || 24,
      maxIdentityAttempts: config.maxIdentityAttempts || parseInt(process.env.MAX_IDENTITY_ATTEMPTS) || 2
    };
    
    // Security gate
    this.identityVerified = false;
    
    // Initialize conversation logger
    this.logger = new ConversationLogger({
      enableFileLogging: config.enableLogging !== false,
      enableConsoleLogging: config.enableConsoleLogging !== false,
      logDir: config.logDir || 'logs'
    });
    
    // Log conversation start
    this.logger.logStep('conversation_start', {
      applicantName: this.applicantData.name,
      config: this.config
    });
  }

  /**
   * Generates the next prompt for the user
   * @returns {string} - The next prompt to send to the user
   */
  generatePrompt() {
    const currentNode = nodes[this.conversationState.currentNodeId];
    if (!currentNode) {
      return "Error: Conversation node not found.";
    }
    
    // Update context for the prompt template
    this.updateContextForPrompt();
    
    return currentNode.prompt(this.conversationState.context);
  }

  /**
   * Main method to process user input
   * @param {string} userResponse - The user's response
   * @returns {Promise<string>} - The next prompt or termination message
   */
  async processUserInput(userResponse) {
    const currentNode = nodes[this.conversationState.currentNodeId];
    
    if (!currentNode) {
      this.logger.logError(`Current node not found: ${this.conversationState.currentNodeId}`, {
        currentNodeId: this.conversationState.currentNodeId
      }, 'high');
      return "Error: Current node not found.";
    }
    
    // Log user response
    this.logger.logUserResponse(userResponse, this.conversationState.currentNodeId);
    
    // Execute the handler for the current node
    await this[currentNode.handler](userResponse);
    
    // Check if we've reached a terminal state
    if (nodes[this.conversationState.currentNodeId]?.isTerminal) {
      this.logger.logCompletion(this.conversationState, 'terminal', this.conversationState.collectedData);
      return this.generatePrompt();
    }
    
    // Generate the next prompt
    return this.generatePrompt();
  }

  // --- HANDLER IMPLEMENTATIONS ---

  /**
   * Handles greeting confirmation
   * @param {string} userResponse - User's response to greeting
   */
  async handleGreetingConfirmation(userResponse) {
    // Simple confirmation check (in production, you'd use LLM)
    if (userResponse.toLowerCase().includes('yes') || userResponse.toLowerCase().includes('yeah')) {
      this.transitionTo('IDENTITY_VERIFICATION_DOB');
    } else {
      this.transitionTo('INCORRECT_PERSON_TERMINATION');
    }
  }

  /**
   * Handles date of birth collection
   * @param {string} userResponse - User's date of birth response
   */
  async handleDobCollection(userResponse) {
    try {
      // Use LLM to extract the date
      const { date } = await extractEntities(userResponse, { date: 'The user\'s date of birth in YYYY-MM-DD format' });
      
      if (date && validateDob(date)) {
        this.conversationState.collectedData.dob = date;
        this.transitionTo('IDENTITY_VERIFICATION_SSN');
      } else {
        // Ask again if invalid
        this.conversationState.currentNodeId = 'IDENTITY_VERIFICATION_DOB';
      }
    } catch (error) {
      console.error('Error extracting DOB:', error);
      this.conversationState.currentNodeId = 'IDENTITY_VERIFICATION_DOB';
    }
  }

  /**
   * Handles SSN collection
   * @param {string} userResponse - User's SSN response
   */
  async handleSsnCollection(userResponse) {
    try {
      // Use LLM to extract digits
      const { ssn } = await extractEntities(userResponse, { ssn: 'The last 4 digits of the user\'s Social Security Number' });
      
      if (ssn && validateSsnLast4(ssn)) {
        this.conversationState.collectedData.ssnLast4 = ssn;
        this.transitionTo('IDENTITY_VERIFICATION_CONFIRM');
      } else {
        // Ask again if invalid
        this.conversationState.currentNodeId = 'IDENTITY_VERIFICATION_SSN';
      }
    } catch (error) {
      console.error('Error extracting SSN:', error);
      this.conversationState.currentNodeId = 'IDENTITY_VERIFICATION_SSN';
    }
  }
  
  /**
   * Handles identity confirmation
   * @param {string} userResponse - User's confirmation response
   */
  async handleIdentityConfirmation(userResponse) {
    // Check if user confirmed the information
    if (userResponse.toLowerCase().includes('yes') || userResponse.toLowerCase().includes('correct')) {
      const isVerified = this.validateIdentity(
        this.conversationState.collectedData.dob,
        this.conversationState.collectedData.ssnLast4
      );

      if (isVerified) {
        this.identityVerified = true;
        this.transitionTo(nodes['IDENTITY_VERIFICATION_CONFIRM'].onSuccess);
      } else {
        this.conversationState.attempts.identity++;
        if (this.conversationState.attempts.identity >= this.config.maxIdentityAttempts) {
          this.transitionTo('IDENTITY_FAILURE_TERMINATION');
        } else {
          this.transitionTo(nodes['IDENTITY_VERIFICATION_CONFIRM'].onFailure);
        }
      }
    } else {
      // User said the info was wrong, let them re-enter it
      this.transitionTo('IDENTITY_VERIFICATION_DOB');
    }
  }

  /**
   * Handles identity retry
   * @param {string} userResponse - User's retry response
   */
  async handleIdentityRetry(userResponse) {
    // Check if user is providing corrected information
    const response = userResponse.toLowerCase();
    
    if (response.includes('dob') || response.includes('date') || response.includes('birth')) {
      // User is providing DOB, extract it
      try {
        const { date } = await extractEntities(userResponse, { date: 'The user\'s date of birth in YYYY-MM-DD format' });
        if (date && validateDob(date)) {
          this.conversationState.collectedData.dob = date;
          this.transitionTo('IDENTITY_VERIFICATION_SSN');
          return;
        }
      } catch (error) {
        console.error('Error extracting DOB from retry:', error);
      }
    }
    
    if (response.includes('ssn') || response.includes('social') || /^\d{4}$/.test(userResponse.trim())) {
      // User is providing SSN, extract it
      try {
        const { ssn } = await extractEntities(userResponse, { ssn: 'The last 4 digits of the user\'s Social Security Number' });
        if (ssn && validateSsnLast4(ssn)) {
          this.conversationState.collectedData.ssnLast4 = ssn;
          this.transitionTo('IDENTITY_VERIFICATION_CONFIRM');
          return;
        }
      } catch (error) {
        console.error('Error extracting SSN from retry:', error);
      }
    }
    
    // If no specific data provided, reset and start over
    this.conversationState.collectedData.dob = null;
    this.conversationState.collectedData.ssnLast4 = null;
    this.transitionTo('IDENTITY_VERIFICATION_DOB');
  }

  /**
   * Handles address collection
   * @param {string} userResponse - User's address response
   */
  async handleAddressCollection(userResponse) {
    try {
      // Use LLM to extract address components
      const { street, city, state, zip_code } = await extractEntities(userResponse, {
        street: 'The street address',
        city: 'The city name',
        state: 'The state name',
        zip_code: 'The ZIP code'
      });
      
      if (street && city && state && zip_code) {
        this.conversationState.collectedData.address = {
          street,
          city,
          state,
          zip_code
        };
        this.transitionTo('CONTACT_INFO_UNIT');
      } else {
        // Ask again if incomplete
        this.conversationState.currentNodeId = 'CONTACT_INFO_ADDRESS';
      }
    } catch (error) {
      console.error('Error extracting address:', error);
      this.conversationState.currentNodeId = 'CONTACT_INFO_ADDRESS';
    }
  }

  /**
   * Handles unit number collection
   * @param {string} userResponse - User's unit response
   */
  async handleUnitCollection(userResponse) {
    if (userResponse.toLowerCase().includes('yes') || userResponse.toLowerCase().includes('yeah')) {
      // Ask for unit number
      this.conversationState.currentNodeId = 'CONTACT_INFO_UNIT';
    } else {
      // No unit, proceed to email
      this.transitionTo('CONTACT_INFO_EMAIL');
    }
  }

  /**
   * Handles email collection
   * @param {string} userResponse - User's email response
   */
  async handleEmailCollection(userResponse) {
    try {
      // Check for "no email" responses
      const noEmailResponses = [
        "i don't have an email",
        "i don't have an email address",
        "no email",
        "i don't use email",
        "no email address",
        "don't have email"
      ];
      
      const responseLower = userResponse.toLowerCase();
      const isNoEmail = noEmailResponses.some(phrase => responseLower.includes(phrase));
      
      if (isNoEmail) {
        // Handle no email scenario
        this.conversationState.collectedData.email = null;
        this.conversationState.collectedData.noEmail = true;
        this.transitionTo('EMPLOYMENT_INCOME');
        return;
      }
      
      // Use LLM to extract email
      const { email } = await extractEntities(userResponse, { email: 'The user\'s email address' });
      
      if (email && validateEmail(email)) {
        this.conversationState.collectedData.email = email;
        this.transitionTo('EMPLOYMENT_INCOME');
      } else {
        // Ask again if invalid
        this.conversationState.currentNodeId = 'CONTACT_INFO_EMAIL';
      }
    } catch (error) {
      console.error('Error extracting email:', error);
      this.conversationState.currentNodeId = 'CONTACT_INFO_EMAIL';
    }
  }

  /**
   * Handles income collection
   * @param {string} userResponse - User's income response
   */
  async handleIncomeCollection(userResponse) {
    try {
      // Use LLM to extract income
      const { income } = await extractEntities(userResponse, { income: 'The user\'s monthly income as a number' });
      
      // Clean income string - remove currency symbols and text
      const cleanIncome = income.replace(/[$,]/g, '').replace(/[^\d]/g, '');
      const incomeValue = parseInt(cleanIncome);
      
      if (incomeValue && validateIncome(incomeValue)) {
        this.conversationState.collectedData.monthlyIncome = incomeValue;
        this.transitionTo('EMPLOYMENT_TENURE');
      } else {
        // Ask again if invalid
        this.conversationState.currentNodeId = 'EMPLOYMENT_INCOME';
      }
    } catch (error) {
      console.error('Error extracting income:', error);
      this.conversationState.currentNodeId = 'EMPLOYMENT_INCOME';
    }
  }

  /**
   * Handles tenure collection
   * @param {string} userResponse - User's tenure response
   */
  async handleTenureCollection(userResponse) {
    try {
      // Check for self-employed responses
      const selfEmployedResponses = [
        "i'm self-employed",
        "self-employed",
        "i don't have a traditional job tenure",
        "i work for myself",
        "freelancer",
        "contractor",
        "i'm my own boss"
      ];
      
      const responseLower = userResponse.toLowerCase();
      const isSelfEmployed = selfEmployedResponses.some(phrase => responseLower.includes(phrase));
      
      if (isSelfEmployed) {
        // Handle self-employed scenario
        this.conversationState.collectedData.jobTenure = null;
        this.conversationState.collectedData.employmentStatus = 'self_employed';
        this.transitionTo('TENURE_DISCREPANCY_CHECK');
        return;
      }
      
      // Use LLM to extract tenure
      const { tenure } = await extractEntities(userResponse, { tenure: 'The user\'s job tenure in months as a number' });
      
      if (tenure && validateTenure(parseInt(tenure))) {
        this.conversationState.collectedData.jobTenure = parseInt(tenure);
        this.transitionTo('TENURE_DISCREPANCY_CHECK');
      } else {
        // Ask again if invalid
        this.conversationState.currentNodeId = 'EMPLOYMENT_TENURE';
      }
    } catch (error) {
      console.error('Error extracting tenure:', error);
      this.conversationState.currentNodeId = 'EMPLOYMENT_TENURE';
    }
  }

  /**
   * Handles tenure discrepancy check
   * @param {string} userResponse - User's response to discrepancy
   */
  async handleTenureDiscrepancy(userResponse) {
    const statedTenure = this.conversationState.collectedData.jobTenure;
    const applicationTenure = this.applicantData.application_job_tenure || this.applicantData.job_tenure_months;
    const employmentStatus = this.conversationState.collectedData.employmentStatus;
    
    // Handle self-employed scenario - no tenure comparison needed
    if (employmentStatus === 'self_employed') {
      this.transitionTo('FINAL_CONFIRMATION');
      return;
    }
    
    // Check for significant discrepancy
    const hasDiscrepancy = statedTenure && applicationTenure && 
      Math.abs(statedTenure - applicationTenure) > this.config.jobTenureThreshold;
    
    if (hasDiscrepancy) {
      // Update context for the prompt
      this.conversationState.context.hasDiscrepancy = true;
      this.conversationState.context.applicationTenure = applicationTenure;
      this.conversationState.context.statedTenure = statedTenure;
      
      // If this is the first time showing the discrepancy, stay on this node
      if (!this.conversationState.context.discrepancyShown) {
        this.conversationState.context.discrepancyShown = true;
        this.conversationState.currentNodeId = 'TENURE_DISCREPANCY_CHECK';
      } else {
        // User has responded to discrepancy, analyze their explanation
        const explanation = userResponse.toLowerCase();
        
        // Log the user's response to the discrepancy
        this.logger.logStep('tenure_discrepancy_response', {
          userResponse,
          applicationTenure,
          statedTenure,
          explanation
        });
        
        // Check if user provides a reasonable explanation
        if (explanation.includes('promotion') || explanation.includes('new position') || 
            explanation.includes('same company') || explanation.includes('different role') ||
            explanation.includes('clarify') || explanation.includes('explain') ||
            explanation.includes('confusion') || explanation.includes('understand')) {
          
          // User provided explanation, acknowledge and proceed
          this.logger.logStep('tenure_discrepancy_resolved', {
            explanation: userResponse,
            resolved: true
          });
          
          this.transitionTo('FINAL_CONFIRMATION');
        } else {
          // Ask for more clarification or accept and proceed
          this.logger.logStep('tenure_discrepancy_acknowledged', {
            userResponse,
            proceeding: true
          });
          
          this.transitionTo('FINAL_CONFIRMATION');
        }
      }
    } else {
      // No discrepancy, proceed to final confirmation
      this.transitionTo('FINAL_CONFIRMATION');
    }
  }

  /**
   * Handles final confirmation
   * @param {string} userResponse - User's final confirmation response
   */
  async handleFinalConfirmation(userResponse) {
    const response = userResponse.toLowerCase();
    
    // Log the final confirmation response
    this.logger.logStep('final_confirmation_response', {
      userResponse,
      response: response,
      confirmed: response.includes('yes') || response.includes('correct') || response.includes('ok') || response.includes('good')
    });
    
    if (response.includes('yes') || response.includes('correct') || response.includes('ok') || response.includes('good')) {
      // User confirms all information is correct
      this.logger.logStep('verification_completed_successfully', {
        finalData: this.conversationState.collectedData,
        identityVerified: this.identityVerified
      });
      this.transitionTo('COMPLETION');
    } else if (response.includes('no') || response.includes('not') || response.includes('wrong')) {
      // User indicates information is incorrect
      this.logger.logStep('final_confirmation_rejected', {
        userResponse,
        needsCorrection: true
      });
      
      // User wants to correct something, go back to appropriate section
      this.transitionTo('CONTACT_INFO_ADDRESS');
    } else {
      // Ambiguous response, ask for clarification
      this.logger.logStep('final_confirmation_ambiguous', {
        userResponse,
        needsClarification: true
      });
      this.conversationState.currentNodeId = 'FINAL_CONFIRMATION';
    }
  }

  /**
   * Handles call termination
   * @param {string} userResponse - User's response (not used)
   */
  async terminate(userResponse) {
    // This is a terminal state, no further processing needed
    return;
  }

  /**
   * Handles call completion
   * @param {string} userResponse - User's response (not used)
   */
  async complete(userResponse) {
    // This is a terminal state, no further processing needed
    return;
  }

  // --- CORE LOGIC (DETERMINISTIC) ---
  
  /**
   * Validates identity against stored data
   * @param {string} dob - Date of birth
   * @param {string} ssnLast4 - Last 4 digits of SSN
   * @returns {boolean} - Whether identity is verified
   */
  validateIdentity(dob, ssnLast4) {
    // This is pure, deterministic code. NO LLM.
    const isDobMatch = (dob === this.applicantData.date_of_birth);
    const isSsnMatch = (ssnLast4 === this.applicantData.ssn_last_four);
    return isDobMatch && isSsnMatch;
  }
  
  // --- UTILITY METHODS ---

  /**
   * Transitions to a new conversation node
   * @param {string} nodeId - The ID of the node to transition to
   */
  transitionTo(nodeId) {
    this.conversationState.currentNodeId = nodeId;
  }
  
  /**
   * Updates context for prompt generation
   */
  updateContextForPrompt() {
    const { dob, ssnLast4, address, email, monthlyIncome, jobTenure } = this.conversationState.collectedData;
    
    if (dob) {
      this.conversationState.context.dob = formatSpokenDate(dob);
    }
    if (ssnLast4) {
      this.conversationState.context.ssn = formatSpokenDigits(ssnLast4);
    }
    if (address) {
      this.conversationState.context.address = formatSpokenAddress(address);
    }
    if (email) {
      this.conversationState.context.email = formatSpokenEmail(email);
    }
    if (monthlyIncome) {
      this.conversationState.context.monthlyIncome = formatSpokenCurrency(monthlyIncome);
    }
    if (jobTenure) {
      this.conversationState.context.jobTenure = `${jobTenure} months`;
    }
    
    // Generate summary for final confirmation
    if (dob && address && monthlyIncome && jobTenure) {
      this.conversationState.context.summary = this.generateSummary();
    }
  }

  /**
   * Generates a summary of collected information
   * @returns {string} - Summary text
   */
  generateSummary() {
    const { dob, ssnLast4, address, email, monthlyIncome, jobTenure } = this.conversationState.collectedData;
    
    let summary = `Your date of birth is ${formatSpokenDate(dob)}. `;
    summary += `Your mailing address is ${formatSpokenAddress(address)}. `;
    if (email) {
      summary += `Your email is ${formatSpokenEmail(email)}. `;
    }
    summary += `Your monthly income is ${formatSpokenCurrency(monthlyIncome)}, and you've been with your current employer for ${jobTenure} months.`;
    
    return summary;
  }
}

export default VerificationAgent;
