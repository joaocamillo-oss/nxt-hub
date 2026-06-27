#!/bin/bash
# configure-webhook.sh — Configura o webhook numa instância Evolution
#
# Uso: bash configure-webhook.sh <nome-da-instancia>
# Ex:  bash configure-webhook.sh juridico-divorcio

set -e

INSTANCE_NAME="${1:-}"

if [ -z "$INSTANCE_NAME" ]; then
  echo "Uso: bash configure-webhook.sh <nome-da-instancia>"
  exit 1
fi

# Carrega .env
if [ -f /opt/evolution/.env ]; then
  source /opt/evolution/.env
elif [ -f "$(dirname "$0")/.env" ]; then
  source "$(dirname "$0")/.env"
else
  echo "Arquivo .env não encontrado."
  exit 1
fi

echo "→ Configurando webhook para instância: $INSTANCE_NAME"

curl -s -X POST \
  "${EVOLUTION_SERVER_URL}/webhook/set/${INSTANCE_NAME}" \
  -H "apikey: ${EVOLUTION_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "enabled": true,
      "url": "'"${NXT_WEBHOOK_URL}"'",
      "webhookByEvents": false,
      "webhookBase64": false,
      "events": [
        "MESSAGES_UPSERT",
        "MESSAGES_UPDATE",
        "MESSAGES_DELETE",
        "SEND_MESSAGE",
        "CONNECTION_UPDATE",
        "QRCODE_UPDATED"
      ]
    }
  }' | python3 -m json.tool 2>/dev/null || echo "(resposta não-JSON)"

echo ""
echo "✓ Webhook configurado para $INSTANCE_NAME"
echo "  URL: ${NXT_WEBHOOK_URL}"
