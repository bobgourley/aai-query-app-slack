import { App, LogLevel } from '@slack/bolt';

/**
 * Clean up markdown-style formatting from text
 */
function cleanupMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold (**text**)
    .replace(/\*(.*?)\*/g, '$1')      // Remove italic (*text*)
    .replace(/`(.*?)`/g, '$1')        // Remove code ticks
    .replace(/_{2}(.*?)_{2}/g, '$1')  // Remove underscores
    .replace(/^#{1,6}\s/gm, '')       // Remove heading marks
    .trim();
}

/**
 * Format sources with a maximum of 15 sources
 */
function formatSources(sources: Array<{ url: string; title: string }>) {
  if (!sources || sources.length === 0) return '';
  
  // Take only the first 15 sources
  const limitedSources = sources.slice(0, 15);
  
  let sourcesText = '\n\n*Sources:*';
  limitedSources.forEach(source => {
    sourcesText += `\n• <${source.url}|${source.title}>`;
  });
  
  return sourcesText;
}
/**
 * @fileoverview OODA AI Slack Bot Application
 * 
 * This is the main entry point for the OODA AI Slack bot. It initializes the Slack
 * application using the Bolt framework and sets up handlers for various types of
 * interactions including slash commands, direct messages, and channel mentions.
 * 
 * The bot integrates with Vectara's AI service to provide intelligent responses to
 * queries about OODA Loop content, complete with source citations and context.
 *
 * Key Features:
 * - Slack Bolt framework integration
 * - Socket Mode for real-time messaging
 * - Multiple interaction handlers
 * - Error handling and logging
 * - Vectara service integration
 * 
 * @module app
 */

import dotenv from 'dotenv';
import { VectaraService } from './services/vectara';
import { SYSTEM_PROMPT, QUERY_TEMPLATE, VectaraQueryDefaults } from './config/prompts';

// Load environment variables
dotenv.config();

// Log the tokens (partially) to verify they're loaded
console.log('Bot Token starts with:', process.env.SLACK_BOT_TOKEN?.substring(0, 10));
console.log('App Token starts with:', process.env.SLACK_APP_TOKEN?.substring(0, 10));

// Initialize Vectara service
/**
 * Initialize the Vectara service with configuration.
 * 
 * This service handles all communication with Vectara's API including
 * query processing, response parsing, and source extraction.
 */
const vectara = new VectaraService({
  customerId: process.env.VECTARA_CUSTOMER_ID || '',
  apiKey: process.env.VECTARA_API_KEY || '',
  corpusKey: process.env.VECTARA_CORPUS_KEY || '',
  prePrompt: SYSTEM_PROMPT,
  promptTemplate: QUERY_TEMPLATE,
  searchDepth: parseInt(process.env.VECTARA_SEARCH_DEPTH || String(VectaraQueryDefaults.searchDepth), 10),
  maxResults: parseInt(process.env.VECTARA_MAX_RESULTS || String(VectaraQueryDefaults.maxResults), 10),
  maxTokens: parseInt(process.env.VECTARA_MAX_TOKENS || String(VectaraQueryDefaults.maxTokens), 10),
  temperature: parseFloat(process.env.VECTARA_TEMPERATURE || String(VectaraQueryDefaults.temperature)),
  frequencyPenalty: parseFloat(process.env.VECTARA_FREQUENCY_PENALTY || String(VectaraQueryDefaults.frequencyPenalty)),
  presencePenalty: parseFloat(process.env.VECTARA_PRESENCE_PENALTY || String(VectaraQueryDefaults.presencePenalty)),
  relevanceThreshold: parseFloat(process.env.VECTARA_RELEVANCE_THRESHOLD || String(VectaraQueryDefaults.relevanceThreshold)),
  diversityBias: parseFloat(process.env.VECTARA_DIVERSITY_BIAS || String(VectaraQueryDefaults.diversityBias))
});

// Initialize your app
/**
 * Initialize the Slack Bolt application with Socket Mode.
 * 
 * Socket Mode provides a WebSocket connection to Slack's Events API,
 * allowing the bot to receive and respond to events in real-time without
 * requiring a public HTTP endpoint.
 */
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: 3000,
  logLevel: LogLevel.DEBUG
});

// Log when app starts
console.log('⚡️ Starting Bolt app...');

// Log any errors and handle reconnection
app.error(async (error) => {
  console.error('=== App Error ===');
  if (error.code === 'too_many_websockets') {
    console.error('Too many WebSocket connections - waiting before reconnecting...');
    // Wait 5 seconds before attempting to reconnect
    await new Promise(resolve => setTimeout(resolve, 5000));
    try {
      await app.start();
      console.log('Successfully reconnected!');
    } catch (reconnectError) {
      console.error('Failed to reconnect:', reconnectError);
    }
  } else {
    console.error('Error Details:', {
      code: error.code,
      message: error.message
    });
  }
});

// Handle direct messages for queries
/**
 * Handle direct messages to the bot.
 * 
 * This handler processes natural language queries sent via direct message.
 * It supports a conversational interface where users can ask questions
 * about OODA Loop content in a more natural way.
 * 
 * @event message
 * @param {Object} message - The message payload
 * @param {Function} say - Function to send a message to the channel
 */
