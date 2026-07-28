# Container registry

## Image a zdroj názvů

Jediný registry manifest `deployment/images.json` používají deployment
kontroly, Compose fallback i publish workflow:

```text
ghcr.io/streight1/home-app-api
ghcr.io/streight1/home-app-web
```

Workflow je v `.github/workflows/publish-containers.yml`. Nejdříve paralelně
provede statické, API, web, browser a container kontroly. Image publikuje až
potom. Používá pouze `GITHUB_TOKEN`; validační joby mají `contents: read` a
jen publish job `packages: write`. Docker build nedostává produkční secrets.
Browser job spouští Storybook a Playwright nad environment-independent Vite
konfigurací s `LANG=C.UTF-8`; neobsahuje aplikační CSRF, API ani Vite hodnoty.

## Události a tagy

- Pull request: všech pět validačních jobů, žádný publish.
- Push do `main`: `staging` a celý commit SHA.
- Release tag `vX.Y.Z`: `vX.Y.Z`, `X.Y`, `X` a celý commit SHA.
- `workflow_dispatch`: validace a celý commit SHA.

`latest` se automaticky nevytváří. `staging` je mutable tag posledního
úspěšného buildu `main`; release a SHA tagy jsou určeny pro reprodukovatelné
připnutí. Rollback image není rollback databázové migrace.

Build přidává OCI source/revision/version/description metadata, provenance a
SBOM. Přesný digest a skutečnou dostupnost image prokáže pouze úspěšný GitHub
Actions run, ne lokální validace workflow.

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

Použij read-only token s minimálním `read:packages`. Token neukládej do
Compose, `.env`, image ani repozitáře. GitHub Actions publikuje vestavěným
`GITHUB_TOKEN`; žádný PAT nepotřebuje.

## Diagnostika publikace

V repository Actions otevři první selhaný required check:

1. `Quality / Static checks`;
2. `Tests / API`;
3. `Tests / Web`;
4. `Tests / Browser`;
5. `Containers / Validation`.

Relevantní artifact vzniká pouze při chybě a má sedmidenní retention. Publish
se při selhání či zrušení libovolného required jobu přes `needs` vůbec
nespustí. Podrobnosti jsou v
[CI dokumentaci](../development/continuous-integration.md).
