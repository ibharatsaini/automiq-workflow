import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ProjectService } from '../services/ProjectService';

export class ProjectMiddleware {
  constructor(private readonly projectService: ProjectService) {}

  /**
   * Extracts the subdomain from:
   *   1. X-Project-Subdomain header  (for curl / API clients)
   *   2. Host header                 (myproject.localhost:5678 → "myproject")
   */
  resolveProject: RequestHandler = async (
    req: Request, res: Response, next: NextFunction,
  ): Promise<void> => {
    const subdomain = this.extractSubdomain(req);

    if (!subdomain) {
      res.status(400).json({ error: 'Unable to determine project — set X-Project-Subdomain header or use a subdomain in the Host header' });
      return;
    }

    const project = await this.projectService.findBySubdomain(subdomain);
    if (!project) {
      res.status(404).json({ error: `No project found for subdomain "${subdomain}"` });
      return;
    }

    req.project = project;
    next();
  };

  //Fetches user's project role.
  loadProjectRole: RequestHandler = async (
    req: Request, res: Response, next: NextFunction,
  ): Promise<void> => {
    if (!req.user || !req.project) {
      res.status(401).json({ error: 'Authentication and project context required' });
      return;
    }

    const role = await this.projectService.getMemberRole(req.project.id, req.user.id);
    if (!role) {
      res.status(403).json({ error: 'You are not a member of this project' });
      return;
    }

    req.user.role = role;
    next();
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  extractSubdomain(req: Request): string | null {
    const explicit = req.headers['x-project-subdomain'];
    if (explicit && typeof explicit === 'string') return explicit.toLowerCase().trim();

    // Extract from Host header: "myproject.localhost:5678" → "myproject"
    const host = req.headers['host'] ?? '';
    const parts = host.split('.');
    if (parts.length >= 2) {
      const subdomain = parts[0]!.toLowerCase();
      // Avoid treating "localhost" alone as a subdomain
      if (subdomain !== 'localhost' && subdomain !== 'www') return subdomain;
    }

    return null;
  }
}
