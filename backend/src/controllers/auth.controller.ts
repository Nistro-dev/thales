import { FastifyRequest, FastifyReply } from "fastify";
import { authService } from "../services/index.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "../schemas/index.js";

export const register = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const data = registerSchema.parse(request.body);
  const result = await authService.register(data);

  reply.status(201).send(result);
};

export const login = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const data = loginSchema.parse(request.body);
  const result = await authService.login(data);

  reply
    .setCookie("refreshToken", result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth/refresh",
      maxAge: 7 * 24 * 60 * 60,
    })
    .send({
      user: result.user,
      accessToken: result.tokens.accessToken,
    });
};

export const refresh = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const refreshToken = request.cookies.refreshToken;

  if (!refreshToken) {
    const body = refreshTokenSchema.parse(request.body);
    const tokens = await authService.refresh(body.refreshToken);

    reply.send({ accessToken: tokens.accessToken });
    return;
  }

  const tokens = await authService.refresh(refreshToken);

  reply
    .setCookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth/refresh",
      maxAge: 7 * 24 * 60 * 60,
    })
    .send({ accessToken: tokens.accessToken });
};

export const logout = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const refreshToken = request.cookies.refreshToken;

  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  reply
    .clearCookie("refreshToken", { path: "/api/auth/refresh" })
    .status(204)
    .send();
};

export const logoutAll = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  await authService.logoutAll(request.user.userId);

  reply
    .clearCookie("refreshToken", { path: "/api/auth/refresh" })
    .status(204)
    .send();
};

export const me = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { prisma } = await import("../utils/prisma.js");

  const user = await prisma.user.findUnique({
    where: { id: request.user.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
    },
  });

  if (!user) {
    reply.status(404).send({ error: "User not found" });
    return;
  }

  reply.send(user);
};
