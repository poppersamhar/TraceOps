import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface StorePersistenceAdapter {
  kind: 'json_file';
  storeDir: string;
  storePath: string;
  backupPath: string;
  snapshotsDir: string;
  snapshotManifestPath: string;
  tempPath(): string;
  readStoreText(): Promise<string>;
  readStoreBuffer(): Promise<Buffer>;
  readBackupText(): Promise<string>;
  readBackupSize(): Promise<number | undefined>;
  writeStoreText(text: string): Promise<void>;
  backupStoreIfValid(): Promise<void>;
  restoreBackupText(text: string): Promise<void>;
  quarantineStore(reason: 'empty' | 'corrupt'): Promise<void>;
  readStoreSize(): Promise<number | undefined>;
}

class JsonFilePersistenceAdapter implements StorePersistenceAdapter {
  readonly kind = 'json_file' as const;
  readonly storeDir = path.resolve(process.cwd(), '.traceops');
  readonly storePath = path.join(this.storeDir, 'store.json');
  readonly backupPath = path.join(this.storeDir, 'store.json.bak');
  readonly snapshotsDir = path.join(this.storeDir, 'snapshots');
  readonly snapshotManifestPath = path.join(this.snapshotsDir, 'manifest.json');

  tempPath(): string {
    return path.join(this.storeDir, `store.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`);
  }

  readStoreText(): Promise<string> {
    return fs.readFile(this.storePath, 'utf8');
  }

  readStoreBuffer(): Promise<Buffer> {
    return fs.readFile(this.storePath);
  }

  readBackupText(): Promise<string> {
    return fs.readFile(this.backupPath, 'utf8');
  }

  async readBackupSize(): Promise<number | undefined> {
    try {
      return (await fs.stat(this.backupPath)).size;
    } catch {
      return undefined;
    }
  }

  async writeStoreText(text: string): Promise<void> {
    await fs.mkdir(this.storeDir, { recursive: true });
    const tempPath = this.tempPath();
    try {
      await fs.writeFile(tempPath, text, 'utf8');
      await fs.rename(tempPath, this.storePath);
    } catch (error) {
      await fs.rm(tempPath, { force: true }).catch(() => undefined);
      throw error;
    }
  }

  async backupStoreIfValid(): Promise<void> {
    try {
      const current = await this.readStoreText();
      if (!current.trim()) return;
      JSON.parse(current);
      await fs.copyFile(this.storePath, this.backupPath);
    } catch {
      // Keep the last known-good backup when the current store is absent or invalid.
    }
  }

  async restoreBackupText(text: string): Promise<void> {
    await fs.mkdir(this.storeDir, { recursive: true });
    await fs.writeFile(this.storePath, text, 'utf8');
  }

  async quarantineStore(reason: 'empty' | 'corrupt'): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      await fs.rename(this.storePath, path.join(this.storeDir, `store.${reason}.${timestamp}.json`));
    } catch {
      // Quarantine is best-effort; load can still continue with a fresh store.
    }
  }

  async readStoreSize(): Promise<number | undefined> {
    try {
      return (await fs.stat(this.storePath)).size;
    } catch {
      return undefined;
    }
  }
}

export function createStorePersistenceAdapter(): StorePersistenceAdapter {
  const driver = process.env.TRACEOPS_PERSISTENCE_DRIVER?.trim() || 'json_file';
  if (driver !== 'json_file') {
    throw new Error(`Unsupported TRACEOPS_PERSISTENCE_DRIVER: ${driver}`);
  }
  return new JsonFilePersistenceAdapter();
}
