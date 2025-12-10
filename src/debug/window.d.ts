// ABOUTME: TypeScript type declarations for global window.game console API
// ABOUTME: Enables autocomplete and type checking for window.game commands

import { ConsoleAPI } from './ConsoleAPI';

declare global {
  interface Window {
    game: ConsoleAPI;
  }
}

export {};