app.message(async ({ message, say, client }) => {
  // Skip if message doesn't have text
  if (!message || !('text' in message) || !message.text) {
    return;
  }
  // Skip if it's not a DM or if it's a bot message
  if (message.channel_type !== 'im' || message.subtype === 'bot_message') {
    return;
  }

  console.log('Received DM:', message);

  console.log('Received message:', message.text);
  // Skip if it's a hello message (handled by other handler)
  if (message.text.toLowerCase().includes('hello')) {
    return;
  }

  try {
    console.log('=== Processing DM Query ===');
    console.log('Query:', message.text);

    await say(`Querying OODA AI with: "${message.text}"...`);
    const response = await vectara.query(message.text);
    
    console.log('Vectara Response:', JSON.stringify(response, null, 2));
    
    let replyText = cleanupMarkdown(response.summary || '');
    replyText += formatSources(response.sources);
    
    console.log('Sending reply:', replyText);
    await say({ text: replyText, mrkdwn: true });
  } catch (error) {
    console.error('=== Query Error ===');
    if (error instanceof Error) {
      console.error('Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } else {
      console.error('Unknown error:', error);
    }
    await say(`Error processing query. Please try again in a moment.`);
  }
});

// Hello command handler
app.command('/hello', async ({ command, ack, say }) => {
  await ack();
  await say(`Hello! You triggered ${command.command}`);
});

// Query command handler
/**
 * Handle the /query slash command.
 * 
 * This handler processes queries submitted via Slack's slash command interface.
 * It acknowledges the command immediately, processes the query through Vectara,
 * and formats the response with summary and sources for display in Slack.
 * 
 * @event command{/query}
 * @param {Object} command - The slash command payload
 * @param {Function} ack - Function to acknowledge receipt of the command
 * @param {Function} say - Function to send a message to the channel
 */
app.command('/ask', async ({ command, ack, respond, client }) => {
  console.error('\n=== Starting Query Command ===');
  await ack();
  
  const query = command.text.trim();
  console.error('Received slash command query:', query);
  if (!query) {
    await respond({
      response_type: 'ephemeral',
      text: 'Please provide a question. Usage: /ask your question here'
    });
    return;
  }

  // Send initial loading message
  // Ensure we have a channel ID
  if (!command.channel_id) {
    throw new Error('No channel ID provided');
  }

  // Send initial loading message and ensure we get a timestamp back
  const loadingMessage = await client.chat.postMessage({
    channel: command.channel_id!,
    text: 'Analyzing... Standby for results...',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:hourglass: *Analyzing... Standby for results...*\n_Query: ${query}_`
        }
      }
    ]
  });

  if (!loadingMessage.ts) {
    throw new Error('Failed to get message timestamp from Slack');
  }

  // Acknowledge the command
  await respond({
    response_type: 'ephemeral',
    text: 'Processing your query...'
  });

  try {
    console.log('=== Processing Slash Command Query ===');
    console.log('Query:', query);

    const response = await vectara.query(query);
    console.log('Vectara Response:', JSON.stringify(response, null, 2));
    
    let replyText = cleanupMarkdown(response.summary || '');
    replyText += formatSources(response.sources);
    
    console.log('Sending reply:', replyText);
    // Delete loading message
    try {
      if (loadingMessage.ts) {
        await client.chat.delete({
          channel: command.channel_id!,
          ts: loadingMessage.ts
        });
      }
    } catch (deleteError) {
      console.error('Error deleting loading message:', deleteError);
    }

    // Post new message with results
    await client.chat.postMessage({
      channel: command.channel_id!, 
      text: replyText,
      mrkdwn: true,
      unfurl_links: false,
      unfurl_media: false
    });
  } catch (error) {
    console.error('=== Query Error ===');
    if (error instanceof Error) {
      console.error('Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } else {
      console.error('Unknown error:', error);
    }
    
    // Delete loading message
    try {
      if (loadingMessage.ts) {
        await client.chat.delete({
          channel: command.channel_id!,
          ts: loadingMessage.ts
        });
      }
    } catch (deleteError) {
      console.error('Error deleting loading message:', deleteError);
    }

    // Post error message
    await client.chat.postMessage({
      channel: command.channel_id!, 
      text: ':x: Error processing query. Please try again in a moment.',
      unfurl_links: false,
      unfurl_media: false
    });
  }
});

// Respond to 'hello' messages in DMs only
app.message(/hello/i, async ({ message, say, client }) => {
  console.log('Matched hello message:', message);
  try {
    // Only respond to DMs
    if (message.channel_type === 'im') {
      await say({ text: 'Hello there! I received your DM.', thread_ts: message.ts });
      console.log('Sent DM response successfully');
    }
  } catch (error) {
    console.error('Error sending response:', error);
  }
});

// Add an app mention handler
app.event('app_mention', async ({ event, say }) => {
  console.log('Got app mention:', event);
  try {
    // Extract the actual query by removing the bot mention
    const query = event.text.replace(/<@[^>]+>/, '').trim();
    if (!query) {
      await say(`Hello <@${event.user}>! How can I help you?`);
      return;
    }

    // Send acknowledgment
    await say(`Processing query: "${query}"...`);

    // Process query
    const response = await vectara.query(query);
    
    // Format response
    let replyText = cleanupMarkdown(response.summary || '');
    replyText += formatSources(response.sources);

    // Send response in channel without URL previews
    await say({ 
      text: replyText, 
      mrkdwn: true,
      unfurl_links: false,
      unfurl_media: false
    });
    console.log('Sent mention response successfully');
  } catch (error) {
    console.error('Error processing mention:', error);
    await say('Sorry, I encountered an error processing your query. Please try again.');
  }
});

/**
 * Start the Slack bot application.
 * 
 * This self-executing async function initializes the bot and starts
 * listening for Slack events. It includes error handling for startup
 * issues and logs the bot's status.
 */
(async () => {
  await app.start();
  console.log('⚡️ Bolt app is running!');
})();
