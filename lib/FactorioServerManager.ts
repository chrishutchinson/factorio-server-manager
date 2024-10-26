import Rcon from "rcon-srcds";

import { ServerInterface, ServerState } from "./ServerInterface";

export class FactorioServerManager {
  private rcon: Rcon | null;
  private rconPassword: string | null;

  constructor(
    private server: ServerInterface,
    rconConfiguration: {
      client: Rcon;
      password: string;
    } | null = null
  ) {
    this.rcon = rconConfiguration ? rconConfiguration.client : null;
    this.rconPassword = rconConfiguration ? rconConfiguration.password : null;
  }

  public async getState(): Promise<ServerState> {
    return this.server.getState();
  }

  public async start(): Promise<void> {
    await this.server.start();
  }

  public async stop(): Promise<void> {
    await this.server.stop();
  }

  public setRconConfiguration(client: Rcon, password: string) {
    this.rcon = client;
    this.rconPassword = password;
  }

  public async getPlayers(): Promise<Array<string>> {
    if (!this.rcon) {
      throw new Error("RCON client not provided");
    }

    if (!this.rconPassword) {
      throw new Error("RCON password not provided");
    }

    try {
      await this.rcon.authenticate(this.rconPassword);

      const response = await this.rcon.execute("/players o");

      if (typeof response !== "string") {
        return [];
      }

      const matches = response.match(
        /Online players \(\d+\):\n((?:\s+[^\n]+\n?)+)/
      );

      if (!matches) {
        return [];
      }

      const players = matches[1]
        .replaceAll(" (online)", "")
        .trim()
        .split(/\s+/);

      return players;
    } finally {
      await this.rcon.disconnect();
    }
  }
}
