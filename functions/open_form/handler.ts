import { SlackFunction } from "deno-slack-sdk/mod.ts";

import { OpenFormFunctionDefinition } from "./definition.ts";
import {
  deleteRotation,
  endFunctionWithError,
  processForm,
} from "./interaction_handler.ts";

import {
  buildRotationForm,
  DELETE_BUTTON_ACTION_ID,
  ROTATION_FORM_CALLBACK_ID,
} from "./blocks.ts";

/**
 * This is the handling code for the OpenFormFunction. It will:
 * 1. Open a form view and wait for user interaction
 * 2. Return completed: false, since this function is not complete until
 * either the form is submitted and the formProcess interaction handler completes
 * OR the view is closed.
 */
export default SlackFunction(
  OpenFormFunctionDefinition,
  async ({ inputs, client }) => {
    // 1: Open a form view and wait for user interaction
    const formResp = await client.views.open({
      view: buildRotationForm(inputs.channel, inputs.rotation),
      interactivity_pointer: inputs.interactivity.interactivity_pointer,
    });

    if (!formResp.ok) {
      return {
        error:
          `Error in executing client.views.open. Error detail ${formResp.error}`,
      };
    }

    /**
     * IMPORTANT! Set `completed` to false in order to pause function's complete state
     * since we will wait for user interaction in the button handlers below.
     * Steps after this step in the workflow will not execute until we complete our function
     * either successfully in processForm OR with an error in endFunctionWithError.
     */
    return { completed: false };
  },
).addViewSubmissionHandler(
  ROTATION_FORM_CALLBACK_ID,
  processForm,
).addBlockActionsHandler(
  DELETE_BUTTON_ACTION_ID,
  deleteRotation,
).addViewClosedHandler(
  ROTATION_FORM_CALLBACK_ID,
  endFunctionWithError,
);
