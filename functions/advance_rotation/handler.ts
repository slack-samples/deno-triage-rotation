import { SlackFunction } from "deno-slack-sdk/mod.ts";
import { AdvanceRotationFunctionDefinition } from "./definition.ts";

import RotationDatastore from "../../datastores/rotations.ts";
import { getNextAdvanceTimeInSec } from "../create_rotation/handler.ts";

export default SlackFunction(
  AdvanceRotationFunctionDefinition,
  async ({ inputs, client }) => {
    // TODO: the `rotation` input is typed as any - what can we do to improve this?
    const { order: assigneeOrder } = inputs.rotation;
    const {
      channel,
      repeats_every,
      repeats_every_number,
      last_advance_time,
      next_advance_time,
    } = inputs.rotation;

    // 1: rotate the order, first becomes "on rotation"
    const first = assigneeOrder.shift();
    const assignees = [...assigneeOrder, first];

    // 2: update the rotation in the datastore
    const putResponse = await client.apps.datastore.update<
      typeof RotationDatastore.definition
    >({
      datastore: RotationDatastore.name,
      item: {
        channel,
        order: assignees,
        last_advance_time: next_advance_time,
        next_advance_time: getNextAdvanceTimeInSec(
          last_advance_time,
          repeats_every_number,
          repeats_every,
        ),
      },
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
