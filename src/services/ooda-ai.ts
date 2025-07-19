import axios from 'axios';

export interface QueryResponse {
  answer: string;
  sources?: Array<{
    title: string;
    url: string;
  }>;
}

export class OODAAIService {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL: string = 'https://api.ooda.ai/v1') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async query(question: string): Promise<QueryResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/query`,
        { question },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        answer: response.data.answer,
        sources: response.data.sources
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`OODA AI API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }
}
