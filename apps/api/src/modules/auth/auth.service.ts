import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../prisma/client";
import { config } from "../../config";
import { AppError } from "../../middleware/errorHandler";
import type { AuthUser } from "../../middleware/authGuard";
import type { LoginInput, RegisterInput } from "./auth.dto";

function signAccess(user: AuthUser): string {
  return jwt.sign(user, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpires as jwt.SignOptions["expiresIn"],
  });
}

function signRefresh(user: AuthUser): string {
  return jwt.sign(user, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires as jwt.SignOptions["expiresIn"],
  });
}

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  customerId: string | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    customerId: user.customerId,
  };
}

async function toAuthUser(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "User not found");
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    customerId: user.customerId,
  };
}

export class AuthService {
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new AppError(401, "Invalid email or password");
    const organization = await prisma.organization.findUnique({ where: { id: user.organizationId }, select: { status: true } });
    if (organization && organization.status !== "ACTIVE") throw new AppError(403, "Account organization is not active");
    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new AppError(401, "Invalid email or password");

    const auth = await toAuthUser(user.id);
    return {
      user: publicUser(user),
      accessToken: signAccess(auth),
      refreshToken: signRefresh(auth),
    };
  }

  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError(409, "Email already registered");

    const passwordHash = await bcrypt.hash(input.password, 10);

    if (input.role === "CUSTOMER") {
      const customer = await prisma.customer.findFirst({ where: { phone: input.orgName ?? "" } });
      if (!customer) throw new AppError(400, "Customer account not found by the provided phone number");
      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          role: "CUSTOMER",
          organizationId: customer.organizationId,
          customerId: customer.id,
        },
      });
      return publicUser(user);
    }

    // RESELLER application: create a reseller org under the platform's first ISP org
    const isp = await prisma.organization.findFirst({ where: { type: "ISP" } });
    if (!isp) throw new AppError(409, "No ISP available to host reseller applications");
    const org = await prisma.organization.create({
      data: {
        name: input.orgName ?? `${input.name}'s Reseller`,
        type: "RESELLER",
        parentOrgId: isp.id,
        status: "PENDING_APPROVAL",
      },
    });
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: "RESELLER",
        organizationId: org.id,
      },
    });
    return publicUser(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as AuthUser;
      const auth = await toAuthUser(payload.id);
      return { accessToken: signAccess(auth) };
    } catch {
      throw new AppError(401, "Invalid refresh token");
    }
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });
    if (!user) throw new AppError(404, "User not found");
    return user;
  }
}
