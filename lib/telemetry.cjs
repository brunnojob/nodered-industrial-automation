const DEFAULT_TAGS = Object.freeze({
    pressure: { rawMin: 0, rawMax: 4095, euMin: 0, euMax: 250, unit: "bar", high: 220 },
    tank_level: { rawMin: 0, rawMax: 4095, euMin: 0, euMax: 100, unit: "percent", high: 95 },
    vibration: { rawMin: 0, rawMax: 4095, euMin: 0, euMax: 25, unit: "mm_s", high: 18 }
})

function createPipeline(tags = DEFAULT_TAGS) {
    const sequences = new Map()
    return {
        process(message, now = Date.now()) {
            const body = message && message.payload
            if (!body || typeof body !== "object" || !body.source || !body.tag || !Number.isFinite(body.raw) || !Number.isInteger(body.sequence))
                throw new Error("invalid_telemetry")
            const spec = tags[body.tag]
            if (!spec)
                throw new Error("unknown_tag")
            const key = body.source + ":" + body.tag
            if (body.sequence <= (sequences.get(key) ?? -1))
                throw new Error("replayed_sequence")
            const timestamp = Number.isFinite(body.timestamp) ? body.timestamp : now
            if (timestamp > now + 5000 || now - timestamp > 60000)
                throw new Error("stale_telemetry")
            sequences.set(key, body.sequence)
            const value = spec.euMin + ((body.raw - spec.rawMin) / (spec.rawMax - spec.rawMin)) * (spec.euMax - spec.euMin)
            const normalized = {
                source: body.source,
                tag: body.tag,
                sequence: body.sequence,
                timestamp,
                raw: body.raw,
                value,
                unit: spec.unit,
                quality: body.raw < spec.rawMin || body.raw > spec.rawMax ? "bad" : "good"
            }
            const telemetry = { ...message, payload: normalized }
            const alarm = value >= spec.high
                ? { topic: "alarm/" + body.tag, payload: { severity: "high", ...normalized } }
                : null
            return [telemetry, alarm]
        }
    }
}

module.exports = { createPipeline }
