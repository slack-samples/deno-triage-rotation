import { Manifest } from "deno-slack-sdk/mod.ts";
import AdvanceRotationWorkflow from "./workflows/advance_rotation.ts";
import ManageRotationWorkflow from "./workflows/manage_rotation.ts";
import RotationDatastore from "./datastores/rotations.ts";
import UserArray from "./types/user_array.ts";

/**
 * The app manifest contains the app's configuration. This
 * file defines attributes like app name and description.
 * https://api.slack.com/automation/manifest
 */
export default Manifest({
  name: "Rotation App",
  description:
    "Create and manage an ordered work rotation and list of assignees",
  icon: "assets/icon.png",
  workflows: [ManageRotationWorkflow, AdvanceRotationWorkflow],
  outgoingDomains: ["cdn.skypack.dev"],
  types: [UserArray],
  datastores: [RotationDatastore],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
    "channels:manage",
    "groups:write",
    "triggers:write",
  ],
});
