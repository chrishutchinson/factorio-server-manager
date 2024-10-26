import { ServerInterface, ServerState } from "../ServerInterface";

export class MockServer implements ServerInterface {
  private state: ServerState = ServerState.Stopped;

  public async getState(): Promise<ServerState> {
    return this.state;
  }

  public async start(): Promise<void> {
    this.state = ServerState.Running;
  }

  public async stop(): Promise<void> {
    this.state = ServerState.Stopped;
  }
}
