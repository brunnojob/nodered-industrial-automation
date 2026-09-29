const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const { createPipeline } = require("../lib/telemetry.cjs")

test("normalizes engineering units and creates high alarms", () => {
    const pipeline = createPipeline()
    const [signal, alarm] = pipeline.process({ payload: { source: "pt-1", tag: "pressure", sequence: 1, timestamp: 1000, raw: 3800 } }, 1000)
    assert.equal(signal.payload.unit, "bar")
    assert.ok(signal.payload.value > 220)
    assert.equal(alarm.payload.severity, "high")
})

test("rejects stale, replayed and unknown signals", () => {
    const pipeline = createPipeline()
    const message = { payload: { source: "pt-1", tag: "pressure", sequence: 1, timestamp: 1000, raw: 1200 } }
    pipeline.process(message, 1000)
    assert.throws(() => pipeline.process(message, 1000), /replayed_sequence/)
    assert.throws(() => pipeline.process({ payload: { ...message.payload, sequence: 2, timestamp: 1 } }, 1000), /stale_telemetry/)
    assert.throws(() => pipeline.process({ payload: { ...message.payload, tag: "unknown", sequence: 2 } }, 1000), /unknown_tag/)
})

test("flow is importable and routes telemetry and alarms", () => {
    const flow = JSON.parse(fs.readFileSync("flows/offshore-telemetry.json", "utf8"))
    const nodes = new Map(flow.map(node => [node.id, node]))
    assert.equal(nodes.get("mqtt-input").wires[0][0], "normalize")
    assert.equal(nodes.get("normalize").wires[0][0], "normalized-debug")
    assert.equal(nodes.get("normalize").wires[1][0], "alarm-output")
})
