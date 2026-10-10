const assert = require('node:assert/strict');
const { createPipeline } = require('../lib/telemetry.cjs');
const pipeline = createPipeline();
const message = { payload: { source: 'PT101', tag: 'pressure', sequence: 1, timestamp: 1000, raw: 3800 } };
const [signal, alarm] = pipeline.process(message, 1000);
assert.equal(signal.payload.unit, 'bar');
assert.equal(alarm.payload.severity, 'high');
assert.throws(() => pipeline.process(message, 1000), /replayed_sequence/);
console.log(JSON.stringify({normalized: signal.payload, alarm: alarm.payload, replayRejected: true}));
