import { Channels } from 'main/preload';
import { ScanDirectoryResult, GetDirectoryResult } from './MainScreen';

type Result = ScanDirectoryResult & GetDirectoryResult;

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        sendMessage(channel: Channels, args: unknown[]): void;
        on(
          channel: Channels,
          func: (args: Result) => void
        ): (() => void) | undefined;
        once(channel: Channels, func: (...args: unknown[]) => void): void;
      };
    };
  }
}

export {};
