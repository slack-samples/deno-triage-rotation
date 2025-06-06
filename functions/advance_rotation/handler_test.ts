import { SlackFunctionTester } from "deno-slack-sdk/mod.ts";
import { assertEquals } from "@std/assert";
import AdvanceRotationFunction from "./handler.ts";
import { ADVANCE_ROTATION_FUNCTION_CALLBACK_ID } from "./definition.ts";
import { stub } from "@std/testing/mock";

const { createContext } = SlackFunctionTester(
  ADVANCE_ROTATION_FUNCTION_CALLBACK_ID,
);

Deno.test("Sample function test", async () => {
  // Replaces globalThis.fetch with the mocked copy
  using _stubFetch = stub(
    globalThis,
    "fetch",
    (url: string | URL | Request, options?: RequestInit) => {
      const request = url instanceof Request ? url : new Request(url, options);

      assertEquals(request.method, "POST");
      assertEquals(request.url, "https://slack.com/api/apps.datastore.put");

      return Promise.resolve(
        new Response(
          `{"ok": true, "item": {"repeats_every": "day"}}`,
          {
            status: 200,
          },
        ),
      );
    },
  );

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
  assertEquals(
    outputs?.rotation.repeats_every,
    "day",
  );
});
