# Factorio Server Manager

> A simple Node.js server manager for Factorio servers, that can be integrated into CLIs, web apps, chat bots and more.

> [!CAUTION]
> This library is a work-in-progress, it is not yet published to NPM.

## Installation

```bash
# NPM
npm install factorio-server-manager

# Yarn
yarn add factorio-server-manager
```

## Usage

### Basic usage with CloudFormation

```ts
import {
  FactorioServerManager,
  CloudFormationServer,
} from "factorio-server-manager";

const server = new CloudFormationServer({
  stackName: "my-factorio-stack-name",
  region: "us-east-1",
});

const serverManager = new FactorioServerManager(server);

await serverManager.start();
```

### With optional RCON configuration, for running commands on the server (e.g. `/server-save`)

```ts
import {
  FactorioServerManager,
  CloudFormationServer,
} from "factorio-server-manager";

const server = new CloudFormationServer({
  stackName: "my-factorio-stack-name",
  region: "us-east-1",
});

const rconClient = new Rcon({
  host: "factorio-server-ip-or-hostname",
  port: 27015,
});

const serverManager = new FactorioServerManager(server, {
  client: rconClient,
  password: "rcon-password",
});

await serverManager.getPlayers();
```

### Setting the RCON configuration after initiatlisation

```ts
import {
  FactorioServerManager,
  CloudFormationServer,
} from "factorio-server-manager";

const server = new CloudFormationServer({
  stackName: "my-factorio-stack-name",
  region: "us-east-1",
});

const serverManager = new FactorioServerManager(server);

await serverManager.start();

const rconClient = new Rcon({
  host: "factorio-server-ip-or-hostname",
  port: 27015,
});

serverManager.setRconConfiguration(rconClient, "rcon-password");

await serverManager.getPlayers();
```

## Development

### Testing

Run the unit tests with:

```bash
npm test
```

### Adding new server-types

If you have another way of managing your Factorio server (e.g. EC2 box, GCP instance, etc.), you can create a new server class that extends the `ServerInterface` interface.

```ts
import { ServerInterface } from "factorio-server-manager";

export class MyCustomServer implements ServerInterface {
  // Implement the ServerInterface methods here
}
```

A server implementing this interface only requires the following methods:

- The ability to start the server (`start()`)
- The ability to stop the server (`stop()`)
- The ability to get the server's current status (`getStatus()`)

### Contributing

If you have any ideas for new features, or find any bugs, please open an issue or a pull request. New server implementations are always welcome.

## How should I use this library?

This library is designed to be used in a variety of ways, including:

- As part of a CLI tool
- As part of a web app
- As part of a chat bot

I personally use this library in a Telegram bot, that maps simple commands (e.g. `/start`, `/stop`, `/status`) to the methods provided by the `FactorioServerManager` class. It also supports more complex commands via RCON, as well as automatic shutdowns based on the number of players online.
