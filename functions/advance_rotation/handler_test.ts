import { SlackFunctionTester } from "deno-slack-sdk/mod.ts";
import { assertEquals } from "https://deno.land/std@0.153.0/testing/asserts.ts";
import AdvanceRotationFunction from "./handler.ts";
import { ADVANCE_ROTATION_FUNCTION_CALLBACK_ID } from "./definition.ts";
import * as mf from "https://deno.land/x/mock_fetch@0.3.0/mod.ts";

const { createContext } = SlackFunctionTester(
  ADVANCE_ROTATION_FUNCTION_CALLBACK_ID,
);

// Replaces globalThis.fetch with the mocked copy
mf.install();

mf.mock("POST@/api/apps.datastore.put", () => {
  return new Response(
    `{"ok": true, "item": {"repeats_every": "day"}}`,
    {
      status: 200,
    },
  );
});

Deno.test("Sample function test", async () => {
  const inputs = {
    rotation: {
      order: ["testuser1"],
      channel: "channelid",
      message: "testmessage",
      start_time: 1,
      repeats_every: "day",
      repeats_every_number: 1,
      last_advance_time: 2,
      next_advance_time: 3,
    },
  };

  const { outputs } = await AdvanceRotationFunction(createContext({ inputs }));
  await assertEquals(
    outputs?.rotation.repeats_every,
    "day",
  );
});
