/**
 * @fileoverview Vectara Configuration
 * 
 * This module defines all configuration settings for the Vectara AI service:
 * - System prompts and query templates that shape AI responses
 * - Query parameters that control search and generation behavior
 * 
 * All settings can be overridden via environment variables if needed.
 * 
 * @module config/prompts
 */

/**
 * System prompt that provides context and instructions to the AI.
 * 
 * This prompt:
 * - Establishes the AI's role and purpose
 * - Sets guidelines for response format and style
 * - Defines expectations for citations and sources
 * 
 * @constant
 * @type {string}
 */
export const SYSTEM_PROMPT = `You are a research assistant. CRITICAL INSTRUCTION: Your task is to create a 3-4 paragraph summary using relevant information found in the search results.

Rules for content use:
1. Maximum four paragraphs
2. Combine multiple sources if needed
3. Use clear, direct language
4. Reference experts

`;

/**
 * Template for formatting user queries.
 * 
 * This template:
 * - Structures how user questions are presented to the AI
 * - Ensures consistent query formatting
 * - Helps maintain context between queries
 * 
 * @constant
 * @type {string}
 */
/**
 * Default query parameters for Vectara API.
 * All values can be overridden via environment variables.
 * 
 * @constant
 * @type {object}
 */
export const VectaraQueryDefaults = {
    // Search settings
    searchDepth: 100,          // Number of results to search through
    maxResults: 20,            // Number of results to use in generation
    maxTokens: 300,            // Maximum tokens in generated response
    maxResponseChars: 4000,    // Maximum characters in response
    
    // Generation settings
    temperature: 0.5,          // Controls randomness (0.0-1.0)
    frequencyPenalty: 0.3,     // Reduces repetition of similar phrases
    presencePenalty: 0.3,      // Encourages covering new topics
    
    // Reranking settings
    relevanceThreshold: 0.25,  // Minimum relevance score for results
    diversityBias: 0.2         // Controls variety in search results (0.0-1.0)
} as const;

export const QUERY_TEMPLATE = `
#foreach( $doc in $vectaraQueryResults )
Title: $doc.document_metadata.title  
URL: $doc.document_metadata.url  
$doc.text

#end

Based on the provided OODAloop.com content, provide a 3-4 paragraph summary answering "{question}". Reference experts.`;
