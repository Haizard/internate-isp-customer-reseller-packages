import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../../prisma/client", () => ({
  prisma: {
    ticket: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
    ticketComment: { create: vi.fn() },
    customer: { findFirst: vi.fn() },
    router: { findFirst: vi.fn() },
    location: { findFirst: vi.fn() },
    package: { findFirst: vi.fn() },
    voucher: { findFirst: vi.fn() },
    user: { findFirst: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

import { prisma } from "../../../prisma/client";
import { TicketsService } from "../tickets.service";
import { AppError } from "../../../middleware/errorHandler";

const service = new TicketsService();
const actorId = "user-1";
const orgIds = ["org-1", "org-2"];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TicketsService.create", () => {
  it("rejects a linked entity outside the caller's org scope", async () => {
    vi.mocked(prisma.customer.findFirst).mockResolvedValue(null as never);
    await expect(
      service.create({ subject: "Down", priority: "HIGH", entityType: "Customer", entityId: "c-x" }, orgIds, actorId, "org-1"),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("applies urgent sla deadlines (1h respond / 4h resolve)", async () => {
    vi.mocked(prisma.ticket.create).mockResolvedValue({ id: "t-1" } as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);
    const now = Date.now();
    await service.create({ subject: "Outage", priority: "URGENT" }, orgIds, actorId, "org-1");
    const data = vi.mocked(prisma.ticket.create).mock.calls[0]![0].data as Record<string, unknown>;
    expect(data.slaRespondBy).toBeInstanceOf(Date);
    expect(data.slaResolveBy).toBeInstanceOf(Date);
    const respondDiff = (data.slaRespondBy as Date).getTime() - now;
    const resolveDiff = (data.slaResolveBy as Date).getTime() - now;
    expect(respondDiff).toBeGreaterThan(0);
    expect(resolveDiff).toBeGreaterThan(respondDiff);
  });
});

describe("TicketsService.list", () => {
  it("is tenant scoped and excludes soft-deleted tickets", async () => {
    vi.mocked(prisma.ticket.findMany).mockResolvedValue([] as never);
    await service.list({ status: "OPEN" }, orgIds);
    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: { in: orgIds }, deletedAt: null, status: "OPEN" }),
      }),
    );
  });
});

describe("TicketsService.get", () => {
  it("throws 404 for a ticket outside the caller's scope", async () => {
    vi.mocked(prisma.ticket.findFirst).mockResolvedValue(null as never);
    await expect(service.get("t-1", orgIds)).rejects.toBeInstanceOf(AppError);
  });
});

describe("TicketsService.addComment", () => {
  it("records firstResponseAt on the first non-internal agent reply", async () => {
    vi.mocked(prisma.ticket.findFirst).mockResolvedValue({ id: "t-1", firstResponseAt: null } as never);
    vi.mocked(prisma.ticketComment.create).mockResolvedValue({ id: "c-1" } as never);
    vi.mocked(prisma.ticket.update).mockResolvedValue({} as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);
    await service.addComment("t-1", { body: "On it", isInternal: false }, orgIds, actorId, "SUPPORT_AGENT");
    expect(prisma.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ firstResponseAt: expect.any(Date) }) }),
    );
  });

  it("does not set firstResponseAt for internal notes", async () => {
    vi.mocked(prisma.ticket.findFirst).mockResolvedValue({ id: "t-1", firstResponseAt: null } as never);
    vi.mocked(prisma.ticketComment.create).mockResolvedValue({ id: "c-1" } as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);
    await service.addComment("t-1", { body: "checking backend", isInternal: true }, orgIds, actorId, "SUPPORT_AGENT");
    expect(prisma.ticket.update).not.toHaveBeenCalled();
  });
});

describe("TicketsService.assign", () => {
  it("rejects an assignee outside the caller's scope", async () => {
    vi.mocked(prisma.ticket.findFirst).mockResolvedValue({ id: "t-1", priority: "MEDIUM" } as never);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null as never);
    await expect(service.assign("t-1", "user-x", orgIds, actorId)).rejects.toBeInstanceOf(AppError);
  });
});
