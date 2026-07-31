export const GEAR_IMAGE_HTTP_PORT = Symbol('GEAR_IMAGE_HTTP_PORT');

export interface GearImageHttpResponse {
  status: number;
  location: string | null;
  contentType: string | null;
  contentLength: number | null;
  body: Buffer;
}

export interface GearImageHttpPort {
  get(url: URL, maxBytes: number): Promise<GearImageHttpResponse>;
}
