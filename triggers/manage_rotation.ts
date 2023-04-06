import { Trigger } from "deno-slack-sdk/types.ts";
import ManageRotationWorkflow from "../workflows/manage_rotation.ts";
/**
 * This is the definition for a shortcut trigger that will
 * be executed from within a channel.
 *
 * Triggers determine when workflows are executed. A trigger
 * file describes a scenario in which a workflow should be run,
 * such as a user pressing a button or when a specific event occurs.
 *
 * For more on triggers:
 * https://api.slack.com/future/triggers
 */
const manageRotationWorkflow: Trigger<
  typeof ManageRotationWorkflow.definition
> = {
  type: "shortcut",
  name: "Manage rotation",
  description: "Set up a rotation for the channel this trigger is invoked in",
  workflow: "#/workflows/manage_rotation",
  /**
   * Slack will kick off the workflow associated with this trigger and supply these
   * initial input values.
   */
  inputs: {
    channel: {
      value: "{{data.channel_id}}",
    },
    user: {
      value: "{{data.user_id}}",
    },
    interactivity: {
      value: "{{data.interactivity}}",
    },
  },
};

export default manageRotationWorkflow;
