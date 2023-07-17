import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { GetRotationFunctionDefinition } from "../functions/get_rotation/definition.ts";
import { AdvanceRotationFunctionDefinition } from "../functions/advance_rotation/definition.ts";
import { FormatRotationFunctionDefinition } from "../functions/format_rotation/definition.ts";

/**
 * A workflow is a set of steps that are executed in order.
 * Each step in a workflow is a function.
 * https://api.slack.com/automation/workflows
 *
 * This workflow uses interactivity. Learn more at:
 * https://api.slack.com/automation/forms#add-interactivity
 */
const AdvanceRotationWorkflow = DefineWorkflow({
  callback_id: "advance_rotation",
  title: "Advance Rotation",
  description: "Notifies the next rotation assignee, advances rotation order",
  input_parameters: {
    properties: {
      channel: {
        type: Schema.slack.types.channel_id,
      },
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
    },
    required: ["channel"],
  },
});

// Step 1: Fetch any existing rotation belonging to inputted channel
const rotationStep = AdvanceRotationWorkflow.addStep(
  GetRotationFunctionDefinition,
  {
    channel: AdvanceRotationWorkflow.inputs.channel,
    interactivity: AdvanceRotationWorkflow.inputs.interactivity,
  },
);

// Step 2: Format the rotation details
const formatStep = AdvanceRotationWorkflow.addStep(
  FormatRotationFunctionDefinition,
  {
    rotation: rotationStep.outputs.rotation,
  },
);

// Step 3: Update the channel topic
AdvanceRotationWorkflow.addStep(
  Schema.slack.functions.UpdateChannelTopic,
  {
    channel_id: AdvanceRotationWorkflow.inputs.channel,
    topic:
      `<@${formatStep.outputs.current_user}> is on call. \nNext in order: ${formatStep.outputs.next_users}`,
  },
);

// Step 4: Notify the current user assigned on the rotation
AdvanceRotationWorkflow.addStep(Schema.slack.functions.SendMessage, {
  channel_id: AdvanceRotationWorkflow.inputs.channel,
  message: `<@${formatStep.outputs.current_user}> is on call. \n${
    rotationStep.outputs.rotation!.message
  }`,
});

// Step 5: Advance the rotation
AdvanceRotationWorkflow.addStep(AdvanceRotationFunctionDefinition, {
  rotation: rotationStep.outputs.rotation,
});

export default AdvanceRotationWorkflow;
