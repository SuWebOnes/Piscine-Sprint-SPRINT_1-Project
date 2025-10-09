import { getUserIds } from "./common.mjs";
import assert from "node:assert";
import test from "node:test";

test("User count is correct", () => {
  assert.equal(getUserIds().length, 5);
});

test('All user IDs are strings', () => {
  const users = getUserIds();
  users.forEach(id => assert.strictEqual(typeof id, 'string'));
});
