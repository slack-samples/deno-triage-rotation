import { DefineFunction, Schema } from "deno-slack-sdk/mod.ts";

import RotationDatastore from "../../datastores/rotations.ts";

export const ADVANCE_ROTATION_FUNCTION_CALLBACK_ID = "advance_rotation_fn";

/**
 * This is a definition for a custom function which accepts a
 * rotation and updates the RotationsDatabase with a new order

 * More on defining functions here:
 * https://api.slack.com/future/functions/custom
 */
export const AdvanceRotationFunctionDefinition = DefineFunction({
  callback_id: ADVANCE_ROTATION_FUNCTION_CALLBACK_ID,
  title:
    "Advance the order of the rotation to the next rotation assignee and saves to datastore",
  description: "Advance to the next user in the rotation",
  source_file: "functions/advance_rotation/handler.ts",
  input_parameters: {
    properties: {
      rotation: {
        // TODO: extract this into a custom type and register at the manifest level for easy re-use
        // across inputs and outputs (and other functions/workflows, where relevant)
        type: Schema.types.object,
        // This function accepts input properties equivalent to a RotationDatastore item
        // TODO: would be a nice SDK feature to auto-generated a custom type via DefineType from datastore-exported attributes
        properties: RotationDatastore.export().attributes,
        required: ["rotation_trigger_id", "channel", "order"],
      },
    },
    required: ["rotation"],
  },
  output_parameters: {
    properties: {
      rotation: {
        type: Schema.types.object,
        properties: RotationDatastore.export().attributes,
        required: ["rotation_trigger_id", "channel", "order"],
      },
    },
    required: ["rotation"],
  },
});
