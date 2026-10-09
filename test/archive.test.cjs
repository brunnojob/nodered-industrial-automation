const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { Archive } = require("../lib/archive.cjs");
const { createPipeline } = require("../lib/telemetry.cjs");

test("failed delivery survives restart and confirmed delivery removes it", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "archive-"));
  try {
    const archive = new Archive(
      directory,
      "https://example.com",
      "token",
      async () => ({ ok: false }),
    );
    archive.enqueue({ sequence: 1, value: 10 });
    await archive.drain();
    const recovered = new Archive(
      directory,
      "https://example.com",
      "token",
      async () => ({ ok: true, json: async () => ({ persisted: true }) }),
    );
    assert.equal(recovered.pending().length, 1);
    assert.equal((await recovered.drain()).pending, 0);
  } finally {
    fs.rmSync(directory, { recursive: true });
  }
});
test("alarms require valid quality and emit transitions once", () => {
  const pipeline = createPipeline();
  const process = (raw, sequence) =>
    pipeline.process(
      { payload: { source: "pump", tag: "pressure", raw, sequence } },
      1000,
    )[1];
  assert.equal(process(5000, 1), null);
  assert.equal(process(3800, 2).payload.state, "raised");
  assert.equal(process(3800, 3), null);
  assert.equal(process(1000, 4).payload.state, "cleared");
});
