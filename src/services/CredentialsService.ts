import { randomUUID }              from 'crypto';
import { GlobalConfig }            from '../config/GlobalConfig.js';
import { CredentialsRepository }   from '../repositories/CredentialsRepository';
import { getOrCreateEncryptionKey, encrypt, decrypt } from '../lib/encryption';

export class CredentialsService {
  private readonly key: Buffer;

  constructor(private readonly repo: CredentialsRepository, config: GlobalConfig) {
    this.key = getOrCreateEncryptionKey(config.encryptionKey);
  }

  async create(name: string, type: string, data: Record<string, unknown>, projectId: string) {
    const id = randomUUID();
    const record = await this.repo.create({ id, name, type, data: encrypt(this.key, data), projectId });
    return { id: record['id'] as string, name: record['name'] as string, type: record['type'] as string };
  }

  async getDecrypted(id: string, projectId: string): Promise<Record<string, unknown>> {
    const record = await this.repo.findById(id, projectId);
    if (!record) throw new Error(`Credential "${id}" not found`);
    return decrypt<Record<string, unknown>>(this.key, record['data'] as string);
  }

  async list(projectId: string) {
    return this.repo.findAll(projectId);
  }

  async delete(id: string, projectId: string) {
    await this.repo.delete(id, projectId);
  }

  async upsertSeedCredential(name: string, type: string, data: Record<string, unknown>, projectId: string): Promise<string> {
    const existing = await this.repo.findByType(type, projectId);
    if (existing) return existing['id'] as string;
    const created = await this.create(name, type, data, projectId);
    return created.id;
  }
}
