#!/bin/bash
# setup.sh — Instala Docker + sobe a Evolution API no servidor
# Execute como root: bash setup.sh
#
# Testado em: Ubuntu 22.04 / 24.04

set -e

echo "=========================================="
echo "  NXT Hub — Evolution API Setup"
echo "=========================================="

# ── 1. Docker ─────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "→ Instalando Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo "✓ Docker instalado"
else
  echo "✓ Docker já instalado"
fi

# ── 2. Cria pasta de trabalho ─────────────────
mkdir -p /opt/evolution
cd /opt/evolution

# ── 3. Copia arquivos (espera que estejam no diretório atual) ──
if [ -f "$(dirname "$0")/docker-compose.yml" ]; then
  cp "$(dirname "$0")/docker-compose.yml" /opt/evolution/docker-compose.yml
fi

# ── 4. Cria .env se não existir ──────────────
if [ ! -f /opt/evolution/.env ]; then
  echo ""
  echo "Vamos configurar o .env da Evolution API."
  echo ""

  read -rp "URL pública desta máquina (ex: https://evo.seudominio.com): " EVO_URL
  read -rp "Chave API global (crie uma senha forte): " EVO_KEY
  read -rp "URL do webhook do NXT Hub (ex: https://seuapp.com/api/webhooks/messaging/whatsapp_evolution): " NXT_URL

  cat > /opt/evolution/.env <<EOF
EVOLUTION_SERVER_URL=${EVO_URL}
EVOLUTION_API_KEY=${EVO_KEY}
NXT_WEBHOOK_URL=${NXT_URL}
EOF

  echo "✓ .env criado em /opt/evolution/.env"
fi

# ── 5. Sobe o container ──────────────────────
cd /opt/evolution
docker compose up -d

echo ""
echo "=========================================="
echo "✓ Evolution API subiu!"
echo ""
echo "Acesse: $(grep EVOLUTION_SERVER_URL /opt/evolution/.env | cut -d= -f2)"
echo ""
echo "Próximos passos:"
echo "  1. No NXT Hub → Configurações → Canais → WhatsApp via Evolution"
echo "  2. Preencha a URL, a API key e o nome da instância"
echo "  3. Clique em 'Verificar e conectar'"
echo "  4. Escaneie o QR Code que aparecer"
echo "=========================================="
