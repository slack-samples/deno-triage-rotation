import { SlackFunction } from "deno-slack-sdk/mod.ts";
import { DatastoreItem } from "deno-slack-api/types.ts";

import { AdvanceRotationFunctionDefinition } from "./definition.ts";

import RotationDatastore from "../../datastores/rotations.ts";
import { getNextAdvanceTimeInSec } from "../create_rotation/handler.ts";

export default SlackFunction(
  AdvanceRotationFunctionDefinition,
  async ({ inputs, client }) => {
    // TODO: the `rotation` input is typed as any - what can we do to improve this?
    const { order: assigneeOrder } = inputs.rotation;
    const {
      rotation_trigger_id,
      channel,
      message,
      start_time,
      repeats_every,
      repeats_every_number,
      last_advance_time,
      next_advance_time,
    } = inputs.rotation;

    // 1: rotate the order, first becomes "on rotation"
    const first = assigneeOrder.shift();
    const assignees = [...assigneeOrder, first];

    // 2: generate a new rotation object
    const newRotation: DatastoreItem<typeof RotationDatastore.definition> = {
      rotation_trigger_id,
      channel,
      message,
      start_time,
      repeats_every,
      repeats_every_number,
      order: assignees,
      last_advance_time: next_advance_time,
      next_advance_time: getNextAdvanceTimeInSec(
        last_advance_time,
        repeats_every_number,
        repeats_every,
      ),
    };

    // 3: update or create the rotation in the datastore
    const putResponse = await client.apps.datastore.put<
      typeof RotationDatastore.definition
    >({
      datastore: RotationDatastore.name,
      item: newRotation,
    });

    if (!putResponse.ok) {
      return { error: putResponse.error ?? "Failed to save rotation" };
    }

    return {
      outputs: {
        rotation: putResponse.item,
      },
    };
  },
);
