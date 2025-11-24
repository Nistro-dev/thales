import { FastifyInstance } from "fastify";
import { fileController } from "../controllers/index.js";
import { authMiddleware } from "../middlewares/index.js";

export const fileRoutes = async (fastify: FastifyInstance): Promise<void> => {
  fastify.addHook("preHandler", authMiddleware);

  fastify.post("/upload", fileController.upload);

  fastify.get("/", fileController.list);

  fastify.get("/:id/download", fileController.download);

  fastify.delete("/:id", fileController.remove);
};
