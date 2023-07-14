import { DefineFunction, Schema } from "deno-slack-sdk/mod.ts";
import RotationDatastore from "../../datastores/rotations.ts";

export const GET_ROTATION_FUNCTION_CALLBACK_ID = "get_rotation";

/**
 * This is a custom function manifest definition which
 * retrieves a rotation record details from a datastore. See the rotation
 * datastore definition: /datastores/rotations.ts
 *
 * More on defining functions here:
 * https://api.slack.com/automation/functions/custom
 */
export const GetRotationFunctionDefinition = DefineFunction({
  callback_id: GET_ROTATION_FUNCTION_CALLBACK_ID,
  title: "Get a rotation record from the datastore",
  description:
    "Returns the rotation record associated with a specific channel id if it exists",
  source_file: "functions/get_rotation/handler.ts",
  input_parameters: {
    properties: {
      channel: {
        type: Schema.slack.types.channel_id,
        description:
          "The channel id is the primary key for a rotation in the Rotation datastore",
      },
      interactivity: {
        type: Schema.slack.types.interactivity,
        description:
          "Passing along interactivity to the next step in this workflow",
      },
    },
    required: ["channel"],
  },
  output_parameters: {
    properties: {
      rotation: {
        type: Schema.types.object,
        properties: RotationDatastore.export().attributes,
        required: [],
        description:
          "The current rotation, with the next on-rotation user as the first in order",
      },
      user: {
        type: Schema.slack.types.user_id,
        description: "The user that is currently on rotation",
      },
      interactivity: {
        type: Schema.slack.types.interactivity,
        description:
          "Passing along interactivity to the next step in this workflow",
      },
    },
    required: [],
  },
});
