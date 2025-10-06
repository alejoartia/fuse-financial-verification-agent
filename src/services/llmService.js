import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";
import { HumanMessage } from "@langchain/core/messages";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI model
const model = new ChatOpenAI({ 
  temperature: 0,
  modelName: "gpt-3.5-turbo",
  openAIApiKey: process.env.OPENAI_API_KEY
});

/**
 * Extracts structured entities from user input using OpenAI
 * @param {string} text - User's natural language input
 * @param {object} schema - Schema defining what entities to extract
 * @returns {Promise<object>} - Extracted entities
 */
export async function extractEntities(text, schema) {
  try {
    console.log(`[LLM] Extracting entities from: "${text}"`);
    console.log(`[LLM] Schema:`, schema);
    
    // Create function schema for structured output
    const functionSchema = {
      name: "entity_extractor",
      description: "Extracts structured entities from user input",
      parameters: {
        type: "object",
        properties: {},
        required: Object.keys(schema),
      },
    };

    // Add properties for each entity in the schema
    for (const key in schema) {
      functionSchema.parameters.properties[key] = {
        type: "string",
        description: schema[key],
      };
    }
    
    // Create the function call chain
    const runnable = model.bind({
      functions: [functionSchema],
      function_call: { name: "entity_extractor" },
    }).pipe(new JsonOutputFunctionsParser());

    // Process the user input
    const result = await runnable.invoke([
      new HumanMessage(`Extract the required entities from the following text: "${text}"`)
    ]);
    
    console.log(`[LLM] Extracted:`, result);
    return result;
    
  } catch (error) {
    console.error('Error in extractEntities:', error);
    // Fallback to mock responses for development
    return getMockResponse(schema);
  }
}

/**
 * Gets confirmation from user input using OpenAI
 * @param {string} text - User's response
 * @returns {Promise<boolean>} - Whether user confirmed (true/false)
 */
export async function getConfirmation(text) {
  try {
    console.log(`[LLM] Getting confirmation from: "${text}"`);
    
    const functionSchema = {
      name: "confirmation_extractor",
      description: "Determines if user confirmed or denied something",
      parameters: {
        type: "object",
        properties: {
          confirmed: {
            type: "boolean",
            description: "Whether the user confirmed (true) or denied (false)"
          }
        },
        required: ["confirmed"]
      }
    };
    
    const runnable = model.bind({
      functions: [functionSchema],
      function_call: { name: "confirmation_extractor" },
    }).pipe(new JsonOutputFunctionsParser());

    const result = await runnable.invoke([
      new HumanMessage(`Determine if the user confirmed or denied something in this response: "${text}". Return true for confirmation, false for denial.`)
    ]);
    
    console.log(`[LLM] Confirmation result:`, result.confirmed);
    return result.confirmed;
    
  } catch (error) {
    console.error('Error in getConfirmation:', error);
    // Fallback to simple keyword matching
    return getSimpleConfirmation(text);
  }
}

/**
 * Fallback mock responses for development
 * @param {object} schema - Schema defining entities
 * @returns {object} - Mock response
 */
function getMockResponse(schema) {
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

/**
 * Simple keyword-based confirmation fallback
 * @param {string} text - User's response
 * @returns {boolean} - Confirmation result
 */
function getSimpleConfirmation(text) {
  const positiveWords = ['yes', 'yeah', 'correct', 'right', 'true', 'yep', 'sure'];
  const negativeWords = ['no', 'nope', 'wrong', 'incorrect', 'false', 'nah'];
  
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