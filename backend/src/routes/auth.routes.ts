import { FastifyInstance } from "fastify";
import { authController } from "../controllers/index.js";
import { authMiddleware } from "../middlewares/index.js";

export const authRoutes = async (fastify: FastifyInstance): Promise<void> => {
  fastify.post("/register", authController.register);

  fastify.post("/login", authController.login);

  fastify.post("/refresh", authController.refresh);

  fastify.post("/logout", authController.logout);

  fastify.post(
    "/logout-all",
    { preHandler: [authMiddleware] },
    authController.logoutAll
  );

  fastify.get("/me", { preHandler: [authMiddleware] }, authController.me);
};
