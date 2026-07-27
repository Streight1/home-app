import { readFile } from 'node:fs/promises';
import process from 'node:process';

const path = process.argv[2];
const expectedPrefix = process.argv[3];
if (!path || !expectedPrefix) {
  console.error(
    'Použití: check-compose-model.mjs <config.json> <volume-prefix>',
  );
  process.exit(1);
}

const model = JSON.parse(await readFile(path, 'utf8'));
const errors = [];
const services = model.services ?? {};

function failUnless(condition, message) {
  if (!condition) errors.push(message);
}

for (const name of ['volumes-init', 'db', 'migrate', 'api', 'gateway']) {
  failUnless(Boolean(services[name]), `CI Compose postrádá službu ${name}.`);
}

failUnless(
  services.api?.image === 'homeapp-api:ci' &&
    services.migrate?.image === 'homeapp-api:ci',
  'API a migrate musí používat lokální CI image.',
);
failUnless(
  services.gateway?.image === 'homeapp-web:ci',
  'Gateway musí používat lokální CI image.',
);
failUnless(
  (services.db?.ports ?? []).length === 0,
  'CI databáze nesmí publikovat host port.',
);
failUnless(
  (services.api?.ports ?? []).length === 0,
  'CI API nesmí publikovat host port.',
);
const gatewayPorts = services.gateway?.ports ?? [];
failUnless(
  gatewayPorts.length === 1 &&
    Number(gatewayPorts[0]?.target) === 80 &&
    gatewayPorts[0]?.host_ip === '127.0.0.1',
  'CI gateway smí publikovat pouze náhodný loopback HTTP port.',
);
const gatewayVolumes = (services.gateway?.volumes ?? []).map(
  (volume) => volume.source,
);
failUnless(
  !gatewayVolumes.some((source) => String(source).includes('upload')),
  'CI gateway nesmí připojit uploads volume.',
);
for (const [logicalName, volume] of Object.entries(model.volumes ?? {})) {
  failUnless(
    String(volume.name ?? '').startsWith(expectedPrefix),
    `CI volume ${logicalName} nepoužívá izolovaný prefix.`,
  );
}
failUnless(
  services.api?.read_only === true,
  'CI musí skutečně ověřovat read-only API root filesystem.',
);
failUnless(
  String(services.api?.user ?? '').startsWith('10001:'),
  'CI musí spouštět API jako neprivilegovaného uživatele.',
);
failUnless(
  (services.gateway?.security_opt ?? []).includes('no-new-privileges:true'),
  'CI gateway musí zachovat no-new-privileges hardening.',
);

if (errors.length > 0) {
  console.error(`CI Compose model je neplatný:\n- ${errors.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(
    'CI Compose model je izolovaný (lokální image, loopback gateway, neveřejné DB/API a vlastní volumes).',
  );
}
