# Container registry

## Image

GitHub Actions publikuje po úspěšném `pnpm check` dva image:

```text
ghcr.io/streight1/home-app-api
ghcr.io/streight1/home-app-web
```

Workflow je v `.github/workflows/publish-containers.yml`. Používá
`GITHUB_TOKEN`, `contents: read`, `packages: write`, actions připnuté na commit
SHA a neposkytuje Docker buildu produkční secrets.

## Tagy

- `staging` je mutable tag posledního úspěšného buildu výchozí větve.
- úplný commit SHA ukazuje na přesný zdrojový stav;
- `vX.Y.Z` vzniká pro Git tag odpovídající release.

Pro průběžný staging používej:

```dotenv
APP_IMAGE_TAG=staging
APP_PULL_POLICY=always
```

Pro opakovatelný release:

```dotenv
APP_IMAGE_TAG=v1.2.3
APP_PULL_POLICY=missing
```

Ještě silnější připnutí poskytuje full SHA tag. Rollback image nezpětně
neodstraní aplikované databázové migrace.

## Veřejné image

Veřejný GHCR balíček může VPS stáhnout bez loginu:

```bash
docker pull ghcr.io/streight1/home-app-api:staging
docker pull ghcr.io/streight1/home-app-web:staging
```

Image neobsahuje tajemství, ale veřejnost může stáhnout aplikační binární
artefakty. Veřejnost image není bezpečnostní hranice aplikace.

## Privátní image

Pro současný soukromý projekt je doporučený privátní balíček. Na VPS proveď
jednorázově:

```bash
docker login ghcr.io
```

Použij oddělený read-only token s minimálním `read:packages`. Token neukládej do
Compose, `.env`, image ani repozitáře. Přihlašovací stav spravuje Docker daného
deployment uživatele.

## Publikování

Publikace se spustí pushnutím na výchozí větev, release tagem `vX.Y.Z` nebo
ručním `workflow_dispatch`. Image se nepublikuje, pokud kontroly selžou.

Lokální Docker build a workflow lint ověřují definici, ale nejsou důkazem, že
image skutečně existuje v GHCR. To potvrzuje pouze úspěšný GitHub Actions run a
viditelný package digest.
