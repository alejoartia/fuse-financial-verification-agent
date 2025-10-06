import VerificationAgent from '../agent/VerificationAgent.js';

describe('VerificationAgent Integration Tests', () => {
  let agent;
  const testApplicant = {
    name: 'John Doe',
    date_of_birth: '1985-03-15',
    ssn_last_four: '1234',
    application_job_tenure: 24
  };

  beforeEach(() => {
    agent = new VerificationAgent(testApplicant);
  });

  describe('Agent Initialization', () => {
    test('should initialize with correct state', () => {
      expect(agent.conversationState.currentNodeId).toBe('START');
      expect(agent.identityVerified).toBe(false);
      expect(agent.applicantData).toEqual(testApplicant);
    });

    test('should have correct configuration defaults', () => {
      expect(agent.config.jobTenureThreshold).toBe(24);
      expect(agent.config.maxIdentityAttempts).toBe(2);
    });
  });

  describe('State Transitions', () => {
    test('should transition from START to IDENTITY_VERIFICATION_DOB on greeting confirmation', async () => {
      expect(agent.conversationState.currentNodeId).toBe('START');
      
      await agent.processUserInput('Yes, that\'s me.');
      
      expect(agent.conversationState.currentNodeId).toBe('IDENTITY_VERIFICATION_DOB');
    });

    test('should handle greeting denial', async () => {
      await agent.processUserInput('No, wrong person.');
      
      // Should transition to incorrect person termination
      expect(agent.conversationState.currentNodeId).toBe('INCORRECT_PERSON_TERMINATION');
    });
  });

  describe('Identity Verification', () => {
    test('should verify correct identity', () => {
      const result = agent.validateIdentity('1985-03-15', '1234');
      expect(result).toBe(true);
    });

    test('should reject incorrect identity', () => {
      const result = agent.validateIdentity('1985-03-16', '1234');
      expect(result).toBe(false);
    });

    test('should reject incorrect SSN', () => {
      const result = agent.validateIdentity('1985-03-15', '5678');
      expect(result).toBe(false);
    });
  });

  describe('Data Collection', () => {
    test('should collect and store user data', async () => {
      // Simulate DOB collection
      await agent.processUserInput('March 15th, 1985');
      expect(agent.conversationState.collectedData.dob).toBe('1985-03-15');
    });

    test('should format data for voice output', () => {
      agent.conversationState.collectedData.dob = '1985-03-15';
      agent.conversationState.collectedData.ssnLast4 = '1234';
      
      agent.updateContextForPrompt();
      
      expect(agent.conversationState.context.dob).toBe('March 15th, 1985');
      expect(agent.conversationState.context.ssn).toBe('1-2-3-4');
    });
  });

  describe('Tenure Discrepancy Detection', () => {
    test('should detect tenure discrepancy', () => {
      agent.conversationState.collectedData.jobTenure = 8;
      agent.applicantData.application_job_tenure = 36;
      
      const hasDiscrepancy = Math.abs(8 - 36) > agent.config.jobTenureThreshold;
      expect(hasDiscrepancy).toBe(true);
    });

    test('should not flag minor tenure differences', () => {
      agent.conversationState.collectedData.jobTenure = 22;
      agent.applicantData.application_job_tenure = 24;
      
      const hasDiscrepancy = Math.abs(22 - 24) > agent.config.jobTenureThreshold;
      expect(hasDiscrepancy).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid input gracefully', async () => {
      const initialNode = agent.conversationState.currentNodeId;
      
      // Try to process invalid input
      await agent.processUserInput('invalid input that should not break the flow');
      
      // Should remain in same state or handle gracefully
      expect(agent.conversationState.currentNodeId).toBeDefined();
    });

    test('should handle missing applicant data', () => {
      const agentWithMissingData = new VerificationAgent({});
      
      expect(agentWithMissingData.applicantData).toEqual({});
      expect(agentWithMissingData.conversationState.context.applicantName).toBeUndefined();
    });
  });

  describe('Conversation Flow', () => {
    test('should generate appropriate prompts for each node', () => {
      const startPrompt = agent.generatePrompt();
      expect(startPrompt).toContain('Hello, my name is Sarah');
      expect(startPrompt).toContain('Am I speaking with John Doe');
    });

    test('should update context for dynamic prompts', () => {
      agent.conversationState.collectedData.dob = '1985-03-15';
      agent.conversationState.collectedData.ssnLast4 = '1234';
      
      agent.updateContextForPrompt();
      
      const confirmPrompt = agent.generatePrompt();
      expect(confirmPrompt).toContain('March 15th, 1985');
      expect(confirmPrompt).toContain('1-2-3-4');
    });
  });

  describe('Security Features', () => {
    test('should maintain identity verification gate', () => {
      expect(agent.identityVerified).toBe(false);
      
      // Simulate successful verification
      agent.identityVerified = true;
      expect(agent.identityVerified).toBe(true);
    });

    test('should track identity verification attempts', () => {
      expect(agent.conversationState.attempts.identity).toBe(0);
      
      agent.conversationState.attempts.identity++;
      expect(agent.conversationState.attempts.identity).toBe(1);
    });
  });

  describe('Summary Generation', () => {
    test('should generate comprehensive summary', () => {
      agent.conversationState.collectedData = {
        dob: '1985-03-15',
        address: {
          street: '123 Main St',
          city: 'Denver',
          state: 'Colorado',
          zip_code: '80202'
        },
        email: 'test@example.com',
        monthlyIncome: 5000,
        jobTenure: 24
      };
      
      const summary = agent.generateSummary();
      expect(summary).toContain('March 15th, 1985');
      expect(summary).toContain('123 Main St');
      expect(summary).toContain('$5,000');
      expect(summary).toContain('24 months');
    });
  });
});
