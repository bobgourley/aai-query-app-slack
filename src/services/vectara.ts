/**
 * @fileoverview Vectara Service Integration
 * 
 * This module provides integration with Vectara's AI-powered search and summarization API.
 * It handles query processing, response parsing, and source extraction to enable intelligent
 * responses to user queries about OODA Loop content.
 *
 * Key Features:
 * - Natural language query processing
 * - AI-powered content summarization
 * - Source extraction and citation
 * - Error handling and logging
 * 
 * @module services/vectara
 */

import axios, { AxiosError } from 'axios';
import { logToFile } from '../utils/logger';
import { SYSTEM_PROMPT, QUERY_TEMPLATE, VectaraQueryDefaults } from '../config/prompts';

// Define interfaces
interface VectaraConfig {
    customerId: string;
    apiKey: string;
    corpusKey: string;
    prePrompt: string;
    promptTemplate: string;
    searchDepth: number;
    maxResults?: number;
    maxTokens?: number;
    temperature?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    diversityBias?: number;
    relevanceThreshold?: number;
    maxResponseChars?: number;
}

interface VectaraPrompt {
    role: 'system' | 'user';
    content: string;
}

interface VectaraCitations {
    style: string;
    url_pattern: string;
    text_pattern: string;
}

interface VectaraModelParameters {
    temperature: number;
    max_tokens: number;
    frequency_penalty: number;
    presence_penalty: number;
}

interface VectaraGeneration {
    generation_preset_name: string;
    prompt_template: string;
    max_used_search_results: number;
    max_response_characters: number;
    response_language: string;
    model_parameters: VectaraModelParameters;
    citations?: VectaraCitations | null;
}

interface VectaraReranker {
    type: string;
    diversity_bias: number;
    limit: number;
    cutoff: number;
}

interface VectaraCorpus {
    corpus_key: string;
}

interface VectaraSearch {
    corpora: VectaraCorpus[];
    limit: number;
    reranker: VectaraReranker;
}

interface VectaraRequestPayload {
    query: string;
    search: VectaraSearch;
    generation?: VectaraGeneration;
}

interface VectaraSearchResult {
    text?: string;
    score?: number;
    document_metadata?: {
        title?: string;
        url?: string;
        type?: string;
        excerpt?: string;
    };
}

interface VectaraResponse {
    summary: string;
    search_results: VectaraSearchResult[];
    factual_consistency_score: number;
    field_errors?: any[];
    messages?: string[];
}

interface VectaraSource {
    title: string;
    url: string;
}

// Add request interceptor
axios.interceptors.request.use(request => {
    logToFile('=== Axios Request ===');
    logToFile('Request Details', {
        url: request.url,
        method: request.method,
        headers: request.headers,
        data: request.data
    });
    return request;
});

/**
 * Service class for interacting with Vectara's API.
 *
 * Handles all communication with Vectara including:
 * - Query processing and formatting
 * - API request management
 * - Response parsing and validation
 * - Source extraction and formatting
 * - Error handling and logging
 *
 * @class VectaraService
 */
export class VectaraService {
    private readonly apiUrl: string;
    private readonly config: Required<VectaraConfig>;

    constructor(config: VectaraConfig) {
        // Initialize config with defaults for optional fields
        this.config = {
            customerId: config.customerId,
            apiKey: config.apiKey,
            corpusKey: config.corpusKey,
            prePrompt: config.prePrompt,
            promptTemplate: config.promptTemplate,
            searchDepth: config.searchDepth ?? VectaraQueryDefaults.searchDepth,
            maxResults: config.maxResults ?? VectaraQueryDefaults.maxResults,
            maxTokens: config.maxTokens ?? VectaraQueryDefaults.maxTokens,
            temperature: config.temperature ?? VectaraQueryDefaults.temperature,
            frequencyPenalty: config.frequencyPenalty ?? VectaraQueryDefaults.frequencyPenalty,
            presencePenalty: config.presencePenalty ?? VectaraQueryDefaults.presencePenalty,
            diversityBias: config.diversityBias ?? VectaraQueryDefaults.diversityBias,
            relevanceThreshold: config.relevanceThreshold ?? VectaraQueryDefaults.relevanceThreshold,
            maxResponseChars: config.maxResponseChars ?? VectaraQueryDefaults.maxResponseChars
        };

        // Set up API endpoint URL
        this.apiUrl = 'https://api.vectara.io/v2/query';

        // Log configuration for debugging
        logToFile('Vectara Configuration', {
            maxResults: this.config.maxResults,
            maxTokens: this.config.maxTokens,
            temperature: this.config.temperature,
            frequencyPenalty: this.config.frequencyPenalty,
            presencePenalty: this.config.presencePenalty,
            relevanceThreshold: this.config.relevanceThreshold,
            diversityBias: this.config.diversityBias
        });
    }

