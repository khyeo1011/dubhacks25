# JiraGenie

An intelligent, lightning-fast assistant that helps analyze and interact with Jira issues using natural language queries. Built with Forge and powered by Google's Gemini AI for rapid responses and real-time insights.

## Features

### 🎯 Core Capabilities

- **Natural Language Queries**: Ask questions about your Jira issues in plain English
- **Voice Input Support**: Hands-free querying with speech-to-text functionality
- **Smart Analysis**: AI-powered analysis of Jira issue data
- **Markdown Rendering**: Clean, formatted responses using Atlassian Document Format

### 🎤 Voice Interaction

- Real-time voice-to-text transcription
- Continuous listening mode with interim results
- Visual feedback for recording state
- Browser compatibility detection

## Setup & Installation

### Prerequisites

1. Node.js and npm
2. Forge CLI: `npm install -g @forge/cli`
3. A Jira Cloud instance
4. A Google Cloud Platform account with Gemini API access

### Installation Steps

1. Install dependencies:
```bash
npm install
```

2. Set the following environment variables and manifest:
```
environment variables : 
    JIRA_BASE_URL
    JIRA_EMAIL
    JIRA_API_TOKEN
    GEMINI_API_KEY
forge variables set <ENV_NAME> <VALUE>

https://uw-dh25.atlassian.net > to your atlassian page.
```

3. Deploy the app:
```bash
forge deploy
```

1. Install in your Jira instance:
```bash
forge install
```

## Development

### Local Development

Run the app locally using Forge tunnel:
```bash
forge tunnel
```

### Project Structure

- `src/frontend/`: React-based UI components
  - `index.jsx`: Main app interface
  - `stt.js`: Speech-to-text functionality

- `src/resolvers/`: Backend logic
  - `geminiClient.js`: AI integration
  - `index.js`: API resolvers

### Key Technologies

- React for UI
- Forge UI Kit for Atlassian integration
- Google Gemini for AI analysis
- Web Speech API for voice input

## Usage

1. Navigate to your Jira project
2. Look for the "JiraGenie" module
3. Enter your query by typing or using voice input
4. Click submit to process
5. View the AI-generated response in formatted text

## Security & Privacy

- All data processing happens within Forge's secure environment
- No persistent storage of voice data
- Compliant with Atlassian's security standards



