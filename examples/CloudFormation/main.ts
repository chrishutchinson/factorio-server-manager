import "dotenv/config";
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import RCON from "rcon-srcds";

import { FactorioServerManager } from "../../lib";
import { MChandlerCloudFormationServer } from "../../lib/servers/MChandlerCloudFormationServer";

const factorio = new FactorioServerManager(
  new MChandlerCloudFormationServer(
    new CloudFormationClient({
      region: process.env.AWS_REGION!,
    }),
    process.env.CF_STACK_NAME!
  ),
  {
    client: new RCON({
      host: process.env.RCON_HOSTNAME!,
      port: process.env.RCON_PORT ? parseInt(process.env.RCON_PORT) : 27015,
    }),
    password: process.env.RCON_PASSWORD!,
  }
);

/**
 * This script demonstrates how to use the FactorioServerManager class with the MChandlerCloudFormationServer class.
 *
 * First make sure you have followed the instructions in `./env.sample`, then you can run this example script with:
 *
 * ```sh
 * npm run examples:CloudFormation
 * ```
 *
 * Uncomment the lines below depending on which action you want to perform.
 */

const main = async () => {
  console.log("Getting server state...");
  console.log(await factorio.getState());

  // console.log("Starting server...");
  // await factorio.start();

  // console.log("Getting players...");
  // console.log(await factorio.getPlayers());

  // console.log("Stopping server...");
  // await factorio.stop();
};

main().then(() => {
  process.exit(0);
});
