import { DefineFunction, DefineProperty, Schema } from "deno-slack-sdk/mod.ts";
import UserArray from "../../types/user_array.ts";

const FORMAT_ROTATION_FUNCTION_CALLBACK_ID = "format_rotation";

/**
 * This is a definition for a custom function which returns
 * the current assignee in the rotation, and a formatted string
 * with the remaining assignees in the rotation.
 *
 * If there's an existing rotation
 * supplied to the function as inputs, the form will be output
 * with existing values supplied.
 *
 * More on defining functions here:
 * https://api.slack.com/automation/functions/custom
 */
export const FormatRotationFunctionDefinition = DefineFunction({
  callback_id: FORMAT_ROTATION_FUNCTION_CALLBACK_ID,
  title: "Formats assignees in the rotation",
  description:
    "Accepts a rotation and returns the current assigned user and next users",
  source_file: "functions/format_rotation/handler.ts",
  input_parameters: {
    properties: {
      rotation: DefineProperty({
        type: Schema.types.object,
        properties: {
          rotation_trigger_id: {
            type: Schema.types.string,
            description:
              "The unique id of trigger associated with this saved rotation",
          },
          channel: {
            type: Schema.slack.types.channel_id,
            description: "The channel that the rotation belongs to",
          },
          order: {
            type: UserArray,
            description: "The unformatted list of user ids in order",
          },
        },
        required: ["rotation_trigger_id", "channel", "order"],
      }),
    },
    required: ["rotation"],
  },
  output_parameters: {
    properties: {
      current_user: {
        type: Schema.slack.types.user_id,
        description: "The user who is currently assigned",
      },
      next_users: {
        type: Schema.types.string,
        description:
          "A formatting string with <@{users}> who are next in the rotation order",
      },
    },
    required: ["current_user", "next_users"],
  },
});
