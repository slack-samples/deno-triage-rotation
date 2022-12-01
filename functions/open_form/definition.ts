import { DefineFunction, Schema } from "deno-slack-sdk/mod.ts";
import RotationDatastore from "../../datastores/rotations.ts";

import UserArray from "../../types/user_array.ts";

export const OPEN_FORM_FUNCTION_CALLBACK_ID = "open_form";

/**
 * This is a custom function manifest definition which opens
 * a configure rotation form.
 *
 * If there's an existing rotation supplied to the function as inputs,
 * the form will be opened with existing values supplied.
 *
 * More on defining functions here:
 * https://api.slack.com/future/functions/custom
 */
export const OpenFormFunctionDefinition = DefineFunction({
  callback_id: OPEN_FORM_FUNCTION_CALLBACK_ID,
  title: "Opens a rotation form",
  source_file: "functions/open_form/handler.ts",
  input_parameters: {
    properties: {
      rotation: {
        type: Schema.types.object,
        /**
         * This function accepts a rotation input parameter whose shape matches
         * The attributes of a RotationDatastore item
         */
        properties: RotationDatastore.export().attributes,
        required: ["rotation_trigger_id", "channel", "order"],
      },
      channel: {
        type: Schema.types.string,
        description: "The channel that the rotation belongs to",
      },
      interactivity: {
        type: Schema.slack.types.interactivity,
        description: "Special interactivity input",
      },
    },
    required: ["channel", "interactivity"],
  },
  output_parameters: {
    properties: {
      /**
       * This function outputs all the fields we have collected from
       * our user's input in the form.
       */
      order: {
        type: UserArray,
        description: "Order of rotation assignee user ids",
      },
      channel: {
        type: Schema.slack.types.channel_id,
        description: "The channel the rotation belongs to",
      },
      message: {
        type: Schema.types.string,
        description: "Message to be posted",
      },
      start_time: {
        description: "Start datetime represented as a UNIX timestamp in ms",
        type: Schema.types.number,
      },
      repeats_every: {
        description: "Daily or weekly",
        type: Schema.types.string,
      },
      repeats_every_number: {
        description: "Number of days or weeks until the rotation is updated",
        type: Schema.types.number,
      },
    },
    required: [
      "order",
      "channel",
      "start_time",
      "repeats_every",
      "repeats_every_number",
    ],
  },
});
