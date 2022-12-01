import { SlackFunction } from "deno-slack-sdk/mod.ts";

import { GetRotationFunctionDefinition } from "./definition.ts";

import RotationDatastore from "../../datastores/rotations.ts";

/**
 * This is the handling code for the GetRotationFunction. It will:
 * 1. Check whether a rotation exists
 * 2. Get the rotation and return OR return an output
 */
export default SlackFunction(
  GetRotationFunctionDefinition,
  async ({ inputs, client }) => {
    console.log("MANUAL LOG: GetRotation");

    // Step 1: check rotation datastore for existing records associated with channel id
    // For more info on how to format datastore queries:
    // https://api.slack.com/future/datastores#query_multiple
    const queryResp = await client.apps.datastore.query<
      typeof RotationDatastore.definition
    >({
      datastore: RotationDatastore.name,
      expression: "begins_with (#channel, :channel_id)",
      expression_attributes: { "#channel": "channel" },
      expression_values: { ":channel_id": inputs.channel },
    });

    if (!queryResp.ok) {
      return {
        error: queryResp.error ?? "There was an error querying the datastore",
      };
    }

    // there is an existing record
    if (queryResp.items.length !== 0) {
      const getResponse = await client.apps.datastore.get<
        typeof RotationDatastore.definition
      >(
        {
          datastore: RotationDatastore.name,
          id: inputs.channel,
        },
      );

      if (!getResponse.ok) {
        return {
          error: getResponse.error ??
            `Failed to fetch rotation for <@${inputs.channel}>`,
        };
      }

      // Step 2: return an output with the rotation record
      return {
        outputs: {
          interactivity: inputs.interactivity,
          rotation: getResponse.item,
          user: getResponse.item.order[0],
        },
      };
    }

    // otherwise return an output with no item
    return {
      outputs: {
        interactivity: inputs.interactivity,
      },
    };
  },
);
