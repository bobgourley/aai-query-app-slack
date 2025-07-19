# OODA AI Slack Bot

A TypeScript-based Slack bot that integrates with Vectara's AI search and summarization capabilities to provide intelligent responses to queries about OODA Loop content.

## Architecture Overview

### Core Components

1. **Slack Integration (`src/app.ts`)**
   - Built with Slack's Bolt framework
   - Uses Socket Mode for real-time messaging
   - Handles three types of interactions:
     - Slash commands (`/query`)
     - Direct messages
     - Channel mentions

2. **Vectara Service (`src/services/vectara.ts`)**
   - Manages communication with Vectara's API
   - Handles query processing and response formatting
   - Features:
     - Intelligent search across corpus
     - AI-powered summarization
     - Source extraction and citation

3. **Configuration Management**
   - Environment-based configuration
   - Customizable prompts and templates
   - Configurable search parameters

### Data Flow

1. User sends a query via Slack
2. Bot processes the query and sends it to Vectara
3. Vectara searches the corpus and generates a summary
4. Bot formats the response with sources and sends it back to Slack

## Setup

### Prerequisites
- Node.js 16+
- npm 7+
- A Slack workspace with admin access
- A Vectara account with an indexed corpus

### Slack App Configuration

1. Create a new Slack app at https://api.slack.com/apps
2. Enable Socket Mode
3. Add the following OAuth scopes:
   - `chat:write`
   - `commands`
   - `app_mentions:read`
   - `channels:history`
   - `im:history`
   - `im:write`
   - `channels:join`
4. Create a `/query` slash command

### Environment Setup

1. Copy `.env.example` to `.env`
2. Configure Slack credentials:
   ```env
   SLACK_BOT_TOKEN=xoxb-your-token
   SLACK_SIGNING_SECRET=your-signing-secret
   SLACK_APP_TOKEN=xapp-your-token
   ```
3. Configure Vectara credentials:
   ```env
   VECTARA_CUSTOMER_ID=your-customer-id
   VECTARA_API_KEY=your-api-key
   VECTARA_CORPUS_KEY=your-corpus-key
   ```

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or for production
npm run build
npm start
```

## Features

### Query Processing
- Natural language query understanding
- Context-aware search across the corpus
- AI-powered summarization of relevant content
- Automatic source extraction and citation

### Response Formatting
- Clear, concise summaries
- Clickable source links
- Additional context when available
- Markdown formatting in Slack

### Error Handling
- Comprehensive error logging
- Graceful failure modes
- User-friendly error messages
- Automatic reconnection for WebSocket issues

## User Guide

### Getting Started

1. **Access the Bot**
   - Ensure OODA AI is installed in your Slack workspace
   - Contact your Slack admin if you don't see the bot

2. **Add to Channels**
   - Invite the bot to channels: `/invite @OODA AI`
   - The bot needs to be in a channel to respond to mentions

### Ways to Interact

1. **Slash Command** (Recommended for first-time users)
   ```
   /query What is hackthink?
   ```
   - Works in any channel where the bot is installed
   - Most structured way to ask questions
   - Visible to everyone in the channel

2. **Direct Messages** (Best for private queries)
   ```
   Tell me about threat intelligence
   ```
   - Start a DM with @OODA AI
   - More conversational interface
   - Queries and responses are private
   - No special commands needed

3. **Channel Mentions** (Good for collaborative discussions)
   ```
   @OODA AI What are the latest cybersecurity trends?
   ```
   - Use in any channel where the bot is present
   - Makes the conversation visible to the channel
   - Great for team discussions

### Understanding Responses

1. **Summary**
   - Clear, concise answer to your question
   - Based on relevant OODA Loop content
   - May include multiple perspectives

2. **Sources**
   - Clickable links to source articles
   - Helps verify information
   - Provides deeper context

3. **Additional Context**
   - Related information when available
   - Helps understand broader implications
   - May include related topics

### Best Practices

1. **Asking Questions**
   - Be specific and clear
   - Use complete sentences
   - One topic per query
   - Include relevant context

2. **Getting Better Results**
   - Start broad, then narrow down
   - Use follow-up questions
   - Check source articles
   - Try different phrasings

3. **Common Query Types**
   ```
   # Concept explanations
   What is the OODA loop?
   
   # Current trends
   What are the latest developments in AI security?
   
   # Analysis requests
   How does zero trust relate to SASE?
   
   # Historical context
   How has cyber threat intelligence evolved?
   ```

### Troubleshooting

1. **Bot Not Responding**
   - Check if the bot is in the channel
   - Verify your question format
   - Try using the /query command

2. **No Results**
   - Rephrase your question
   - Be more specific
   - Check for typos

3. **Need More Details**
   - Click source links
   - Ask follow-up questions
   - Request specific aspects

### Tips & Tricks

1. **Efficient Queries**
   - Use keywords thoughtfully
   - Mention specific technologies
   - Include timeframes if relevant

2. **Collaborative Use**
   - Share interesting findings
   - Build on others' questions
   - Use thread replies for discussions

3. **Advanced Features**
   - Combine multiple concepts
   - Ask for comparisons
   - Request trend analysis

## Development

### Project Structure
```
├── src/
│   ├── app.ts              # Main application entry
│   ├── services/
│   │   └── vectara.ts     # Vectara integration
│   ├── config/
│   │   └── prompts.ts     # AI prompts configuration
│   └── utils/
│       └── logger.ts      # Logging utilities
├── logs/                  # Application logs
└── dist/                  # Compiled output
```

### Logging
Extensive logging is implemented throughout the application:
- Request/response logging for API calls
- Query processing details
- Error tracking
- Performance metrics

Logs are written to both console and files in the `logs/` directory.

## Troubleshooting

### Common Issues
1. **WebSocket Disconnects**
   - Check for multiple bot instances
   - Verify Slack tokens
   - Monitor connection logs

2. **No Search Results**
   - Verify Vectara credentials
   - Check corpus indexing
   - Review query logs

3. **Rate Limiting**
   - Monitor API response headers
   - Implement request throttling if needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
