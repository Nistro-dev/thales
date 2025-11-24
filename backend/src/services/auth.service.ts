import { prisma } from "../utils/prisma.js";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
  logger,
} from "../utils/index.js";
import type { RegisterInput, LoginInput } from "../schemas/index.js";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export const register = async (
  data: RegisterInput
): Promise<{ user: UserResponse; tokens: AuthTokens }> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw { statusCode: 409, message: "Email already registered" };
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  const tokens = await generateTokens(user.id, user.email);

  logger.info({ userId: user.id }, "User registered");

  return { user, tokens };
};

export const login = async (
  data: LoginInput
): Promise<{ user: UserResponse; tokens: AuthTokens }> => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw { statusCode: 401, message: "Invalid credentials" };
  }

  if (!user.isActive) {
    throw { statusCode: 403, message: "Account is disabled" };
  }

  const isValidPassword = await comparePassword(data.password, user.password);

  if (!isValidPassword) {
    throw { statusCode: 401, message: "Invalid credentials" };
  }

  const tokens = await generateTokens(user.id, user.email);

  logger.info({ userId: user.id }, "User logged in");

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    tokens,
  };
};

export const refresh = async (refreshToken: string): Promise<AuthTokens> => {
  const payload = verifyRefreshToken(refreshToken);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken) {
    throw { statusCode: 401, message: "Invalid refresh token" };
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw { statusCode: 401, message: "Refresh token expired" };
  }

  if (!storedToken.user.isActive) {
    throw { statusCode: 403, message: "Account is disabled" };
  }

  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  const tokens = await generateTokens(payload.userId, payload.email);

  logger.info({ userId: payload.userId }, "Token refreshed");

  return tokens;
};

export const logout = async (refreshToken: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });

  logger.info("User logged out");
};

export const logoutAll = async (userId: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });

  logger.info({ userId }, "User logged out from all devices");
};

const generateTokens = async (
  userId: string,
  email: string
): Promise<AuthTokens> => {
  const accessToken = generateAccessToken({ userId, email });
  const refreshToken = generateRefreshToken({ userId, email });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return { accessToken, refreshToken };
};
