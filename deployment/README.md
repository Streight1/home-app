# HomeApp standalone deployment

Tento adresář je samostatný deployment balíček pro VPS. Potřebuje pouze Docker
Engine, Compose plugin, `.env`, secret soubory a případný GHCR login.

## Start

```bash
cp .env.example .env
mkdir -p secrets
# vytvoř secrets podle secrets/README.md
docker compose config --quiet
docker compose up -d
```

Běžná aktualizace stagingu používá stejný příkaz:

```bash
docker compose up -d
```

## Údržba

```bash
docker compose --profile maintenance run --rm backup
docker compose ps
docker compose logs -f api
```

Obnova používá `restore.compose.yaml` a explicitní potvrzení. Úplné postupy:

- [one-command deployment](../docs/runbooks/one-command-deployment.md);
- [VPS hardening a troubleshooting](../docs/runbooks/vps-deployment.md);
- [backup a restore](../docs/runbooks/backup-and-restore.md);
- [GHCR image a tagy](../docs/runbooks/container-registry.md).

Na provozním stacku nikdy nepoužívej `docker compose down -v`.
