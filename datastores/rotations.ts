import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";
import { DatastoreItem } from "deno-slack-api/typed-method-types/apps.ts";

/**
 * Datastores are a Slack-hosted location to store
 * and retrieve data for your app.
 * https://api.slack.com/future/datastores
 */
const RotationDatastore = DefineDatastore({
  name: "rotations",
  primary_key: "channel",
  attributes: {
    rotation_trigger_id: {
      type: Schema.types.string,
    },
    channel: {
      type: Schema.slack.types.channel_id,
    },
    order: {
      type: Schema.types.array,
      items: {
        type: Schema.slack.types.user_id,
      },
    },
    message: {
      type: Schema.types.string,
    },
    start_time: {
      type: Schema.types.number,
    },
    repeats_every: {
      type: Schema.types.string,
    },
    repeats_every_number: {
      type: Schema.types.number,
    },
    last_advance_time: {
      type: Schema.types.number,
    },
    next_advance_time: {
      type: Schema.types.number,
    },
  },
});

// Utility type of a rotation item
export type Rotation = Partial<
  DatastoreItem<typeof RotationDatastore.definition>
>;

export default RotationDatastore;
