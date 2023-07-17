import { SlackFunction } from "deno-slack-sdk/mod.ts";
import { DatastoreItem } from "deno-slack-api/types.ts";
import { ScheduledTrigger } from "deno-slack-api/typed-method-types/workflows/triggers/scheduled.ts";

import { CreateRotationFunctionDefinition } from "./definition.ts";

import RotationDatastore from "../../datastores/rotations.ts";
import AdvanceRotation from "../../workflows/advance_rotation.ts";

import { dateFromTimeInSec } from "../open_form/blocks.ts";

// Constants
export const WEEKDAY: string[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * This is the handling code for the CreateRotationFunction. It will:
 * 1. Fetch the existing rotation for this channel.
 * 2. Create a new scheduled trigger to trigger our AdvanceRotation function
 * 3. Update the existing rotation with 1) the updated rotation details 2) the new scheduled trigger id
 * 4. Cleanup / delete any existing triggers based on the function inputs rotation
 */
export default SlackFunction(
  CreateRotationFunctionDefinition,
  async ({ inputs, client, env }) => {
    // 0. Get the env
    const debugMode = env["DEBUG"] === "true";

    // 1. Get any existing rotation trigger for channel
    const channelGetResp = await client.apps.datastore.get<
      typeof RotationDatastore.definition
    >({
      datastore: RotationDatastore.name,
      id: inputs.channel,
    });

    if (!channelGetResp.ok) {
      return {
        error: channelGetResp.error ??
          "Failed to query for existing triggers",
      };
    }

    // 2. Generate a new scheduled trigger
    const newScheduledTrigger: ScheduledTrigger<
      typeof AdvanceRotation.definition
    > = {
      type: "scheduled",
      name: "Scheduled trigger for the rotation workflow",
      description: "A scheduled trigger for the rotation workflow",
      workflow: "#/workflows/advance_rotation",
      inputs: {
        channel: {
          value: inputs.channel,
        },
      },
      // @ts-expect-error type error due to frequency type of "once" not being compatible with other
      schedule: getTriggerSchedule(debugMode, inputs),
    };

    const newScheduledTriggerResp = await client.workflows.triggers.create<
      typeof AdvanceRotation.definition
    >(
      newScheduledTrigger,
    );

    if (!newScheduledTriggerResp.ok) {
      console.log(
        "There was an error scheduling the trigger",
        newScheduledTriggerResp.error,
        newScheduledTriggerResp.response_metadata,
      );
      return {
        error: newScheduledTriggerResp.error ??
          "Failed to create scheduled trigger",
      };
    }

    // 2. Create a new rotation item shape
    const newRotation: DatastoreItem<typeof RotationDatastore.definition> = {
      rotation_trigger_id: newScheduledTriggerResp.trigger.id,
      order: inputs.order,
      channel: inputs.channel,
      message: inputs.message,
      start_time: inputs.start_time,
      repeats_every: inputs.repeats_every,
      repeats_every_number: inputs.repeats_every_number,
      last_advance_time: inputs.start_time,
      next_advance_time: getNextAdvanceTimeInSec(
        inputs.start_time,
        inputs.repeats_every_number,
        inputs.repeats_every,
      ),
    };

    // write to the database
    const putResp = await client.apps.datastore.put<
      typeof RotationDatastore.definition
    >({
      datastore: RotationDatastore.name,
      item: newRotation,
    });

    if (!putResp.ok) {
      return { error: putResp.error ?? "Failed to update with rotation" };
    }

    // 3. Delete any past existing triggers that might have existed for rotation
    if (Object.keys(channelGetResp.item).length > 0) {
      const deleteTriggerResp = await client.workflows.triggers.delete({
        trigger_id: channelGetResp.item.rotation_trigger_id,
      });

      if (!deleteTriggerResp.ok) {
        return {
          error: deleteTriggerResp.error ??
            "Failed to delete past scheduled trigger",
        };
      }
    }

    return { outputs: {} };
  },
);

/**
 * This function takes a start time (in seconds) and returns a time
 * that reflects start time + delta in seconds. Delta is calculated using the
 * repeatsEveryNumber and repeatsEvery options saved alongside the rotation.
 *
 * @param startTimeInSec A number representing UNIX time in seconds
 * @param repeatsEveryNumber frequency of repetition, i.e. 1 day vs 3 days
 * @param repeatsEvery day or week
 * @returns
 */
export function getNextAdvanceTimeInSec(
  startTimeInSec: number,
  repeatsEveryNumber: number,
  repeatsEvery: string,
): number {
  // take the start time in ms
  const DAYS_PER_WEEK = 7;
  const SEC_PER_DAY = 86400;
  const SEC_PER_WEEK: number = SEC_PER_DAY * DAYS_PER_WEEK;

  // calculate the time delta in MS based on user supplied values
  const deltaInSec: number = (repeatsEvery === "week")
    ? (SEC_PER_WEEK * repeatsEveryNumber)
    : (SEC_PER_DAY * repeatsEveryNumber);

  // add time delta to current start time
  const nextAdvanceTimeInSec: number = startTimeInSec + deltaInSec;

  return nextAdvanceTimeInSec;
}

/**
 * This helper function returns a `schedule` object for a scheduled workflow
 * trigger. For more information on `schedule` object properties:
 *
 * https://api.slack.com/automation/triggers/scheduled#schedule
 */
// deno-lint-ignore no-explicit-any
export function getTriggerSchedule(debugMode: boolean, inputs: any) {
  const DELAY_SEC = 10;
  const { start_time } = inputs;
  /**
   * When debugMode === true the start_time of the scheduled trigger will be based on
   * the current time + a set delay from after the function is executed, ignoring any start
   * time supplied in the inputs to the function. This allows for testing the behavior of
   * the workflow attached to the scheduled trigger, as the trigger should
   * fire after an interval determined by the DELAY_SEC const.
   *
   * Set DEBUG to true in your local .env file to toggle this behavior in development
   * To set this value for production apps, use the `slack env var add`.
   *
   * More on using environment variables:
   * https://api.slack.com/automation/environment-variables
   */
  if (debugMode) {
    console.log("DEBUG MODE IS ON");
    const now = new Date();
    const delayInSeconds = now.getSeconds() + DELAY_SEC;
    const startTime = new Date(now.setSeconds(delayInSeconds));

    return {
      start_time: startTime.toISOString(),
    };
  } else {
    // return a schedule based on the schedule included in inputs
    const startTime: Date = dateFromTimeInSec(start_time);
    return {
      start_time: startTime.toISOString(),
      timezone: "UTC",
      frequency: getTriggerScheduleFrequency(inputs),
    };
  }
}

/**
 * This helper function returns a frequency object required to create a
 * a scheduled workflow trigger. For more information on the scheduled
 * trigger `frequency` object properties:
 * https://api.slack.com/automation/triggers/scheduled#frequency
 */
// deno-lint-ignore no-explicit-any
function getTriggerScheduleFrequency(inputs: any) {
  const { start_time, repeats_every, repeats_every_number } = inputs;
  const startDate = new Date(start_time * 1000);
  if (repeats_every === "day") {
    return {
      type: "daily",
      repeats_every: repeats_every_number,
    };
  } else {
    return {
      type: "weekly",
      repeats_every: repeats_every_number,
      on_days: [WEEKDAY[startDate.getDay()]],
    };
  }
}
