import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { CreateRotationFunctionDefinition } from "../functions/create_rotation/definition.ts";
import { GetRotationFunctionDefinition } from "../functions/get_rotation/definition.ts";
import { OpenFormFunctionDefinition } from "../functions/open_form/definition.ts";

/**
 * A workflow is a set of steps that are executed in order.
 * Each step in a workflow is a function.
 * https://api.slack.com/future/workflows
 *
 * This workflow uses interactivity. Learn more at:
 * https://api.slack.com/future/forms#add-interactivity
 */
const ManageRotationWorkflow = DefineWorkflow({
  callback_id: "manage_rotation",
  title: "Manage Rotation",
  description: "Create, manage, or delete an existing rotation in a channel",
  /**
   * Workflow input parameters can include the channel context
   * where the workflow is being triggered, the user who triggered the channel,
   * and more.
   *
   * For more on adding input parameters:
   * https://api.slack.com/future/workflows#workflow-adding-input-parameters
   *
   * Where do the values for this workflow's input parameters come from? Check out
   * the trigger for this workflow /triggers/manage_rotation.ts
   */
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
        description:
          "A special input parameter that will allow this function to handle user interaction with our manage workflow form",
      },
      channel: {
        type: Schema.slack.types.channel_id,
        description:
          "The channel where the manage rotation workflow was was triggered",
      },
      user: {
        type: Schema.slack.types.user_id,
        description:
          "The user id of the person who triggered the manage rotation workflow",
      },
    },
    required: ["channel", "user", "interactivity"],
  },
});

// Step 1: Get any current rotation belonging to channel
const currentRotationStep = ManageRotationWorkflow.addStep(
  GetRotationFunctionDefinition,
  {
    channel: ManageRotationWorkflow.inputs.channel,
    interactivity: ManageRotationWorkflow.inputs.interactivity,
  },
);

/**
 * Step 2: Open a form to create a new rotation OR update an existing one
 *
 * This step uses a custom function with Block Kit to open a form modal with
 * interactive components: multi-select, radio buttons, input fields, buttons
 *
 * For more info on Block Kit interactivity: https://api.slack.com/block-kit/interactivity
 *
 * Don't need interactivity? Checkout the the built-in OpenForm function.
 * https://api.slack.com/future/functions#open-a-form
 */
const formStep = ManageRotationWorkflow.addStep(
  OpenFormFunctionDefinition,
  {
    rotation: currentRotationStep.outputs.rotation,
    channel: ManageRotationWorkflow.inputs.channel,
    interactivity: currentRotationStep.outputs.interactivity,
  },
);

// Step 3: Use the submitted values to set up and save the rotation and a scheduled trigger
// to trigger the rotation to advance
ManageRotationWorkflow.addStep(
  CreateRotationFunctionDefinition,
  {
    order: formStep.outputs.order,
    channel: ManageRotationWorkflow.inputs.channel,
    start_time: formStep.outputs.start_time,
    repeats_every: formStep.outputs.repeats_every,
    repeats_every_number: formStep.outputs.repeats_every_number,
    message: formStep.outputs.message,
  },
);

// Step 4: Sends a message to the channel that the rotation has been set
ManageRotationWorkflow.addStep(Schema.slack.functions.SendMessage, {
  channel_id: ManageRotationWorkflow.inputs.channel,
  message: `<@${ManageRotationWorkflow.inputs.user}> just set the rotation`,
});

export default ManageRotationWorkflow;
