// Type definitions for environment variables
// This file augments the NodeJS namespace to include strict typing for process.env
// It assumes @types/node is present or process is defined elsewhere.

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}
