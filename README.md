# Industrial Automation

An MQTT and Node-RED flow with engineering units, sequence tracking, quality checks, alarm hysteresis, and a persistent delivery queue.

## Run

Requirements: Node.js 24 and Node-RED.

```sh
npm ci
npm test
npm start
```

## Behavior

Configure the broker in `flows/offshore-telemetry.json`. `ARCHIVE_DIRECTORY` selects the local queue directory; `BRUNNODEV_ACCESS_TOKEN` authenticates synchronization. The flow persists data before sending and retains it until the server confirms persistence.

## Archive

The Node-RED flow uses `lib/archive.cjs` for its persistent delivery queue. Set `BRUNNODEV_ACCESS_TOKEN` before sending to the operations API.

## License

Original source and documentation are MIT licensed; see [LICENSE](LICENSE). Third-party dependencies and media retain their respective terms. Maintained by [Brunno Dev](https://brunnodev.store).
