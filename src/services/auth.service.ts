import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { User, type UserRole } from "../models/user.model";
import { AppError } from "../utils/appError";

const SALT_ROUNDS = 12;

function signToken(userId: string, email: string, role: UserRole): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("Server misconfiguration: JWT_SECRET not set", 500);
  }
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];
  const options: SignOptions = { expiresIn };
  return jwt.sign({ sub: userId, email, role }, secret, options);
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: { id: string; name: string; email: string; role: UserRole; status: string }; token: string }> {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw new AppError("Email already registered", 409);
  }
  const hash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    password: hash,
    role: "viewer",
    status: "active",
  });
  const token = signToken(user.id, user.email, user.role);
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
    token,
  };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ user: { id: string; name: string; email: string; role: UserRole; status: string }; token: string }> {
  const user = await User.findOne({ email: input.email.toLowerCase() }).select("+password");
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }
  if (user.status !== "active") {
    throw new AppError("Account is inactive", 403);
  }
  const ok = await bcrypt.compare(input.password, user.password);
  if (!ok) {
    throw new AppError("Invalid email or password", 401);
  }
  const token = signToken(user.id, user.email, user.role);
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
    token,
  };
}