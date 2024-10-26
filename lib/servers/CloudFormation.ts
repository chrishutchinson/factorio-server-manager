import {
  CloudFormationClient,
  DescribeStacksCommand,
  UpdateStackCommand,
} from "@aws-sdk/client-cloudformation";

import { ServerInterface, ServerState } from "../ServerInterface";

export class CloudFormationServer implements ServerInterface {
  constructor(private cf: CloudFormationClient, private stackName: string) {}

  async getState(): Promise<ServerState> {
    try {
      const command = new DescribeStacksCommand({
        StackName: this.stackName,
      });

      const result = await this.cf.send(command);

      if (!result.Stacks || result.Stacks.length === 0) {
        throw new Error("No stacks found");
      }

      const serverState =
        result.Stacks[0].Parameters?.find(
          (param) => param.ParameterKey === "ServerState"
        )?.ParameterValue || "Unknown";

      if (serverState === "Running") {
        if (result.Stacks[0].StackStatus === "UPDATE_IN_PROGRESS") {
          return ServerState.Starting;
        }

        return ServerState.Running;
      }

      if (serverState === "Stopped") {
        if (result.Stacks[0].StackStatus === "UPDATE_IN_PROGRESS") {
          return ServerState.Stopping;
        }

        return ServerState.Stopped;
      }

      return ServerState.Unknown;
    } catch (e) {
      return ServerState.Unknown;
    }
  }

  async start(): Promise<void> {
    const updateCommand = new UpdateStackCommand({
      StackName: this.stackName,
      Parameters: [
        {
          ParameterKey: "ServerState",
          UsePreviousValue: false,
          ParameterValue: "Running",
        },
        {
          ParameterKey: "FactorioImageTag",
          UsePreviousValue: true,
        },
        {
          ParameterKey: "HostedZoneId",
          UsePreviousValue: true,
        },
        {
          ParameterKey: "RecordName",
          UsePreviousValue: true,
        },
        {
          ParameterKey: "KeyPairName",
          UsePreviousValue: true,
        },
        {
          ParameterKey: "YourIp",
          UsePreviousValue: true,
        },
        {
          ParameterKey: "EnableRcon",
          UsePreviousValue: true,
        },
      ],
      UsePreviousTemplate: true,
      Capabilities: ["CAPABILITY_IAM"],
    });

    await this.cf.send(updateCommand);
  }

  async stop(): Promise<void> {
    const updateCommand = new UpdateStackCommand({
      StackName: this.stackName,
      UsePreviousTemplate: true,
      Parameters: [
        {
          ParameterKey: "ServerState",
          UsePreviousValue: false,
          ParameterValue: "Stopped",
        },
        {
          ParameterKey: "FactorioImageTag",
          UsePreviousValue: true,
        },
        {
          ParameterKey: "HostedZoneId",
          UsePreviousValue: true,
        },
        {
          ParameterKey: "RecordName",
          UsePreviousValue: true,
        },
        {
          ParameterKey: "KeyPairName",
          UsePreviousValue: true,
        },
        {
          ParameterKey: "YourIp",
          UsePreviousValue: true,
        },
        {
          ParameterKey: "EnableRcon",
          UsePreviousValue: true,
        },
      ],
      Capabilities: ["CAPABILITY_IAM"],
    });

    await this.cf.send(updateCommand);
  }
}
