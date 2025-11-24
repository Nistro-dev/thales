import { FastifyInstance } from "fastify";
import { authRoutes } from "./auth.routes.js";
import { fileRoutes } from "./file.routes.js";

export const registerRoutes = async (
  fastify: FastifyInstance
): Promise<void> => {
  fastify.register(authRoutes, { prefix: "/api/auth" });
  fastify.register(fileRoutes, { prefix: "/api/files" });
};
