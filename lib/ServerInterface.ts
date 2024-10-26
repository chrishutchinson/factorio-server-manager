export enum ServerState {
  Starting = "Starting",
  Running = "Running",
  Stopping = "Stopping",
  Stopped = "Stopped",
  Unknown = "Unknown",
}

export interface ServerInterface {
  getState(): Promise<ServerState>;
  start(): Promise<void>;
  stop(): Promise<void>;
}
