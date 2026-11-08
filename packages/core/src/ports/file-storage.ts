export type Visibility = 'public' | 'private';

export interface FileStorage {
  put(file: {
    readonly key: string;
    readonly bytes: Uint8Array;
    readonly contentType: string;
    readonly visibility: Visibility;
  }): Promise<void>;
  getSignedUrl(key: string, ttlSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
}
