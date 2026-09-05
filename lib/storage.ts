import { env } from "cloudflare:workers";

type StoredObject = { body: ReadableStream; httpMetadata?: { contentType?: string } };
type Bucket = {
  put: (key: string, value: ReadableStream | ArrayBuffer | Blob, options?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> }) => Promise<unknown>;
  get: (key: string) => Promise<StoredObject | null>;
  delete: (key: string) => Promise<void>;
};

export function getBucket() {
  const bucket = (env as unknown as { BUCKET?: Bucket }).BUCKET;
  if (!bucket) throw new Error("Хранилище изображений пока недоступно");
  return bucket;
}
