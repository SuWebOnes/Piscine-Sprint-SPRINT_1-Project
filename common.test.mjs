import { getUserIds } from "./common.mjs";
import assert from "node:assert";
import test from "node:test";

test("User count is correct", () => {
  expect(getUserIds().length).toBe(5);
});
