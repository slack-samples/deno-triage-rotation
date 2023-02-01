import { DefineFunction } from "deno-slack-sdk/mod.ts";
import { OpenFormFunctionDefinition } from "../open_form/definition.ts";

const CREATE_ROTATION_FUNCTION_CALLBACK_ID = "create_rotation";

/**
 * This is a custom function manifest definition which accepts
 * some inputs describing the form, validates, and saves to a database
 *
 * More on defining functions here:
 * https://api.slack.com/future/functions/custom
 */
export const CreateRotationFunctionDefinition = DefineFunction({
  callback_id: CREATE_ROTATION_FUNCTION_CALLBACK_ID,
  title: "Create rotation",
  description:
    "Accepts a rotation detail fields, saves it to the db, also creates a scheduled trigger based on rotation details.",
  source_file: "functions/create_rotation/handler.ts",
  input_parameters: {
    properties:
      // Let's reuse OpenFormFunction's output parameters as this functions inputs!
      OpenFormFunctionDefinition.export().output_parameters.properties,
    required: [
      "order",
      "channel",
      "start_time",
      "repeats_every",
      "repeats_every_number",
    ],
  },
});
