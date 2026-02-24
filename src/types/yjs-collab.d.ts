// Type declarations for y-monaco and y-webrtc

declare module "y-monaco" {
  import * as Y from "yjs";
  import type { editor } from "monaco-editor";

  export class MonacoBinding {
    constructor(
      yText: Y.Text,
      model: editor.ITextModel,
      editors: Set<editor.IStandaloneCodeEditor>,
      awareness?: unknown,
    );
    destroy(): void;
  }
}

declare module "y-webrtc" {
  import * as Y from "yjs";

  interface WebrtcProviderOptions {
    signaling?: string[];
    password?: string | null;
    awareness?: unknown;
    maxConns?: number;
    filterBcConns?: boolean;
    peerOpts?: Record<string, unknown>;
  }

  export class WebrtcProvider {
    constructor(roomName: string, doc: Y.Doc, options?: WebrtcProviderOptions);
    awareness: {
      setLocalStateField(field: string, value: unknown): void;
      getStates(): Map<number, Record<string, unknown>>;
      on(event: string, handler: (...args: unknown[]) => void): void;
      off(event: string, handler: (...args: unknown[]) => void): void;
    };
    roomName: string;
    connected: boolean;
    destroy(): void;
  }
}
