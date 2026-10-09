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

## Optional report archive

Export a JSON report from the command above, then run `python cloud/sync.py enqueue result.json --project nodered-industrial-automation` and `python cloud/sync.py sync`. Synchronization requires `BRUNNODEV_ACCESS_TOKEN` and the external operations API; the local outbox retains unacknowledged reports.

## License

Original source and documentation are MIT licensed; see [LICENSE](LICENSE). Third-party dependencies and media retain their respective terms. Maintained by [Brunno Dev](https://brunnodev.store).
