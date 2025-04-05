#!/bin/bash

BOT_TOKEN="7597930334:AAHASEfI0tjDH7QGUgYVkWJgizvI-DDzSw8"

NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[] | select(.proto=="https") | .public_url')

if [ -z "$NGROK_URL" ]; then
  echo "❌ No se pudo obtener la URL de ngrok. ¿Está corriendo?"
  exit 1
fi

WEBHOOK_URL="$NGROK_URL/api/bot"

echo "🔗 Registrando webhook con URL: $WEBHOOK_URL"

curl -s -X POST -F "url=$WEBHOOK_URL" "https://api.telegram.org/bot$BOT_TOKEN/setWebhook"

echo "✅ Webhook registrado con éxito"
