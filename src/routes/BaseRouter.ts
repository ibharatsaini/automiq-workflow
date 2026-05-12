import { Router } from "express";

export abstract class BaseRouter {
  readonly router: Router = Router();

  setup(): void {
    this.registerRoutes();
  }

  protected abstract registerRoutes(): void;
}
