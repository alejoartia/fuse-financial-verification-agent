/**
 * Mock LLM service for testing
 * In production, this would use LangChain with OpenAI
 */

export async function extractEntities(text, schema) {
  // Mock implementation for testing
  console.log(`[MOCK LLM] Extracting entities from: "${text}"`);
  console.log(`[MOCK LLM] Schema:`, schema);
  
  // Simple mock responses based on common patterns
  const mockResponses = {
    date: '1985-03-15',
    ssn: '7234',
    email: 'test@example.com',
    income: '6500',
    tenure: '24',
    street: '123 Main St',
    city: 'Denver',
    state: 'Colorado',
    zip_code: '80202'
  };
  
  const result = {};
  for (const key in schema) {
    result[key] = mockResponses[key] || 'mock_value';
  }
  
  return result;
}

export async function getConfirmation(text) {
  // Mock confirmation logic
  const positiveWords = ['yes', 'yeah', 'correct', 'right', 'true'];
  const negativeWords = ['no', 'nope', 'wrong', 'incorrect', 'false'];
  
  const lowerText = text.toLowerCase();
  
  for (const word of positiveWords) {
    if (lowerText.includes(word)) {
      return true;
    }
  }
  
  for (const word of negativeWords) {
    if (lowerText.includes(word)) {
      return false;
    }
  }
  
  // Default to false if unclear
  return false;
}
