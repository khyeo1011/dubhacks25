# JiraGenie

An intelligent assistant that helps analyze and interact with Jira issues using natural language queries. Built with Forge and powered by Google's Gemini AI.

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

2. Deploy the app:
```bash
forge deploy
```

3. Install in your Jira instance:
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
2. Look for the "Smart Query" module
3. Enter your query by typing or using voice input
4. Click submit or stop voice recording to process
5. View the AI-generated response in formatted text

## Security & Privacy

- All data processing happens within Forge's secure environment
- No persistent storage of voice data
- Compliant with Atlassian's security standards

## Support & Contribution

For issues or feature requests, please use the GitHub issue tracker.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

