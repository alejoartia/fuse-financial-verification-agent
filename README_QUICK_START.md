# Quick Start Guide

> **Complete setup and execution guide for the Fuse Financial Verification Agent**

## Prerequisites

- **Node.js** (v18+) - [Download here](https://nodejs.org/)
- **OpenAI API Key** - [Get your key here](https://platform.openai.com/api-keys)
- **Git** - [Download here](https://git-scm.com/)

## One-Command Setup

### **Option 1: Automated Setup (Recommended)**
```bash
# Clone the repository
git clone https://github.com/alejoartia/fuse-financial-verification-agent.git
cd fuse-financial-verification-agent

# Run automated setup
chmod +x setup.sh
./setup.sh
```

The setup script will:
- Check prerequisites (Node.js, npm)
- Install dependencies
- Configure environment variables
- Create necessary directories
- Generate initial mock data
- Run tests to verify setup
- Provide next steps and available commands

### **Option 2: Manual Setup**
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp example.env .env
# Edit .env and add your OpenAI API key

# 3. Create directories
mkdir -p logs data dashboard analysis

# 4. Generate mock data
npm run generate:mixed

# 5. Run tests
npm test
```

## Execution Pipeline

### **Complete Pipeline (All Features)**
```bash
# Run the complete pipeline
chmod +x run-pipeline.sh
./run-pipeline.sh
```

### **Step-by-Step Execution**

#### **1. Basic Setup**
```bash
# Install dependencies
npm install

# Configure environment
cp example.env .env
# Edit .env with your OpenAI API key
```

#### **2. Generate Mock Data**
```bash
# Generate various scenario types
npm run generate:successful  # Generate successful scenarios
npm run generate:failure     # Generate identity failure scenarios
npm run generate:mixed       # Generate mixed scenarios with LLM

# Or use direct script execution
node scripts/generate-mock-data.js --count 5 --type successful
node scripts/generate-mock-data.js --count 5 --type identity_failure
node scripts/generate-mock-data.js --count 5 --type tenure_discrepancy
node scripts/generate-mock-data.js --count 10 --type mixed
```

#### **3. Run Tests**
```bash
# Run comprehensive test suite
npm test

# Run specific tests
node src/tests/validation.test.js
node src/tests/agent.test.js
```

#### **4. Run Evaluation**
```bash
# Run evaluation framework
node scripts/evaluate-multiple-datasets.js

# Run conversation analysis
node scripts/analyze-conversations.js
```

#### **5. Generate Dashboard**
```bash
# Generate real-time dashboard
node scripts/conversation-dashboard.js

# Open dashboard in browser
open dashboard/index.html
```

#### **6. Run Simulators**
```bash
# Basic simulator
npm start
node src/simulator.js

# Advanced simulator with mock data
npm run simulator:generated
node src/simulator-with-generated-data.js
```

## Interactive Usage

### **Basic Simulator**
```bash
npm start
# or
node src/simulator.js
```

### **Advanced Simulator with Mock Data**
```bash
npm run simulator:generated
# or
node src/simulator-with-generated-data.js
```

### **Real-Time Dashboard**
```bash
# Generate dashboard
npm run dashboard
node scripts/conversation-dashboard.js

# Open in browser
open dashboard/index.html
```

## Monitoring and Analytics

### **Real-Time Monitoring**
```bash
# Generate dashboard
node scripts/conversation-dashboard.js

# View dashboard
open dashboard/index.html
```

### **Conversation Analysis**
```bash
# Analyze conversations
node scripts/analyze-conversations.js

# View analysis results
cat analysis/conversation_analysis.json
```

### **Performance Evaluation**
```bash
# Run comprehensive evaluation
node scripts/evaluate-multiple-datasets.js

# Check evaluation results
ls -la logs/
```

## Configuration

### **Environment Variables**
Edit `.env` file:
```bash
OPENAI_API_KEY=your_api_key_here
JOB_TENURE_THRESHOLD_MONTHS=24
MAX_IDENTITY_ATTEMPTS=2
NODE_ENV=development
```

### **Advanced Configuration**
See `example.env` for all available options:
- Logging configuration
- Dashboard settings
- Security options
- Performance tuning

## Project Structure

```
fuse-financial-verification-agent/
├── src/
│   ├── agent/                    # Core agent logic
│   ├── services/                 # LLM services
│   ├── utils/                   # Utilities and helpers
│   └── tests/                    # Test files
├── scripts/
│   ├── generate-mock-data.js     # Mock data generation
│   ├── evaluate-multiple-datasets.js # Evaluation framework
│   ├── analyze-conversations.js  # Conversation analysis
│   └── conversation-dashboard.js # Dashboard generation
├── data/                         # Generated mock data
├── logs/                         # Conversation logs
├── dashboard/                    # Dashboard files
├── analysis/                     # Analysis results
├── setup.sh                     # Automated setup script
├── run-pipeline.sh              # Complete pipeline script
└── README.md                    # Comprehensive documentation
```

## Available Commands

### **NPM Scripts**
```bash
npm start                    # Run basic simulator
npm test                     # Run test suite
npm run simulator:generated  # Run advanced simulator
npm run evaluate             # Run evaluation framework
npm run dashboard            # Generate dashboard
npm run analyze              # Analyze conversations
npm run monitoring           # Start monitoring dashboard
npm run evaluation           # Run comprehensive evaluation
```

### **Mock Data Generation**
```bash
npm run generate:mock        # Generate mock data
npm run generate:successful  # Generate successful scenarios
npm run generate:failure     # Generate identity failure scenarios
npm run generate:mixed       # Generate mixed scenarios with LLM
```

### **Direct Script Execution**
```bash
# Mock data generation
node scripts/generate-mock-data.js --count 20 --type mixed

# Evaluation
node scripts/evaluate-multiple-datasets.js

# Analysis
node scripts/analyze-conversations.js

# Dashboard
node scripts/conversation-dashboard.js
```

## Troubleshooting

### **Common Issues**

#### **1. OpenAI API Key Not Configured**
```bash
# Edit .env file
nano .env
# Add: OPENAI_API_KEY=your_api_key_here
```

#### **2. Dependencies Not Installed**
```bash
npm install
```

#### **3. Permissions Issues**
```bash
chmod +x setup.sh
chmod +x run-pipeline.sh
```

#### **4. Node.js Version Issues**
```bash
# Check Node.js version
node -v
# Should be v18+ for optimal performance
```

### **Debug Mode**
```bash
# Enable debug logging
export DEBUG=true
node src/simulator.js
```

## Performance Tips

### **Optimization**
- Use `NODE_ENV=production` for better performance
- Configure `OPENAI_TEMPERATURE=0` for consistent responses
- Use `CACHE_LLM_RESPONSES=true` for faster responses

### **Monitoring**
- Check `logs/` directory for conversation details
- Use dashboard for real-time metrics
- Run analysis scripts for performance insights

## Success Indicators

### **Setup Success**
- ✅ Dependencies installed
- ✅ Environment configured
- ✅ Mock data generated
- ✅ Tests passing
- ✅ Dashboard accessible

### **Execution Success**
- ✅ Simulator running
- ✅ Dashboard showing metrics
- ✅ Logs being generated
- ✅ Analysis completed

## Support

### **Documentation**
- **README.md** - Comprehensive project documentation
- **README_TECHNICAL_DOCUMENTATION.md** - Technical implementation details
- **README_QUICK_START.md** - This quick start guide

### **Issues**
- Check GitHub issues: [Open an issue](https://github.com/alejoartia/fuse-financial-verification-agent/issues)
- Review logs in `logs/` directory
- Check console output for error messages

### **Community**
- GitHub repository: [fuse-financial-verification-agent](https://github.com/alejoartia/fuse-financial-verification-agent)
- Documentation: See README.md for comprehensive guide

---

**Ready to get started? Run `./setup.sh` and follow the prompts!**
