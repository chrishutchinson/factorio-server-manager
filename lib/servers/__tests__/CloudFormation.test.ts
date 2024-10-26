import "aws-sdk-client-mock-jest";
import {
  CloudFormationClient,
  DescribeStacksCommand,
  UpdateStackCommand,
} from "@aws-sdk/client-cloudformation";
import { mockClient } from "aws-sdk-client-mock";

import { CloudFormationServer } from "../CloudFormation";
import { ServerState } from "../../ServerInterface";

const cloudformationMock = mockClient(CloudFormationClient);

describe("CloudFormation Server", () => {
  beforeEach(() => {
    cloudformationMock.reset();
  });

  describe("#getstate()", () => {
    it("should return an UNKNOWN state if stacks are undefined", async () => {
      cloudformationMock.on(DescribeStacksCommand).resolves({
        Stacks: undefined,
      });

      const server = new CloudFormationServer(
        new CloudFormationClient(),
        "test-stack"
      );

      const state = await server.getState();

      expect(state).toBe(ServerState.Unknown);
    });

    it("should return an UNKNOWN state if the stack is not found", async () => {
      cloudformationMock.on(DescribeStacksCommand).resolves({
        Stacks: [],
      });

      const server = new CloudFormationServer(
        new CloudFormationClient(),
        "test-stack"
      );

      const state = await server.getState();

      expect(state).toBe(ServerState.Unknown);
    });

    it("should return an STARTING state if the stack is set as 'Running' but is still updating", async () => {
      cloudformationMock.on(DescribeStacksCommand).resolves({
        Stacks: [
          {
            Parameters: [
              {
                ParameterKey: "ServerState",
                ParameterValue: "Running",
              },
            ],
            StackStatus: "UPDATE_IN_PROGRESS",
            StackName: "test-stack",
            CreationTime: new Date(),
          },
        ],
      });

      const server = new CloudFormationServer(
        new CloudFormationClient(),
        "test-stack"
      );

      const state = await server.getState();

      expect(state).toBe(ServerState.Starting);
    });

    it("should return an RUNNING state if the stack is set as 'Running' and is not updating", async () => {
      cloudformationMock.on(DescribeStacksCommand).resolves({
        Stacks: [
          {
            Parameters: [
              {
                ParameterKey: "ServerState",
                ParameterValue: "Running",
              },
            ],
            StackStatus: "UPDATE_COMPLETE",
            StackName: "test-stack",
            CreationTime: new Date(),
          },
        ],
      });

      const server = new CloudFormationServer(
        new CloudFormationClient(),
        "test-stack"
      );

      const state = await server.getState();

      expect(state).toBe(ServerState.Running);
    });

    it("should return an STOPPING state if the stack is set as 'Stopped' and is still updating", async () => {
      cloudformationMock.on(DescribeStacksCommand).resolves({
        Stacks: [
          {
            Parameters: [
              {
                ParameterKey: "ServerState",
                ParameterValue: "Stopped",
              },
            ],
            StackStatus: "UPDATE_IN_PROGRESS",
            StackName: "test-stack",
            CreationTime: new Date(),
          },
        ],
      });

      const server = new CloudFormationServer(
        new CloudFormationClient(),
        "test-stack"
      );

      const state = await server.getState();

      expect(state).toBe(ServerState.Stopping);
    });

    it("should return an STOPPED state if the stack is set as 'Stopped' and is not updating", async () => {
      cloudformationMock.on(DescribeStacksCommand).resolves({
        Stacks: [
          {
            Parameters: [
              {
                ParameterKey: "ServerState",
                ParameterValue: "Stopped",
              },
            ],
            StackStatus: "UPDATE_COMPLETE",
            StackName: "test-stack",
            CreationTime: new Date(),
          },
        ],
      });

      const server = new CloudFormationServer(
        new CloudFormationClient(),
        "test-stack"
      );

      const state = await server.getState();

      expect(state).toBe(ServerState.Stopped);
    });

    it("should return an UNKNOWN state if the stack is set as any other status", async () => {
      cloudformationMock.on(DescribeStacksCommand).resolves({
        Stacks: [
          {
            Parameters: [
              {
                ParameterKey: "ServerState",
                ParameterValue: "MysteryStatus",
              },
            ],
            StackStatus: "UPDATE_COMPLETE",
            StackName: "test-stack",
            CreationTime: new Date(),
          },
        ],
      });

      const server = new CloudFormationServer(
        new CloudFormationClient(),
        "test-stack"
      );

      const state = await server.getState();

      expect(state).toBe(ServerState.Unknown);
    });
  });

  describe("#start()", () => {
    it("should issue an UpdateStackCommand passing the correct stack name, reusing the existing template, and with the correct capabilities", async () => {
      const server = new CloudFormationServer(
        new CloudFormationClient(),
        "test-stack"
      );

      await server.start();

      expect(cloudformationMock).toHaveReceivedCommandWith(UpdateStackCommand, {
        StackName: "test-stack",
        UsePreviousTemplate: true,
        Capabilities: ["CAPABILITY_IAM"],
        Parameters: expect.any(Array),
      });
    });

    it("should set the ServerState parameter to 'Running'", async () => {
      const server = new CloudFormationServer(
        new CloudFormationClient(),
        "test-stack"
      );

      await server.start();

      expect(cloudformationMock).toHaveReceivedCommandWith(UpdateStackCommand, {
        Parameters: expect.arrayContaining([
          {
            ParameterKey: "ServerState",
            UsePreviousValue: false,
            ParameterValue: "Running",
          },
        ]),
      });
    });

    it.each([
      "FactorioImageTag",
      "HostedZoneId",
      "RecordName",
      "KeyPairName",
      "YourIp",
      "EnableRcon",
    ])(
      "should use the previous value for the %s parameter",
      async (parameterKey) => {
        const server = new CloudFormationServer(
          new CloudFormationClient(),
          "test-stack"
        );

        await server.start();

        expect(cloudformationMock).toHaveReceivedCommandWith(
          UpdateStackCommand,
          {
            Parameters: expect.arrayContaining([
              {
                ParameterKey: parameterKey,
                UsePreviousValue: true,
              },
            ]),
          }
        );
      }
    );
  });

  describe("#stop()", () => {
    it("should issue an UpdateStackCommand passing the correct stack name, reusing the existing template, and with the correct capabilities", async () => {
      const server = new CloudFormationServer(
        new CloudFormationClient(),
        "test-stack"
      );

      await server.stop();

      expect(cloudformationMock).toHaveReceivedCommandWith(UpdateStackCommand, {
        StackName: "test-stack",
        UsePreviousTemplate: true,
        Capabilities: ["CAPABILITY_IAM"],
        Parameters: expect.any(Array),
      });
    });

    it("should set the ServerState parameter to 'Stopped'", async () => {
      const server = new CloudFormationServer(
        new CloudFormationClient(),
        "test-stack"
      );

      await server.stop();

      expect(cloudformationMock).toHaveReceivedCommandWith(UpdateStackCommand, {
        Parameters: expect.arrayContaining([
          {
            ParameterKey: "ServerState",
            UsePreviousValue: false,
            ParameterValue: "Stopped",
          },
        ]),
      });
    });

    it.each([
      "FactorioImageTag",
      "HostedZoneId",
      "RecordName",
      "KeyPairName",
      "YourIp",
      "EnableRcon",
    ])(
      "should use the previous value for the %s parameter",
      async (parameterKey) => {
        const server = new CloudFormationServer(
          new CloudFormationClient(),
          "test-stack"
        );

        await server.stop();

        expect(cloudformationMock).toHaveReceivedCommandWith(
          UpdateStackCommand,
          {
            Parameters: expect.arrayContaining([
              {
                ParameterKey: parameterKey,
                UsePreviousValue: true,
              },
            ]),
          }
        );
      }
    );
  });
});
