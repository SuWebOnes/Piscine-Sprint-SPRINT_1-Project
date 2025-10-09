import { getUserIds } from "./common.mjs";

test("User count is correct", () => {
  expect(getUserIds().length).toBe(5);
});
