import { getUserIDs } from "./common.mjs";
import assert from "node:assert";
import test from "node:test";

test("User count is correct", () => {
  assert.equal(getUserIds().length, 5);
});

// Test name: "All user IDs are numbers"
test('All user IDs are numbers', () => {
  const users = getUserIds();
  users.forEach(id => assert.strictEqual(typeof id, 'number'));
});