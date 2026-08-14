"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/lib/useApi";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { formatCents, formatDate } from "@/lib/format";

interface Customer {
  subscription?: {
    package?: { name: string; priceCents: number; currency: string; speedMbps: number };
    startedAt: string;
    renewsAt: string | null;
  } | null;
  status: string;
}

interface TicketComment {
  id: string;
  body: string;
  authorRole: string;
  isInternal: boolean;
  createdAt: string;
}

interface TicketView {
  id: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
  comments?: TicketComment[];
}

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function BillingPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <BillingWorkspace />
    </Suspense>
  );
}

function BillingWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, loading, error, reload } = useApi<Customer>("/customers/me");
  const requests = useApi<TicketView[]>("/customers/me/requests");

  const [newOpen, setNewOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(
    searchParams?.get("request") ?? null,
  );
  const [detail, setDetail] = useState<TicketView | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [createError, setCreateError] = useState<string | null>(null);

  const reloadDetail = useCallback(async (id: string) => {
    const updated = await api.get<TicketView>(`/customers/me/requests/${id}`);
    setDetail(updated);
    requests.reload();
  }, [requests]);

  useEffect(() => {
    if (!detailId) {
      setDetail(null);
      return;
    }
    api
      .get<TicketView>(`/customers/me/requests/${detailId}`)
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [detailId]);

  const pkg = data?.subscription?.package;
  const priorityLabel = (p: string) => p.charAt(0) + p.slice(1).toLowerCase();

  const sortedRequests = useMemo(
    () => [...(requests.data ?? [])].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [requests.data],
  );

  if (loading || requests.loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  async function requestUpgrade() {
    await api.post("/customers/me/requests", {
      type: "UPGRADE",
      subject: "Package upgrade request",
      description: "Please contact me about upgrading to a faster package.",
      priority: "MEDIUM",
    });
    requests.reload();
  }

  async function createSupportTicket() {
    setBusy(true);
    setCreateError(null);
    try {
      await api.post("/customers/me/requests", {
        type: "SUPPORT",
        subject,
        description,
        priority,
      });
      setNewOpen(false);
      setSubject("");
      setDescription("");
      setPriority("MEDIUM");
      requests.reload();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create request");
    } finally {
      setBusy(false);
    }
  }

  async function postReply() {
    if (!detailId || !reply.trim()) return;
    setBusy(true);
    try {
      await api.post(`/customers/me/requests/${detailId}/comments`, { body: reply });
      setReply("");
      await reloadDetail(detailId);
    } finally {
      setBusy(false);
    }
  }

  function closeDetail() {
    setDetailId(null);
    setDetail(null);
    setReply("");
    router.replace("/customer/billing");
  }

  return (
    <div>
      <PageHeader title="Billing" subtitle="Your package & payment status" />

      <Card className="p-5 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-footnote text-text-secondary">Current plan</p>
            <p className="text-title-1 font-bold">{pkg?.name ?? "No package"}</p>
            {pkg && (
              <p className="text-callout text-text-secondary mt-1">
                {pkg.speedMbps} Mbps · {formatCents(pkg.priceCents, pkg.currency)}/month
              </p>
            )}
          </div>
          <StatusBadge status={data?.status ?? "ACTIVE"} />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={requestUpgrade}>
            Request upgrade
          </Button>
          <Button onClick={() => setNewOpen(true)}>
            <Icon name="plus" size={18} />
            <span className="ml-1">Submit a request</span>
          </Button>
        </div>
      </Card>

      <Card className="p-1">
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <h2 className="text-title-3 font-semibold">My Requests</h2>
          <p className="text-footnote text-text-tertiary">
            {sortedRequests.length} total
          </p>
        </div>
        {sortedRequests.length === 0 ? (
          <EmptyState label="No requests yet" />
        ) : (
          sortedRequests.map((r, i) => (
            <div key={r.id} className={i > 0 ? "hairline" : ""}>
              <ListRow
                title={r.subject}
                subtitle={`${priorityLabel(r.priority)} · ${formatDate(r.createdAt)} · ${r.comments?.length ?? 0} replies`}
                leading={
                  <div className="w-9 h-9 rounded-full bg-[rgba(255,159,10,0.15)] text-accent-orange flex items-center justify-center">
                    <Icon name="ticket" size={18} />
                  </div>
                }
                trailing={<StatusBadge status={r.status} />}
                onClick={() => {
                  setDetailId(r.id);
                  router.replace(`/customer/billing?request=${r.id}`);
                }}
              />
            </div>
          ))
        )}
      </Card>

      <Sheet open={newOpen} onClose={() => setNewOpen(false)} title="Submit a request">
        <div className="space-y-4">
          <Field
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What's the issue?"
          />
          <div>
            <label className="block text-footnote font-medium text-text-secondary mb-1.5">
              Description
            </label>
            <textarea
              className="w-full min-h-[100px] px-4 py-3 rounded-md bg-white/70 border border-[rgba(10,132,255,0.2)] text-body text-text-primary placeholder:text-text-tertiary outline-none transition-[border-color,box-shadow] duration-[180ms] focus:border-accent-blue focus:ring-4 focus:ring-accent-blue/15"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any details the support team should know…"
            />
          </div>
          <div>
            <label className="block text-footnote font-medium text-text-secondary mb-1.5">
              Priority
            </label>
            <select
              className="w-full h-[44px] px-3 rounded-md bg-white/70 border border-white/60 text-callout outline-none"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {priorityLabel(p)}
                </option>
              ))}
            </select>
          </div>
          {createError && <p className="text-footnote text-accent-red">{createError}</p>}
          <Button fullWidth onClick={createSupportTicket} disabled={busy || !subject.trim()}>
            Submit request
          </Button>
        </div>
      </Sheet>

      <Sheet open={!!detailId} onClose={closeDetail} title={detail?.subject ?? "Request"}>
        {detail ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={detail.status} />
              <StatusBadge status={detail.priority} />
            </div>
            {detail.description && (
              <p className="text-callout text-text-secondary whitespace-pre-wrap">
                {detail.description}
              </p>
            )}

            <div className="space-y-2">
              <p className="text-footnote font-medium text-text-secondary">Conversation</p>
              {(detail.comments ?? []).length === 0 && (
                <p className="text-footnote text-text-tertiary">No replies yet</p>
              )}
              {(detail.comments ?? []).map((c) => (
                <div
                  key={c.id}
                  className={`rounded-lg p-3 ${
                    c.authorRole === "CUSTOMER" ? "bg-white/60" : "bg-accent-orange/10"
                  }`}
                >
                  <p className="text-caption text-text-tertiary">
                    {c.authorRole.toLowerCase().replace("_", " ")} · {formatDate(c.createdAt)}
                  </p>
                  <p className="text-callout mt-1 whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}
            </div>

            {detail.status !== "RESOLVED" && detail.status !== "CLOSED" && (
              <div className="space-y-2">
                <Field
                  label="Reply"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Add a follow-up message…"
                />
                <Button fullWidth onClick={postReply} disabled={busy || !reply.trim()}>
                  Send reply
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-footnote text-text-tertiary py-6 text-center">Request not found</p>
        )}
      </Sheet>
    </div>
  );
}
