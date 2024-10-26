import {
  CloudFormationClient,
  DescribeStacksCommand,
  Parameter,
  UpdateStackCommand,
} from "@aws-sdk/client-cloudformation";

import { ServerInterface, ServerState } from "../ServerInterface";

type LaunchArgument =
  | {
      usePreviousValue: true;
    }
  | {
      value: string;
    };

type LaunchArguments = Record<
  | "EnableRcon"
  | "FactorioImageTag"
  | "HostedZoneId"
  | "RecordName"
  | "KeyPairName"
  | "YourIp",
  LaunchArgument
>;

export class MChandlerCloudFormationServer implements ServerInterface {
  static defaultLaunchArguments: LaunchArguments = {
    EnableRcon: { usePreviousValue: true },
    FactorioImageTag: { usePreviousValue: true },
    HostedZoneId: { usePreviousValue: true },
    RecordName: { usePreviousValue: true },
    KeyPairName: { usePreviousValue: true },
    YourIp: { usePreviousValue: true },
  };

  private launchArguments: LaunchArguments;

  constructor(
    private cf: CloudFormationClient,
    private stackName: string,
    launchArguments: Partial<LaunchArguments> = MChandlerCloudFormationServer.defaultLaunchArguments
  ) {
    this.launchArguments = {
      ...MChandlerCloudFormationServer.defaultLaunchArguments,
      ...launchArguments,
    };
  }

  private _calculateParameters(): Array<Parameter> {
    return Object.entries(this.launchArguments).map(([key, argument]) => {
      if ("usePreviousValue" in argument) {
        return {
          ParameterKey: key,
          UsePreviousValue: true,
        };
      }

      if ("value" in argument) {
        return {
          ParameterKey: key,
          UsePreviousValue: false,
          ParameterValue: argument.value,
        };
      }

      throw new Error("Invalid argument");
    });
  }

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
        ...this._calculateParameters(),
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
        ...this._calculateParameters(),
      ],
      Capabilities: ["CAPABILITY_IAM"],
    });

    await this.cf.send(updateCommand);
  }
}
