import { SlackFunction } from "deno-slack-sdk/mod.ts";
import { FormatRotationFunctionDefinition } from "./definition.ts";

export default SlackFunction(FormatRotationFunctionDefinition, ({ inputs }) => {
  const next_users = inputs.rotation.order.slice(1).map((a: string) =>
    `<@${a}>`
  ).join(
    ", ",
  );

  return {
    outputs: {
      current_user: inputs.rotation.order[0],
      next_users,
    },
  };
});
