import {
  BlockActionHandler,
  ViewClosedHandler,
  ViewSubmissionHandler,
} from "deno-slack-sdk/functions/interactivity/types.ts";

import RotationDatastore from "../../datastores/rotations.ts";
import { OpenFormFunctionDefinition as OpenFormFunction } from "./definition.ts";
import { buildRotationForm } from "./blocks.ts";

export const processForm: ViewSubmissionHandler<
  typeof OpenFormFunction.definition
> = async ({ view, client, body }): Promise<void> => {
  const { values } = view.state;

  // get the start time
  const selectedStartTime =
    values["start_datepicker-input"]["start_datepicker-datepicker"][
      "selected_date_time"
    ];

  // get the users inputted user order
  const selectedUsers =
    values["rotation_input"]["select_action"]["selected_users"];

  // populate the form value outputs
  const rotationFormValues = {
    order: selectedUsers,
    channel: body.function_data.inputs.channel,
    message: values["custom_message-input"]["custom_message-plain-text-input"][
      "value"
    ] ?? "",
    start_time: selectedStartTime,
    repeats_every:
      values["repeats_every-section"]["repeats_every-radio-buttons"][
        "selected_option"
      ]["value"],
    repeats_every_number:
      values["repeats_every-input"]["repeats_every-number-input"]["value"],
  };

  // Complete the function and pass rotation form details
  // to the next function in the workflow
  const resp = await client.functions.completeSuccess({
    function_execution_id: body.function_data.execution_id,
    outputs: {
      ...rotationFormValues,
    },
  });

  if (!resp.ok) {
    console.log("There was an error completing the function", resp);
  }
};

export const deleteRotation: BlockActionHandler<
  typeof OpenFormFunction.definition
> = async ({ client, body }): Promise<void> => {
  // need to have the channel it's associated with
  const { channel, rotation, interactivity } = body.function_data.inputs;

  // missing a rotation, so something's wrong
  if (!rotation) {
    console.log(
      `There's no rotation associated with this channel to delete. Channel ID: ${channel}`,
    );
    return;
  }

  // delete the trigger associated with the rotation
  const triggerDeleteResp = await client.workflows.triggers.delete({
    trigger_id: rotation.rotation_trigger_id,
  });

  if (!triggerDeleteResp.ok) {
    console.log(
      `Rotation trigger failed to delete. Trigger ID: ${rotation.rotation_trigger_id}.` +
        `Error detail: ${triggerDeleteResp.error}, ${triggerDeleteResp.response_metadata}`,
    );
    // return;
  }

  // delete the rotation itself
  const deleteResp = await client.apps.datastore.delete<
    typeof RotationDatastore.definition
  >({
    datastore: RotationDatastore.name,
    id: channel,
  });

  if (!deleteResp.ok) {
    console.log(
      `Rotation failed to delete. Rotation ID: ${rotation}.` +
        `Error detail: ${deleteResp.error}, ${deleteResp.response_metadata}`,
    );
    return;
  }
  // update the view
  const viewUpdateRes = await client.views.update({
    view_id: body.view.id,
    view: buildRotationForm(body.function_data.inputs.channel),
  });

  if (!viewUpdateRes.ok) {
    console.log(
      `View failed to update. Pointer: ${interactivity.interactivity_pointer}`,
    );
  }
};

export const endFunctionWithError: ViewClosedHandler<
  typeof OpenFormFunction.definition
> = ({ client, body }) => {
  const function_execution_id = body.function_data.execution_id;
  const function_id = body.function_data.function;
  const interactor = body.function_data.inputs.interactivity.interactor.id;

  /**
   * It's good practice to complete our function, even in cases where the user has "ended"
   * the workflow on their own. If a user closes our form modal without submitting,
   * we don't want any next steps that follow this function to execute, so we complete the
   * function with an error and a helpful message for logging.
   *
   * For more on logging activity:
   * https://api.slack.com/future/logging
   */
  return client.functions.completeError({
    function_execution_id,
    function_id,
    error:
      `Rotation form was closed by the interactor with no rotation changes.\nDetails:\nFunction callback id: ${OpenFormFunction.id}\nFunction id: ${function_execution_id}\nInteractor id: ${interactor}`,
  });
};
