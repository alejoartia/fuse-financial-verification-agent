import { formatSpokenDate, formatSpokenAddress, formatSpokenEmail, formatSpokenCurrency } from '../utils/formatters.js';

export const nodes = {
  START: {
    id: 'START',
    prompt: (context) => `Hello, my name is Sarah, I'm calling from Fuse Finance regarding your recent vehicle financing application. This call may be recorded for quality assurance. Am I speaking with ${context.applicantName}?`,
    handler: 'handleGreetingConfirmation',
    next: 'IDENTITY_VERIFICATION_DOB'
  },
  
  IDENTITY_VERIFICATION_DOB: {
    id: 'IDENTITY_VERIFICATION_DOB',
    prompt: () => 'For security purposes, I need to verify your identity. Can you please provide your date of birth? Please give me the month, day, and year.',
    handler: 'handleDobCollection',
    next: 'IDENTITY_VERIFICATION_SSN'
  },
  
  IDENTITY_VERIFICATION_SSN: {
    id: 'IDENTITY_VERIFICATION_SSN',
    prompt: () => 'Thank you. Now I need the last four digits of your Social Security Number.',
    handler: 'handleSsnCollection',
    next: 'IDENTITY_VERIFICATION_CONFIRM'
  },
  
  IDENTITY_VERIFICATION_CONFIRM: {
    id: 'IDENTITY_VERIFICATION_CONFIRM',
    prompt: (context) => `Let me confirm this information. Your date of birth is ${context.dob}, and the last four digits of your Social Security Number are ${context.ssn}. Is that correct?`,
    handler: 'handleIdentityConfirmation',
    onSuccess: 'CONTACT_INFO_ADDRESS',
    onFailure: 'IDENTITY_VERIFICATION_RETRY'
  },
  
  IDENTITY_VERIFICATION_RETRY: {
    id: 'IDENTITY_VERIFICATION_RETRY',
    prompt: () => "I'm unable to verify this information with our records. Let me try once more. Can you please confirm your date of birth and the last four digits of your Social Security Number?",
    handler: 'handleIdentityRetry',
    next: 'IDENTITY_VERIFICATION_CONFIRM'
  },
  
  IDENTITY_FAILURE_TERMINATION: {
    id: 'IDENTITY_FAILURE_TERMINATION',
    prompt: () => "I understand this can be frustrating. However, the last four digits of your Social Security Number and date of birth are required to proceed with the verification. Since we're unable to verify this information today, I'll need to conclude our call. Thank you for your time, and please feel free to call back when you have this information available.",
    handler: 'terminate',
    isTerminal: true
  },
  
  CONTACT_INFO_ADDRESS: {
    id: 'CONTACT_INFO_ADDRESS',
    prompt: () => 'Perfect, your identity has been verified. Now I need to collect your current mailing address. Please provide your complete address including street, city, state, and ZIP code.',
    handler: 'handleAddressCollection',
    next: 'CONTACT_INFO_UNIT'
  },
  
  CONTACT_INFO_UNIT: {
    id: 'CONTACT_INFO_UNIT',
    prompt: (context) => `I have ${context.address}. Is there a unit number or apartment number for this address?`,
    handler: 'handleUnitCollection',
    next: 'CONTACT_INFO_EMAIL'
  },
  
  CONTACT_INFO_EMAIL: {
    id: 'CONTACT_INFO_EMAIL',
    prompt: () => "I'll need your email address for our records and future communications. Please spell it out for me.",
    handler: 'handleEmailCollection',
    next: 'EMPLOYMENT_INCOME'
  },
  
  EMPLOYMENT_INCOME: {
    id: 'EMPLOYMENT_INCOME',
    prompt: () => 'Now I need to verify your employment and income information. What is your monthly income before taxes?',
    handler: 'handleIncomeCollection',
    next: 'EMPLOYMENT_TENURE'
  },
  
  EMPLOYMENT_TENURE: {
    id: 'EMPLOYMENT_TENURE',
    prompt: () => 'How long have you been working at your current job?',
    handler: 'handleTenureCollection',
    next: 'TENURE_DISCREPANCY_CHECK'
  },
  
  TENURE_DISCREPANCY_CHECK: {
    id: 'TENURE_DISCREPANCY_CHECK',
    prompt: (context) => context.hasDiscrepancy ? 
      `I show on your application that you've been employed for ${context.applicationTenure} months. Can you help me understand the difference between what you're telling me now - ${context.statedTenure} months - and what's shown on the application?` :
      'Thank you for that information.',
    handler: 'handleTenureDiscrepancy',
    next: 'FINAL_CONFIRMATION'
  },
  
  FINAL_CONFIRMATION: {
    id: 'FINAL_CONFIRMATION',
    prompt: (context) => {
      const data = context.collectedData || {};
      const address = data.address || {};
      const email = data.email ? formatSpokenEmail(data.email) : 'No email provided';
      
      // Build comprehensive summary
      let summary = `Your date of birth is ${formatSpokenDate(data.dob || 'Not provided')}. `;
      summary += `Your mailing address is ${formatSpokenAddress(address)}. `;
      summary += `Your email is ${email}. `;
      summary += `Your monthly income is ${formatSpokenCurrency(data.monthlyIncome || 0)}`;
      
      // Add tenure information based on employment status
      if (data.employmentStatus === 'self_employed') {
        summary += `, and you're self-employed`;
      } else if (data.jobTenure) {
        summary += `, and you've been with your current employer for ${data.jobTenure} months`;
      }
      
      return `Let me summarize the information we've collected today to make sure everything is accurate. ${summary}. Is all of this information correct?`;
    },
    handler: 'handleFinalConfirmation',
    next: 'COMPLETION'
  },
  
  COMPLETION: {
    id: 'COMPLETION',
    prompt: () => 'Excellent. Your verification is now complete. Thank you for your time today.',
    handler: 'complete',
    isTerminal: true
  }
};