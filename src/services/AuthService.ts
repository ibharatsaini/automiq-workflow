import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/UserRepository.js";
import { GlobalConfig } from "../config/GlobalConfig.js";
import { IAuthUser, IJwtPayload } from "../lib/auth.types.js";

const SALT_ROUNDS = 12;
const TOKEN_TTL = "8h";

export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    private readonly userRepo: UserRepository,
    config: GlobalConfig,
  ) {
    this.jwtSecret = config.jwtSecret;
  }

  async register(email: string, password: string): Promise<IAuthUser> {
    console.log(`Register`);
    const existing = await this.userRepo.findByEmail(email);
    console.log(`Existing`, existing);
    if (existing) throw new Error(`User "${email}" already exists`);
    this.validatePassword(password);
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await this.userRepo.create({ email, passwordHash });
    console.log("user ", user);
    return { id: user.id, email: user.email };
  }

  // ── Login ────────────────────────────────────────────────────────────────

  async login(
    email: string,
    password: string,
  ): Promise<{ token: string; user: IAuthUser }> {
    console.log(`Login.`)
    const user = await this.userRepo.findByEmail(email);

    if (!user) throw new Error("Invalid email or password");

    const hash = user.passwordHash;
    const valid = await bcrypt.compare(password, hash);

    if (!valid) throw new Error("Invalid email or password");

    const payload: IJwtPayload = { sub: user.id, email: user.email };
    const token = jwt.sign(payload, this.jwtSecret, { expiresIn: TOKEN_TTL });
    return { token, user: { id: user.id, email: user.email } };
  }

  // ── Token ────────────────────────────────────────────────────────────────

  verifyToken(token: string): IJwtPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as IJwtPayload;
    } catch {
      throw new Error("Invalid or expired token");
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private validatePassword(password: string): void {
    if (password.length < 8)
      throw new Error("Password must be at least 8 characters");
  }
}
