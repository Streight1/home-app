import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { Injectable } from '@nestjs/common';
import { expeditionsInvalid } from '../domain/expeditions.errors.js';
import type {
  GearImageHttpPort,
  GearImageHttpResponse,
} from './gear-image-http.port.js';
import { isBlockedNetworkAddress } from './image-network-policy.js';

const timeoutMs = 8_000;

@Injectable()
export class NodeGearImageHttpAdapter implements GearImageHttpPort {
  public async get(url: URL, maxBytes: number): Promise<GearImageHttpResponse> {
    const addresses = await lookup(url.hostname, { all: true, verbatim: true });
    if (
      addresses.length === 0 ||
      addresses.some(({ address }) => isBlockedNetworkAddress(address))
    )
      throw expeditionsInvalid('Cílová adresa obrázku není veřejná.');
    const selected = addresses[0];
    if (!selected)
      throw expeditionsInvalid('Cílovou adresu obrázku nelze ověřit.');
    return new Promise((resolve, reject) => {
      const req = request(
        url,
        {
          method: 'GET',
          timeout: timeoutMs,
          headers: {
            Accept: 'image/png,image/jpeg',
            'User-Agent': 'HomeApp-GearImage/1.0',
          },
          lookup: (_hostname, _options, callback) =>
            callback(null, selected.address, selected.family),
        },
        (response) => {
          const contentLengthValue = Number(
            response.headers['content-length'] ?? 0,
          );
          if (
            Number.isFinite(contentLengthValue) &&
            contentLengthValue > maxBytes
          ) {
            response.destroy();
            reject(expeditionsInvalid('Obrázek je příliš velký.'));
            return;
          }
          const chunks: Buffer[] = [];
          let total = 0;
          response.on('data', (chunk: Buffer) => {
            total += chunk.length;
            if (total > maxBytes) {
              response.destroy(expeditionsInvalid('Obrázek je příliš velký.'));
              return;
            }
            chunks.push(chunk);
          });
          response.on('end', () =>
            resolve({
              status: response.statusCode ?? 0,
              location:
                typeof response.headers.location === 'string'
                  ? response.headers.location
                  : null,
              contentType:
                typeof response.headers['content-type'] === 'string'
                  ? (response.headers['content-type']
                      .split(';')[0]
                      ?.trim()
                      .toLowerCase() ?? null)
                  : null,
              contentLength: contentLengthValue > 0 ? contentLengthValue : null,
              body: Buffer.concat(chunks),
            }),
          );
          response.on('error', reject);
        },
      );
      req.on('timeout', () =>
        req.destroy(expeditionsInvalid('Načtení obrázku vypršelo.')),
      );
      req.on('error', reject);
      req.end();
    });
  }
}
