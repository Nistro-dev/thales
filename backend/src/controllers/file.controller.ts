import { FastifyRequest, FastifyReply } from "fastify";
import { fileService } from "../services/index.js";
import { fileParamsSchema } from "../schemas/index.js";

export const upload = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const data = await request.file();

  if (!data) {
    reply.status(400).send({ error: "No file uploaded" });
    return;
  }

  const buffer = await data.toBuffer();
  const result = await fileService.upload(
    request.user.userId,
    data.filename,
    data.mimetype,
    buffer
  );

  reply.status(201).send(result);
};

export const list = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const files = await fileService.list(request.user.userId);

  reply.send(files);
};

export const download = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const params = fileParamsSchema.parse(request.params);
  const url = await fileService.getDownloadUrl(request.user.userId, params.id);

  reply.send({ url });
};

export const remove = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const params = fileParamsSchema.parse(request.params);
  await fileService.remove(request.user.userId, params.id);

  reply.status(204).send();
};
