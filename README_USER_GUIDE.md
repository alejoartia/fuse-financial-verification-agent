# User Guide

> **Complete user guide for the Fuse Financial Verification Agent**

## Getting Started

Once the project is running, this guide will help you navigate and use all the available features.

## Available Commands

### **Basic Operations**

#### **Start the Interactive Simulator**
```bash
npm start
```
- Launches the basic interactive simulator
- Allows you to test the verification flow manually
- Perfect for understanding the conversation flow

#### **Advanced Simulator with Mock Data**
```bash
npm run simulator:generated
```
- Uses pre-generated mock data for testing
- Provides realistic scenarios for testing
- Includes various user scenarios and edge cases

### **Mock Data Generation**

#### **Generate Test Data**
```bash
# Generate mixed scenarios (recommended)
npm run generate:mixed

# Generate successful scenarios only
npm run generate:successful

# Generate failure scenarios only
npm run generate:failure

# Generate custom scenarios
node scripts/generate-mock-data.js --count 20 --type mixed --llm
```

#### **Available Scenario Types**
- **successful**: Standard verification flows
- **identity_failure**: Identity verification failures
- **tenure_discrepancy**: Job tenure discrepancies
- **mixed**: Combination of all scenarios with LLM generation

### **Testing and Evaluation**

#### **Run Test Suite**
```bash
npm test
```
- Executes all unit tests
- Validates core functionality
- Ensures system integrity

#### **Comprehensive Evaluation**
```bash
npm run evaluate
```
- Tests the system against multiple datasets
- Provides pass/fail/error rate analysis
- Generates detailed performance reports

#### **Analyze Conversations**
```bash
npm run analyze
```
- Analyzes conversation logs
- Generates performance insights
- Creates detailed reports

### **Monitoring and Dashboard**

#### **Generate Dashboard**
```bash
npm run dashboard
```
- Creates real-time monitoring dashboard
- Generates `dashboard/index.html` and `dashboard/data.json`
- Provides live conversation metrics

#### **View Dashboard**
```bash
# Open dashboard in browser
open dashboard/index.html
```
- Real-time conversation monitoring
- Performance metrics and analytics
- Error tracking and success rates

#### **Start Monitoring**
```bash
npm run monitoring
```
- Launches the monitoring dashboard
- Auto-refreshes every 5 seconds
- Provides live system health monitoring

## Understanding the Verification Flow

### **Step 1: Identity Verification**
The system starts with a mandatory identity verification gate:

1. **Date of Birth Collection**
   - User provides their date of birth
   - System validates format and reasonableness
   - Retry logic for invalid inputs

2. **SSN Last 4 Digits**
   - User provides last 4 digits of SSN
   - System validates format
   - Security logging for all attempts

3. **Identity Confirmation**
   - System confirms identity verification
   - Proceeds to next phase or terminates

### **Step 2: Contact Information**
Once identity is verified, the system collects contact information:

1. **Complete Mailing Address**
   - Street address, city, state, ZIP code
   - Unit/apartment number if applicable
   - Address validation and formatting

2. **Email Address**
   - Professional email validation
   - Format checking and verification
   - Voice-optimized pronunciation

### **Step 3: Financial Information**
The system then collects financial data:

1. **Monthly Income**
   - Pre-tax monthly income
   - Currency formatting for speech
   - Income validation and verification

2. **Job Tenure**
   - Current job duration
   - Tenure discrepancy detection
   - Comparison with application data

### **Step 4: Final Confirmation**
The system provides a comprehensive summary:

1. **Data Summary**
   - All collected information formatted for speech
   - Clear, professional presentation
   - User-friendly confirmation

2. **User Verification**
   - Final confirmation from user
   - Correction handling if needed
   - Professional closure

## Error Handling

### **Identity Verification Failures**
- **Invalid DOB**: System requests correction
- **Invalid SSN**: System requests correction
- **Multiple Failures**: Professional termination
- **Security Logging**: All attempts logged

### **Data Validation Errors**
- **Invalid Format**: Clear error messages
- **Missing Information**: Professional guidance
- **System Errors**: Graceful error handling
- **LLM Failures**: Fallback mechanisms

### **Recovery Procedures**
- **Retry Logic**: Automatic retry for recoverable errors
- **User Guidance**: Clear instructions for corrections
- **Professional Communication**: Respectful error handling
- **Audit Trail**: Complete error logging

