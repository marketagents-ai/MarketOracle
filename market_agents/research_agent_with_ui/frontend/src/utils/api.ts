import { toast } from 'react-hot-toast';

export class APIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'APIError';
  }
}

export const handleAPIError = (error: unknown): string => {
  console.error('API Error:', error);
  if (error instanceof APIError) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
};