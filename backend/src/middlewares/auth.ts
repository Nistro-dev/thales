import { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken } from "../utils/jwt.js";
import { logger } from "../utils/logger.js";

declare module "fastify" {
  interface FastifyRequest {
    user: {
      userId: string;
      email: string;
    };
  }
}

export const authMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply
        .status(401)
        .send({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    request.user = {
      userId: payload.userId,
      email: payload.email,
    };
  } catch (error) {
    logger.warn({ error }, "Invalid access token");
    return reply.status(401).send({ error: "Invalid or expired token" });
  }
};
