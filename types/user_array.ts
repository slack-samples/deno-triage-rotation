import { DefineType, Schema } from "deno-slack-sdk/mod.ts";

/**
 * This custom type is used to define a array of slack user
 * ids. This array is used as the rotation order for our app.
 *
 * For more on defining custom types:
 * https://api.slack.com/automation/types/custom
 */
export default DefineType({
  name: "user_array",
  description: "Allows a list of users to be set",
  type: Schema.types.array,
  items: {
    type: Schema.slack.types.user_id,
  },
});
