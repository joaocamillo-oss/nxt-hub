# Guia — Subir WhatsApp (Evolution API) + NXT Hub

## Pré-requisitos

- Uma VPS com Ubuntu 22.04+ (mínimo 2GB RAM)
  - Sugestões baratas: **Contabo** (~€5/mês), **Hostinger VPS** (~R$30/mês), **DigitalOcean** ($12/mês)
- Um domínio apontando para o IP da VPS (ex: `evo.seudominio.com.br`)
- O NXT Hub já publicado e acessível via HTTPS

---

## Passo 1 — Apontar domínio para a VPS

No painel DNS do seu domínio, crie um registro A:

| Nome | Tipo | Valor         |
|------|------|---------------|
| `evo` | A  | `IP_DA_VPS`   |

Aguarde propagação (geralmente 5–10 minutos).

---

## Passo 2 — Subir a Evolution API na VPS

Conecte na VPS via SSH:
```bash
ssh root@IP_DA_VPS
```

Clone só a pasta infra ou copie os arquivos manualmente:
```bash
mkdir -p /opt/evolution
# Copie docker-compose.yml e setup.sh para /opt/evolution/
```

Execute o setup (ele instala Docker e pergunta as variáveis):
```bash
bash /opt/evolution/setup.sh
```

Responda as perguntas:
- **URL pública**: `https://evo.seudominio.com.br`
- **Chave API**: crie uma senha forte (ex: `Xk9#mP2vQr7!nLs`)
- **URL do webhook**: `https://seuapp.com/api/webhooks/messaging/whatsapp_evolution`

---

## Passo 3 — Configurar HTTPS (Nginx + Certbot)

```bash
apt install -y nginx certbot python3-certbot-nginx

# Cria virtual host
cat > /etc/nginx/sites-available/evolution <<'EOF'
server {
    server_name evo.seudominio.com.br;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
EOF

ln -s /etc/nginx/sites-available/evolution /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Emite certificado SSL
certbot --nginx -d evo.seudominio.com.br
```

---

## Passo 4 — Conectar no NXT Hub

1. Acesse o NXT Hub → **Configurações → Canais → + Novo canal → WhatsApp via Evolution**
2. Preencha:
   - **URL do Evolution**: `https://evo.seudominio.com.br`
   - **API key global**: a chave que você criou no Passo 2
   - **Nome da instância**: nome que quer dar (ex: `juridico-divorcio`)
   - **Nome interno**: como aparece no app (ex: `WhatsApp Jurídico`)
3. Clique em **Verificar e conectar**
4. Escaneie o **QR Code** que aparecer com o WhatsApp do número desejado

---

## Passo 5 — Vincular ao funil CRM (opcional)

Após conectar, vá em **CRM → aba do funil** → clique nos `...` → **Editar funil** → selecione o canal recém-conectado.

Agora leads que chegam por esse WhatsApp entram automaticamente no funil correto.

---

## Múltiplos números

Para cada número adicional, basta:
1. No NXT Hub → **+ Novo canal** → preencha um **Nome da instância diferente**
2. Escaneie com o segundo número

Cada instância é independente — você pode ter `juridico-divorcio`, `juridico-trabalhista`, `comercial`, etc., cada um no seu funil.

---

## Troubleshooting

**QR Code não aparece:**
```bash
docker logs evolution-api --tail 50
```

**Webhook não chega:**
- Confirme que o NXT Hub está acessível via HTTPS
- Teste manualmente:
```bash
curl -X POST https://seuapp.com/api/webhooks/messaging/whatsapp_evolution \
  -H "Content-Type: application/json" \
  -d '{"event":"test","instance":"teste"}'
```

**Instância desconecta sozinho:**
- O WhatsApp desconecta quando o celular fica sem internet ou a bateria acaba
- Basta abrir o NXT Hub → canal → Reconectar e escanear de novo

---

## Verificar se está tudo certo

```bash
# Status do container
docker ps | grep evolution

# Logs em tempo real
docker logs -f evolution-api

# Testar autenticação da API
curl -H "apikey: SUA_CHAVE" https://evo.seudominio.com.br/instance/fetchInstances
```