## Monitoring and Analytics

### **Real-Time Dashboard**
The dashboard provides live monitoring of:

- **Conversation Metrics**: Success rates, response times
- **Error Tracking**: Failed attempts and error patterns
- **Performance Data**: System health and performance
- **User Experience**: Conversation flow analysis

### **Conversation Logs**
All conversations are logged with:

- **Step-by-Step Logging**: Complete conversation flow
- **Security Events**: Identity verification attempts
- **Business Logic**: Tenure discrepancies and explanations
- **Performance Data**: Response times and error rates

### **Analytics and Reports**
The system generates:

- **Performance Reports**: Success rates and error analysis
- **Security Reports**: Identity verification statistics
- **User Experience Reports**: Conversation flow analysis
- **System Health Reports**: Performance and reliability metrics

## Configuration

### **Environment Variables**
Key configuration options:

```bash
# OpenAI API Key (required)
OPENAI_API_KEY=your_api_key_here

# Business Logic Configuration
JOB_TENURE_THRESHOLD_MONTHS=24
MAX_IDENTITY_ATTEMPTS=2

# Logging Configuration
ENABLE_FILE_LOGGING=true
ENABLE_CONSOLE_LOGGING=true
LOG_DIR=logs

# Dashboard Configuration
DASHBOARD_OUTPUT_DIR=dashboard
ANALYSIS_OUTPUT_DIR=analysis
```

### **Customization Options**
- **Conversation Flow**: Modify `src/agent/conversationFlow.js`
- **Validation Logic**: Update `src/utils/validators.js`
- **Formatting**: Customize `src/utils/formatters.js`
- **Logging**: Configure `src/utils/conversationLogger.js`

## Troubleshooting

### **Common Issues**

#### **OpenAI API Key Not Configured**
```bash
# Check if API key is set
echo $OPENAI_API_KEY

# Set API key in .env file
echo "OPENAI_API_KEY=your_key_here" >> .env
```

#### **Node.js Version Issues**
```bash
# Check Node.js version
node -v

# Should be v18 or higher
# Install with nvm if needed
nvm install 20
nvm use 20
```

#### **Dependencies Issues**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### **Dashboard Not Loading**
```bash
# Regenerate dashboard
npm run dashboard

# Check if files exist
ls -la dashboard/

# Open in browser
open dashboard/index.html
```

### **Debug Mode**
Enable debug logging for troubleshooting:

```bash
# Set debug environment
export DEBUG=true
export NODE_ENV=development

# Run with debug logging
npm start
```

### **Log Analysis**
Check logs for issues:

```bash
# View recent logs
tail -f logs/conversation_*.log

# Check error logs
grep "ERROR" logs/*.log

# Analyze conversation logs
npm run analyze
```

## Best Practices

### **Testing**
- **Regular Testing**: Run tests before making changes
- **Mock Data**: Use generated scenarios for testing
- **Edge Cases**: Test failure scenarios and error conditions
- **Performance**: Monitor response times and error rates

### **Monitoring**
- **Dashboard Usage**: Check dashboard regularly for system health
- **Log Analysis**: Review logs for patterns and issues
- **Performance Metrics**: Monitor success rates and response times
- **Error Tracking**: Watch for error patterns and trends

### **Security**
- **API Key Management**: Keep OpenAI API key secure
- **Log Security**: Ensure sensitive data is not logged
- **Access Control**: Limit access to sensitive information
- **Audit Trail**: Maintain complete audit logs

### **Maintenance**
- **Regular Updates**: Keep dependencies updated
- **Log Rotation**: Manage log file sizes
- **Performance Monitoring**: Track system performance
- **Error Analysis**: Regular analysis of error patterns

## Support and Resources

### **Documentation**
- **README.md**: Comprehensive project documentation
- **README_TECHNICAL_DOCUMENTATION.md**: Technical implementation details
- **README_QUICK_START.md**: Quick start guide for developers

### **Getting Help**
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check comprehensive documentation
- **Logs**: Review logs for error details
- **Community**: GitHub repository for discussions

### **Development**
- **Source Code**: All source code in `src/` directory
- **Scripts**: Utility scripts in `scripts/` directory
- **Tests**: Test files in `src/tests/` directory
- **Configuration**: Environment and configuration files

---

**Ready to get started? Run `npm start` to begin using the Financial Verification Agent!**
