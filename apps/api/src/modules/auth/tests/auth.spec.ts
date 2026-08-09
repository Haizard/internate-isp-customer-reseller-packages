import { describe, expect, it, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

vi.mock("../../../prisma/client", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    customer: { findFirst: vi.fn() },
    organization: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  },
}));

import { prisma } from "../../../prisma/client";
import { AuthService } from "../auth.service";
import { AppError } from "../../../middleware/errorHandler";

const service = new AuthService();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthService.login", () => {
  it("throws 401 for unknown email", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);
    await expect(service.login({ email: "nope@x.com", password: "x" })).rejects.toBeInstanceOf(AppError);
  });

  it("throws 401 for wrong password", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u-1",
      email: "a@b.com",
      passwordHash: await bcrypt.hash("right", 10),
      role: "ISP_ADMIN",
      organizationId: "o-1",
      customerId: null,
    } as never);
    vi.mocked(prisma.organization.findUnique).mockResolvedValue({ status: "ACTIVE" } as never);
    await expect(service.login({ email: "a@b.com", password: "wrong" })).rejects.toBeInstanceOf(AppError);
  });

  it("returns user plus access and refresh tokens on success", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u-1",
      name: "Admin",
      email: "admin@x.com",
      passwordHash: await bcrypt.hash("password123", 10),
      role: "ISP_ADMIN",
      organizationId: "o-1",
      customerId: null,
    } as never);
    vi.mocked(prisma.organization.findUnique).mockResolvedValue({ status: "ACTIVE" } as never);

    const result = await service.login({ email: "admin@x.com", password: "password123" });

    expect(result.user.email).toBe("admin@x.com");
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });
});

describe("AuthService.refresh", () => {
  it("throws 401 for an invalid refresh token", async () => {
    await expect(service.refresh("not-a-jwt")).rejects.toBeInstanceOf(AppError);
  });
});

describe("AuthService.register", () => {
  it("rejects an already-registered email", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u-1" } as never);
    await expect(
      service.register({ name: "A", email: "a@b.com", password: "x", role: "RESELLER", orgName: "Org" }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
