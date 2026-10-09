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

## Result synchronization

The [operations archive](https://vercel-home-telemetry-api.vercel.app/laboratory.html?project=nodered-industrial-automation) stores execution results. Supabase migrations are in the [API repository](https://github.com/brunnojob/vercel-home-telemetry-api/tree/main/supabase/migrations).

```sh
python cloud/sync.py enqueue result.json --project nodered-industrial-automation
python cloud/sync.py sync
```

Set `BRUNNODEV_ACCESS_TOKEN` to your session token. The SQLite outbox retains reports until the server confirms persistence; identical content does not create duplicate records. Tokens are not stored in source code. To run the synchronization tests:

```sh
python -m unittest discover -s cloud
```
