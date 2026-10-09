# Industrial Automation

Fluxo MQTT e Node-RED com unidades de engenharia, controle de sequência, qualidade, histerese de alarme e fila persistente de envio.

## Executar

Requisitos: Node.js 24 e Node-RED.

```sh
npm ci
npm test
npm start
```

## Funcionamento

Configure o broker no fluxo `flows/offshore-telemetry.json`. `ARCHIVE_DIRECTORY` define a fila local; `BRUNNODEV_ACCESS_TOKEN` autentica a sincronização. O fluxo grava antes de enviar e conserva os dados sem confirmação do servidor.

## Persistência de resultados

O arquivo de operações está em [vercel-home-telemetry-api.vercel.app](https://vercel-home-telemetry-api.vercel.app/laboratory.html?project=nodered-industrial-automation). As migrações Supabase estão no [repositório da API](https://github.com/brunnojob/vercel-home-telemetry-api/tree/main/supabase/migrations).

```sh
python cloud/sync.py enqueue resultado.json --project nodered-industrial-automation
python cloud/sync.py sync
```

Defina `BRUNNODEV_ACCESS_TOKEN` com sua sessão. A fila SQLite conserva os relatórios até confirmação do servidor; o mesmo conteúdo não gera registros duplicados. Tokens não são gravados no código.
