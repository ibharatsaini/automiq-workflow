import { ProjectRepository }       from '../repositories/ProjectRepository';
import { UserRepository }          from '../repositories/UserRepository.js';
import { IProject }                from '../lib/project.types';
import { UserRole }                from '../lib/auth.types.js';

const SUBDOMAIN_RE = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
const RESERVED = new Set(['www', 'api', 'admin', 'app', 'mail', 'webhook', 'health']);

export class ProjectService {
  constructor(
    private readonly projectRepo:  ProjectRepository,
    private readonly userRepo:     UserRepository,
  ) {}

  // ── Create ────────────────────────────────────────────────────────────────

  async createProject(
    name: string,
    subdomain: string,
    ownerUserId: string,
  ): Promise<IProject> {
    this.validateSubdomain(subdomain);

    const taken = await this.projectRepo.subdomainExists(subdomain);
    if (taken) throw new Error(`Subdomain "${subdomain}" is already taken`);

    const project = await this.projectRepo.create({ name, subdomain });



    return project;
  }

  // ── Member management ────────────────────────────────────────────────────
  async inviteMember(
    projectId: string,
    email: string,
    role: UserRole,
    temporaryPassword: string,
  ): Promise<{ userId: string; email: string; role: UserRole; isNewUser: boolean }> {
    let user = await this.userRepo.findByEmail(email);
    let isNewUser = false;

    if (!user) {
      // Auto-create a stub account — user will need to change password.
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash(temporaryPassword, 12);
      user = await this.userRepo.create({ email, passwordHash: hash });
      isNewUser = true;
    }

    return { userId: user.id, email: user.email, role, isNewUser };
  }


  // ── Lookup ────────────────────────────────────────────────────────────────

  async findBySubdomain(subdomain: string): Promise<IProject | null> {
    return this.projectRepo.findBySubdomain(subdomain);
  }

  async findAll(): Promise<IProject[]> {
    return this.projectRepo.findAll();
  }

  // ── Validation ────────────────────────────────────────────────────────────

  private validateSubdomain(subdomain: string): void {
    if (!SUBDOMAIN_RE.test(subdomain)) {
      throw new Error(
        'Subdomain must be 3–50 lowercase alphanumeric characters or hyphens, ' +
        'cannot start or end with a hyphen',
      );
    }
    if (RESERVED.has(subdomain)) {
      throw new Error(`Subdomain "${subdomain}" is reserved`);
    }
  }
}
