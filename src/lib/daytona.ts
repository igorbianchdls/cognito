import { Daytona } from '@daytonaio/sdk';

export interface DaytonaConfig {
  apiKey?: string;
  apiUrl?: string;
  target?: string;
}

export class DaytonaClient {
  private client: Daytona;

  constructor(config?: DaytonaConfig) {
    // Use environment variables as fallback
    const apiKey = config?.apiKey || process.env.DAYTONA_API_KEY;
    const apiUrl = config?.apiUrl || process.env.DAYTONA_API_URL || process.env.NEXT_PUBLIC_DAYTONA_API_URL;
    const target = config?.target || process.env.DAYTONA_TARGET || process.env.NEXT_PUBLIC_DAYTONA_TARGET;

    this.client = new Daytona({
      apiKey,
      apiUrl,
      target
    });
  }

  getClient(): Daytona {
    return this.client;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Try to make a simple API call to check connectivity
      // This is a placeholder - actual implementation depends on SDK methods
      return true;
    } catch (error) {
      console.error('Daytona health check failed:', error);
      return false;
    }
  }
}

// Export a default instance
export const daytonaClient = new DaytonaClient();

// Export the SDK types for convenience
export type { Daytona } from '@daytonaio/sdk';