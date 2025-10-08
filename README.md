# AI Voice Optimized Financial Verification Agent

A Node.js conversational AI agent for secure financial and personal verification, built with a robust state machine architecture and LangChain integration.

## 🚀 Features

- **State Machine Architecture**: Clean, maintainable conversation flow management
- **Identity Verification Gate**: Security-first approach with deterministic validation
- **LLM Integration**: LangChain-powered natural language understanding and generation
- **Voice Optimization**: All prompts formatted for text-to-speech systems
- **Comprehensive Testing**: Automated testing framework with evaluation scenarios
- **Error Handling**: Graceful fallbacks and professional error management
- **Security Focused**: Sensitive data validation separated from LLM processing

## 🏗️ Architecture

The system uses a **Finite State Machine (FSM)** pattern where each conversation step is a "node" with defined handlers, prompts, and transitions. This approach provides:

- **Deterministic Logic**: All critical business logic (identity verification, data validation) is handled by pure Node.js code
- **LLM Integration**: Natural language processing is delegated to specialized services
- **Maintainability**: Easy to modify conversation flow without touching core logic
- **Testability**: Each component can be tested independently

### Core Components

```
src/
├── agent/
│   ├── VerificationAgent.js      # Main agent class
│   └── conversationFlow.js       # State machine configuration
├── services/
│   └── llmService.js             # LangChain/OpenAI integration
├── utils/
│   ├── validators.js             # Data validation functions
│   └── formatters.js             # Voice-optimized formatting
└── tests/
    ├── evaluation.js             # Comprehensive testing framework
    ├── validation.test.js        # Unit tests
    └── agent.test.js             # Integration tests
```

## 🛠️ Installation

### Prerequisites

- Node.js (v18+)
- OpenAI API Key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/alejoartia/fuse-financial-verification-agent.git
   cd fuse-financial-verification-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp example.env .env
   # Edit .env with your OpenAI API key
   ```

4. **Set your OpenAI API key**
   ```bash
   echo "OPENAI_API_KEY=your_api_key_here" > .env
   ```

## ⚙️ Configuration

The system uses environment variables for configuration. Copy `example.env` to `.env` and customize the settings:

### **Essential Configuration**
- `OPENAI_API_KEY` - Your OpenAI API key (required)
- `JOB_TENURE_THRESHOLD_MONTHS` - Tenure discrepancy threshold (default: 24)
- `MAX_IDENTITY_ATTEMPTS` - Max identity verification attempts (default: 2)

### **Logging Configuration**
- `ENABLE_FILE_LOGGING` - Enable file logging (default: true)
- `ENABLE_CONSOLE_LOGGING` - Enable console logging (default: true)
- `LOG_DIR` - Log directory (default: logs)

### **Dashboard Configuration**
- `DASHBOARD_OUTPUT_DIR` - Dashboard output directory (default: dashboard)
- `ANALYSIS_OUTPUT_DIR` - Analysis output directory (default: analysis)

### **Advanced Configuration**
- `ENABLE_LLM_DATA_GENERATION` - Enable LLM-powered mock data generation
- `ENABLE_EVALUATION_MODE` - Enable evaluation mode for testing
- `ENABLE_SECURITY_LOGGING` - Enable security-focused logging
- `ENABLE_DATA_ENCRYPTION` - Enable data encryption for sensitive information

See `example.env` for all available configuration options.

## 🚀 Usage

### Interactive Simulator

Run the interactive conversation simulator:

```bash
npm start
# or
node src/simulator.js
```

### Automated Testing

Run the comprehensive test suite:

```bash
npm test
# or
node test-agent.js
```

### Evaluation Framework

Run the evaluation framework against test scenarios:

```bash
node src/tests/evaluation.js
```

## 📋 Conversation Flow

The agent follows a structured verification process:

1. **Identity Verification** (Critical Gate)
   - Date of birth collection
   - SSN last 4 digits collection
   - Identity confirmation and validation

2. **Contact Information Collection**
   - Complete mailing address
   - Unit number verification (if applicable)
   - Email address with validation

3. **Financial Information Collection**
   - Monthly income verification
   - Job tenure collection
   - Tenure discrepancy detection and handling

4. **Final Confirmation**
   - Summary of all collected information
   - Final user confirmation

## 🔒 Security Features

- **Identity Verification Gate**: All subsequent steps require successful identity verification
- **Deterministic Validation**: Critical security checks use pure Node.js logic, not LLM
- **Data Sanitization**: All user input is validated and sanitized
- **Professional Termination**: Secure call termination on verification failure
- **No Sensitive Data in Logs**: API keys and sensitive data are properly protected

## 🧪 Testing

### Test Coverage

- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end conversation flow testing
- **Evaluation Framework**: Comprehensive scenario testing
- **Mock Data Testing**: Various user scenarios and edge cases

### Running Tests

```bash
# Run all tests
npm test

# Run specific test files
node src/tests/validation.test.js
node src/tests/agent.test.js

# Run evaluation framework
node src/tests/evaluation.js
```

## 📊 Evaluation Results

The evaluation framework tests multiple scenarios:

- ✅ **Successful Verification**: Standard flow completion
- ✅ **Identity Verification Failure**: Proper security gate handling
- ✅ **Tenure Discrepancy**: Professional discrepancy resolution
- ✅ **Error Handling**: Graceful fallbacks and recovery

## 🎯 Voice Optimization

All agent responses are optimized for text-to-speech:

- **Numbers**: Spoken digit-by-digit (e.g., "7-2-3-4")
- **Financial Amounts**: Natural speech formatting (e.g., "$6,500")
- **Email Addresses**: Letter-by-letter spelling
- **Addresses**: Natural pause patterns for comprehension
- **Dates**: Full word formatting (e.g., "March 15th, 1985")

## 🔧 Configuration

### Environment Variables

```bash
OPENAI_API_KEY=your_openai_api_key_here
JOB_TENURE_THRESHOLD_MONTHS=24
MAX_IDENTITY_ATTEMPTS=2
NODE_ENV=development
```

### Customization

The conversation flow can be easily customized by modifying `src/agent/conversationFlow.js`:

```javascript
export const nodes = {
  YOUR_NODE: {
    id: 'YOUR_NODE',
    prompt: (context) => 'Your custom prompt',
    handler: 'handleYourNode',
    next: 'NEXT_NODE'
  }
};
```

## 📈 Performance

- **Response Time**: < 2 seconds per LLM interaction
- **Memory Usage**: Efficient state management
- **Error Recovery**: Graceful fallbacks to mock responses
- **Scalability**: Stateless design allows horizontal scaling

## 🛡️ Security Considerations

- **API Key Protection**: Environment variables properly configured
- **Data Validation**: All inputs validated before processing
- **Audit Trail**: Comprehensive logging for security analysis
- **Professional Communication**: Secure termination messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Business Value

This verification agent demonstrates:

- **Senior-Level Architecture**: Clean, maintainable, and scalable design
- **Security-First Approach**: Proper handling of sensitive financial data
- **Production Readiness**: Comprehensive testing and error handling
- **LLM Ops Expertise**: Professional integration and evaluation frameworks
- **User Experience Focus**: Voice-optimized prompts and natural conversation flow

## 📞 Support

For questions or support, please open an issue in the GitHub repository.

---

**Built with ❤️ for the Senior Backend/LLM Ops Engineer position**

