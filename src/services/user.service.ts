import { User, type UserRole, type UserStatus } from "../models/user.model";
import { AppError } from "../utils/appError";

export async function listUsers(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    User.find().select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(),
  ]);
  return {
    items: items.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    })),
    total,
  };
}

export async function updateUserStatus(userId: string, status: UserStatus) {
  const user = await User.findByIdAndUpdate(userId, { status }, { new: true }).select("-password");
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function updateUserRole(userId: string, role: UserRole) {
  const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select("-password");
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
