# Servers

> This directory contains all the server implementations.

## CloudFormation

This server is designed to interact with a CloudFormation stack, deployed based on the [m-chandler/factorio-spot-pricing](https://github.com/m-chandler/factorio-spot-pricing) CloudFormation template.

### Usage

```ts
import { CloudFormationServer } from "factorio-server-manager";

const server = new CloudFormationServer({
  stackName: "my-factorio-stack-name",
  region: "us-east-1",
});
```
