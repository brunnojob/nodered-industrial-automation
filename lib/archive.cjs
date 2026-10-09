const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

class Archive {
  constructor(directory, endpoint, token, transport = fetch) {
    this.directory = directory;
    this.endpoint = endpoint;
    this.token = token;
    this.transport = transport;
    this.draining = false;
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  }
  enqueue(result) {
    const encoded = JSON.stringify(result);
    if (Buffer.byteLength(encoded) > 160000)
      throw new Error("record_too_large");
    const key = crypto.createHash("sha256").update(encoded).digest("hex");
    const target = path.join(this.directory, key + ".json");
    if (fs.existsSync(target)) return key;
    if (this.pending().length >= 10000) throw new Error("archive_capacity");
    const temporary = target + "." + crypto.randomUUID() + ".tmp";
    const descriptor = fs.openSync(temporary, "wx", 0o600);
    try {
      fs.writeFileSync(
        descriptor,
        JSON.stringify({
          project: "nodered-industrial-automation",
          kind: "telemetry",
          clientKey: key,
          result,
        }),
      );
      fs.fsyncSync(descriptor);
    } finally {
      fs.closeSync(descriptor);
    }
    fs.renameSync(temporary, target);
    const folder = fs.openSync(this.directory, "r");
    try {
      fs.fsyncSync(folder);
    } finally {
      fs.closeSync(folder);
    }
    return key;
  }
  pending() {
    return fs
      .readdirSync(this.directory)
      .filter((name) => /^[a-f0-9]{64}\.json$/.test(name))
      .sort();
  }
  async drain() {
    if (this.draining) return { pending: this.pending().length };
    const url = new URL(this.endpoint);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      !this.token
    )
      throw new Error("archive_configuration_required");
    this.draining = true;
    let sent = 0;
    try {
      for (const name of this.pending().slice(0, 100)) {
        const target = path.join(this.directory, name);
        const response = await this.transport(url, {
          method: "POST",
          headers: {
            Authorization: "Bearer " + this.token,
            "Content-Type": "application/json",
          },
          body: fs.readFileSync(target, "utf8"),
          signal: AbortSignal.timeout(10000),
          redirect: "error",
        });
        if (!response.ok || !(await response.json()).persisted) break;
        fs.unlinkSync(target);
        sent++;
      }
      return { sent, pending: this.pending().length };
    } finally {
      this.draining = false;
    }
  }
}
module.exports = { Archive };
