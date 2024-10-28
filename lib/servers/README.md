# Servers

> This directory contains all the server implementations.

## `m-chandler/factorio-spot-pricing` CloudFormation server

This server is designed to interact with a CloudFormation stack, deployed based on the [m-chandler/factorio-spot-pricing](https://github.com/m-chandler/factorio-spot-pricing) CloudFormation template.

## Usage

### Standard usage

```ts
import { servers } from "factorio-server-manager";

const { MChandlerCloudFormationServer } = servers;

const cf = new CloudFormation({
  region: "us-east-1",
});

const server = new MChandlerCloudFormationServer(cf, "my-factorio-stack-name");
```

### With custom launch parameters

```ts
import { servers } from "factorio-server-manager";

const { MChandlerCloudFormationServer } = servers;

const cf = new CloudFormation({
  region: "us-east-1",
});

const server = new MChandlerCloudFormationServer(cf, "my-factorio-stack-name", {
  EnableRcon: {
    value: "false",
  },
  FactorioImageTag: {
    value: "latest",
  },
});
```

## Launch arguments

If you want to control the value of the CloudFormation parameters, you can pass them as launch arguments to the constructor. The following parameters are supported:

- EnableRcon
- FactorioImageTag
- HostedZoneId
- RecordName
- KeyPairName
- YourIp

By default, these will use the current parameter value. If you want to override them, you can pass them as an object to the constructor (see the example above).

The full parameter set is available statically on the class (`.defaultLaunchArguments`):

```ts
import { servers } from "factorio-server-manager";

const { MChandlerCloudFormationServer } = servers;

console.log(MChandlerCloudFormationServer.defaultLaunchArguments);
```
