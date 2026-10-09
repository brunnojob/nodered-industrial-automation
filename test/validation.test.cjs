const test = require("node:test");
const assert = require("node:assert/strict");
const { createPipeline } = require("../lib/telemetry.cjs");

test("invalid calibration and explicit invalid timestamps are rejected", () => {
  assert.throws(() => createPipeline({ p: { rawMin: 0, rawMax: Infinity, euMin: 0, euMax: 10, high: 8, unit: "bar" } }));
  const pipeline = createPipeline();
  const payload = { source: "sensor", tag: "pressure", raw: 1, sequence: 0, timestamp: NaN };
  assert.throws(() => pipeline.process({ payload }, 100), /invalid_timestamp/);
  assert.equal(pipeline.process({ payload: { ...payload, timestamp: 100 } }, 100)[0].payload.sequence, 0);
});
