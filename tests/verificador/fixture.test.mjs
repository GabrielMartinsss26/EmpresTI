import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const contrato = JSON.parse(
  readFileSync(new URL("./contrato.json", import.meta.url), "utf8"),
);

test("CA-V01: limite de cinco", () => {
  assert.equal(contrato.limite, 5);
});
