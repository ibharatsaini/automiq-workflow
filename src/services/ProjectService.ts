import { ProjectRepository }       from '../repositories/ProjectRepository';
import { ProjectMemberRepository } from '../repositories/ProjectMemberRepository';
import { UserRepository }          from '../repositories/UserRepository.js';
import { IProject }                from '../lib/project.types.js';
import { UserRole }                from '../lib/auth.types.js';

const SUBDOMAIN_RE = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
const RESERVED = new Set(['www', 'api', 'admin', 'app', 'mail', 'webhook', 'health']);

export class ProjectService {
  constructor(
    private readonly projectRepo:  ProjectRepository,
    private readonly memberRepo:   ProjectMemberRepository,
    private readonly userRepo:     UserRepository,
  ) {}

  async createProject(
    name: string,
    subdomain: string,
    ownerUserId: string,
  ): Promise<IProject> {
    this.validateSubdomain(subdomain);

    const taken = await this.projectRepo.subdomainExists(subdomain);
    if (taken) throw new Error(`Subdomain "${subdomain}" is already taken`);

    const project = await this.projectRepo.create({ name, subdomain });

    // Owner automatically becomes project admin.
    await this.memberRepo.upsert({ projectId: project.id, userId: ownerUserId, role: 'admin' });

    return project;
  }

  // ── Member management ────────────────────────────────────────────────────

  //Invites a already existing user with given role or create a new user if not present already.
  async inviteMember(
    projectId: string,
    email: string,
    role: UserRole,
    temporaryPassword: string,
  ): Promise<{ userId: string; email: string; role: UserRole; isNewUser: boolean }> {
    let user = await this.userRepo.findByEmail(email);
    let isNewUser = false;

    if (!user) {
      // Auto-create a temp account — user will need to change password.
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash(temporaryPassword, 12);
      user = await this.userRepo.create({ email, passwordHash: hash });
      isNewUser = true;
    }

    await this.memberRepo.upsert({ projectId, userId: user.id, role });
    return { userId: user.id, email: user.email, role, isNewUser };
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    await this.memberRepo.remove(projectId, userId);
  }

  async listMembers(projectId: string) {
    return this.memberRepo.findAllByProject(projectId);
  }

  async getMemberRole(projectId: string, userId: string): Promise<UserRole | null> {
    const member = await this.memberRepo.findByProjectAndUser(projectId, userId);
    return member?.role ?? null;
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
