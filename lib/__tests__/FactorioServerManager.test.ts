import RCON from "rcon-srcds";

import { FactorioServerManager } from "../FactorioServerManager";
import { ServerState } from "../ServerInterface";
import { MockServer } from "./MockServer";

jest.mock("rcon-srcds");

describe("FactorioServerManager", () => {
  describe("#constructor", () => {
    it("should create a new instance", () => {
      const server = new MockServer();
      const manager = new FactorioServerManager(server);

      expect(manager).toBeInstanceOf(FactorioServerManager);
    });
  });

  describe("#getState()", () => {
    it("should return the state of the server", async () => {
      const server = new MockServer();
      const manager = new FactorioServerManager(server);

      expect(await manager.getState()).toBe(ServerState.Stopped);
    });
  });

  describe("#start()", () => {
    it("should start the server", async () => {
      const server = new MockServer();
      const manager = new FactorioServerManager(server);

      await manager.start();

      expect(await manager.getState()).toBe(ServerState.Running);
    });
  });

  describe("#stop()", () => {
    it("should stop the server", async () => {
      const server = new MockServer();
      const manager = new FactorioServerManager(server);

      await manager.start();

      await manager.stop();

      expect(await manager.getState()).toBe(ServerState.Stopped);
    });
  });

  describe("#setRconConfiguration()", () => {
    it("should set the RCON client and password", async () => {
      const server = new MockServer();
      const manager = new FactorioServerManager(server);

      const rconClient = new RCON({
        host: "fake-rcon-host",
        port: 27015,
      });

      manager.setRconConfiguration(rconClient, "password");

      await expect(manager.getPlayers()).resolves.toEqual([]);
    });
  });

  describe("#getPlayers()", () => {
    it("should throw an error if an RCON client is not provided", async () => {
      const server = new MockServer();
      const manager = new FactorioServerManager(server);

      await expect(manager.getPlayers()).rejects.toThrow(
        "RCON client not provided"
      );
    });

    it("should throw an error if an RCON passowrd is not provided", async () => {
      const server = new MockServer();
      const rconClient = new RCON({
        host: "fake-rcon-host",
        port: 27015,
      });
      const manager = new FactorioServerManager(server, {
        client: rconClient,
        password: "",
      });

      await expect(manager.getPlayers()).rejects.toThrow(
        "RCON password not provided"
      );
    });

    it("should return an empty array if the RCON response is a boolean", async () => {
      const server = new MockServer();
      const rconClient = new RCON({
        host: "fake-rcon-host",
        port: 27015,
      });
      const manager = new FactorioServerManager(server, {
        client: rconClient,
        password: "password",
      });

      jest.mocked(rconClient).authenticate.mockResolvedValue(true);
      jest.mocked(rconClient).execute.mockResolvedValue(false);

      await expect(manager.getPlayers()).resolves.toEqual([]);
    });

    it("should return an empty array if the response does not return any matches", async () => {
      const server = new MockServer();
      const rconClient = new RCON({
        host: "fake-rcon-host",
        port: 27015,
      });
      const manager = new FactorioServerManager(server, {
        client: rconClient,
        password: "password",
      });

      jest.mocked(rconClient).authenticate.mockResolvedValue(true);
      jest
        .mocked(rconClient)
        .execute.mockResolvedValue("Online players (0):\n");

      await expect(manager.getPlayers()).resolves.toEqual([]);
    });

    it.each([
      {
        value: "Online players (1):\n player-username-1 (online)\n",
        expected: ["player-username-1"],
        count: 1,
      },
      {
        value:
          "Online players (2):\n player-username-1 (online)\n player-username-2 (online)\n",
        expected: ["player-username-1", "player-username-2"],
        count: 2,
      },
    ])(
      "should return an array of $count players",
      async ({ value, expected }) => {
        const server = new MockServer();
        const rconClient = new RCON({
          host: "fake-rcon-host",
          port: 27015,
        });

        const manager = new FactorioServerManager(server, {
          client: rconClient,
          password: "password",
        });

        jest.mocked(rconClient).authenticate.mockResolvedValue(true);
        jest.mocked(rconClient).execute.mockResolvedValue(value);

        await expect(manager.getPlayers()).resolves.toEqual(expected);
      }
    );

    it("should call execute with the online players command", async () => {
      const server = new MockServer();
      const rconClient = new RCON({
        host: "fake-rcon-host",
        port: 27015,
      });

      const manager = new FactorioServerManager(server, {
        client: rconClient,
        password: "password",
      });

      jest.mocked(rconClient).authenticate.mockResolvedValue(true);
      jest
        .mocked(rconClient)
        .execute.mockResolvedValue(
          "Online players (1):\n player-username-1 (online)\n"
        );

      await manager.getPlayers();

      expect(jest.mocked(rconClient).execute).toHaveBeenCalledWith(
        "/players o"
      );
    });

    it("should disconnect from the RCON server after getting the players", async () => {
      const server = new MockServer();
      const rconClient = new RCON({
        host: "fake-rcon-host",
        port: 27015,
      });

      const manager = new FactorioServerManager(server, {
        client: rconClient,
        password: "password",
      });

      jest.mocked(rconClient).authenticate.mockResolvedValue(true);
      jest
        .mocked(rconClient)
        .execute.mockResolvedValue(
          "Online players (1):\n player-username-1 (online)\n"
        );

      await manager.getPlayers();

      expect(rconClient.disconnect).toHaveBeenCalledTimes(1);
    });
  });
});