    /**
     * Query the Vectara API with a question and get a summary with relevant sources.
     * 
     * @param question - The question to ask
     * @returns Promise resolving to summary and sources
     * @throws {Error} If the API request fails or returns invalid data
     */
    async query(question: string): Promise<{ summary: string; sources: VectaraSource[] }> {
        try {
            // Create JSON array of prompts for Vectara
            const promptArray = [
                { role: 'system', content: this.config.prePrompt },
                { role: 'user', content: `#foreach( $doc in $vectaraQueryResults )
Title: $doc.document_metadata.title
URL: $doc.document_metadata.url
$doc.text

#end

Based on this content, ${question}` }
            ];
            
            // Debug log the prompts
            logToFile('Prompt Array', promptArray);

            // Build generation configuration
            const generation: VectaraGeneration = {
                generation_preset_name: 'vectara-summary-ext-24-05-med-omni',
                prompt_template: JSON.stringify(promptArray),
                max_used_search_results: this.config.maxResults,
                max_response_characters: this.config.maxResponseChars,
                response_language: 'eng',
                model_parameters: {
                    temperature: this.config.temperature,
                    max_tokens: this.config.maxTokens,
                    frequency_penalty: this.config.frequencyPenalty,
                    presence_penalty: this.config.presencePenalty
                },
                citations: {
                    style: 'none',
                    url_pattern: '',
                    text_pattern: ''
                }
            };

            // Set up request headers
            const headers = {
                'x-api-key': this.config.apiKey,
                'Content-Type': 'application/json'
            };

            // Build request payload
            const payload: VectaraRequestPayload = {
                query: question,
                search: {
                    corpora: [{ corpus_key: this.config.corpusKey }],
                    limit: this.config.searchDepth,
                    reranker: {
                        type: 'mmr',
                        diversity_bias: this.config.diversityBias,
                        limit: this.config.maxResults,
                        cutoff: this.config.relevanceThreshold
                    }
                },
                generation
            };

            // Log request details
            logToFile('Vectara Request', {
                url: this.apiUrl,
                headers: {
                    ...headers,
                    'x-api-key': '***redacted***'
                },
                payload: {
                    ...payload,
                    generation: {
                        ...payload.generation,
                        prompt_template: '***redacted***'
                    }
                }
            });

            // Send request to Vectara API
            const response = await axios.post<VectaraResponse>(this.apiUrl, payload, { headers });

            // Log response details
            logToFile('Vectara Response', {
                status: response.status,
                statusText: response.statusText,
                data: response.data
            });

            // Check for API errors
            if (response.data.field_errors || response.data.messages) {
                throw new Error(`Invalid response from Vectara: ${JSON.stringify(response.data.field_errors || response.data.messages)}`);
            }

            // Log full response data
            logToFile('Vectara Response Data', {
                summary: response.data.summary,
                search_results: response.data.search_results,
                factual_consistency_score: response.data.factual_consistency_score
            });

            // Extract and validate response data
            const { summary, search_results = [] } = response.data;
            if (!summary) {
                throw new Error('No summary in Vectara response');
            }

            // Log search results
            logToFile('Search Results', search_results);

            // Process and deduplicate sources
            const sources = search_results
                .filter((r: VectaraSearchResult) => (r.score ?? 0) >= (this.config.relevanceThreshold ?? 0.2))
                .map((r: VectaraSearchResult) => ({
                    title: r.document_metadata?.title ?? r.text?.substring(0, 100) ?? 'Untitled',
                    url: r.document_metadata?.url ?? ''
                }))
                .filter((s: VectaraSource) => s.url)
                .reduce((acc: VectaraSource[], curr: VectaraSource) => {
                    if (!acc.some(s => s.url === curr.url)) {
                        acc.push(curr);
                    }
                    return acc;
                }, []);

            logToFile('Processed Sources', sources);

            // Log output
            logToFile('Output', {
                summary,
                sources
            });

            return { summary, sources };
        } catch (error) {
            // Log error details
            if (error instanceof AxiosError) {
                logToFile('Vectara API Error', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    message: error.message
                });
            } else if (error instanceof Error) {
                logToFile('Vectara Error', error.message);
            } else {
                logToFile('Unknown Vectara Error', String(error));
            }

            // Rethrow the error
            throw error;
        }
    }}
