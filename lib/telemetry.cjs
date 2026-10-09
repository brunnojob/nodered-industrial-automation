const DEFAULT_TAGS = Object.freeze({
  pressure: {
    rawMin: 0,
    rawMax: 4095,
    euMin: 0,
    euMax: 250,
    unit: "bar",
    high: 220,
  },
  tank_level: {
    rawMin: 0,
    rawMax: 4095,
    euMin: 0,
    euMax: 100,
    unit: "percent",
    high: 95,
  },
  vibration: {
    rawMin: 0,
    rawMax: 4095,
    euMin: 0,
    euMax: 25,
    unit: "mm_s",
    high: 18,
  },
});

function createPipeline(tags = DEFAULT_TAGS) {
  for (const spec of Object.values(tags)) {
    if (!spec || ![spec.rawMin,spec.rawMax,spec.euMin,spec.euMax,spec.high,spec.reset ?? spec.high * 0.9].every(Number.isFinite) ||
        spec.rawMin >= spec.rawMax || spec.euMin >= spec.euMax ||
        (spec.reset ?? spec.high * 0.9) >= spec.high || typeof spec.unit !== "string" || !spec.unit)
      throw new Error("invalid_calibration");
  }
  const sequences = new Map();
  const alarms = new Map();
  return {
    process(message, now = Date.now()) {
      const body = message && message.payload;
      if (
        !body ||
        typeof body !== "object" ||
        typeof body.source !== "string" ||
        !/^[A-Za-z0-9_-]{1,64}$/.test(body.source) ||
        typeof body.tag !== "string" ||
        !Number.isFinite(body.raw) ||
        !Number.isSafeInteger(body.sequence) ||
        body.sequence < 0
      )
        throw new Error("invalid_telemetry");
      const spec = tags[body.tag];
      if (!spec) throw new Error("unknown_tag");
      if (!Number.isFinite(now)) throw new Error("invalid_clock");
      for (const [id, state] of sequences)
        if (now - state.seen > 3600000) {
          sequences.delete(id);
          alarms.delete(id);
        }
      const key = body.source + ":" + body.tag;
      if (body.sequence <= (sequences.get(key)?.sequence ?? -1))
        throw new Error("replayed_sequence");
      const timestamp = Number.isFinite(body.timestamp) ? body.timestamp : now;
      if (body.timestamp !== undefined && !Number.isFinite(body.timestamp))
        throw new Error("invalid_timestamp");
      if (timestamp > now + 5000 || now - timestamp > 60000)
        throw new Error("stale_telemetry");
      if (!sequences.has(key) && sequences.size >= 10000)
        throw new Error("source_capacity");
      sequences.set(key, { sequence: body.sequence, seen: now });
      const value =
        spec.euMin +
        ((body.raw - spec.rawMin) / (spec.rawMax - spec.rawMin)) *
          (spec.euMax - spec.euMin);
      const normalized = {
        source: body.source,
        tag: body.tag,
        sequence: body.sequence,
        timestamp,
        raw: body.raw,
        value,
        unit: spec.unit,
        quality:
          body.raw < spec.rawMin || body.raw > spec.rawMax ? "bad" : "good",
      };
      const telemetry = { ...message, payload: normalized };
      let alarm = null;
      const active = alarms.get(key) ?? false;
      if (normalized.quality === "good" && !active && value >= spec.high) {
        alarms.set(key, true);
        alarm = {
          topic: "alarm/" + body.tag,
          payload: { severity: "high", state: "raised", ...normalized },
        };
      } else if (
        normalized.quality === "good" &&
        active &&
        value <= (spec.reset ?? spec.high * 0.9)
      ) {
        alarms.set(key, false);
        alarm = {
          topic: "alarm/" + body.tag,
          payload: { severity: "normal", state: "cleared", ...normalized },
        };
      }
      return [telemetry, alarm];
    },
  };
}

module.exports = { createPipeline };
