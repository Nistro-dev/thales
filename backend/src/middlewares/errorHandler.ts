import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { logger } from "../utils/logger.js";

export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void => {
  logger.error(
    {
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
    },
    "Request error"
  );

  if (error instanceof ZodError) {
    reply.status(400).send({
      error: "Validation error",
      details: error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  if (error.statusCode) {
    reply.status(error.statusCode).send({ error: error.message });
    return;
  }

  reply.status(500).send({ error: "Internal server error" });
};
