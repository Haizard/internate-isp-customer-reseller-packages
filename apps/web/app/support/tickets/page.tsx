"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
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
import { formatDate } from "@/lib/format";

interface UserBrief {
  id: string;
  name: string;
}

interface Comment {
  id: string;
  body: string;
  authorRole: string;
  isInternal: boolean;
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  source: string;
  entityType: string | null;
  entityId: string | null;
  assigneeId: string | null;
  assignee?: UserBrief | null;
  requester?: UserBrief | null;
  slaResolveBy: string | null;
  comments?: Comment[];
  createdAt: string;
}

interface CustomerBrief {
  id: string;
  name: string;
  phone: string;
}

const STATUSES = ["OPEN", "IN_PROGRESS", "PENDING_CUSTOMER", "RESOLVED", "CLOSED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function SupportTicketsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SupportTicketsWorkspace />
    </Suspense>
  );
}

function SupportTicketsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tickets = useApi<Ticket[]>("/tickets");
  const agents = useApi<UserBrief[]>("/users");
  const customers = useApi<CustomerBrief[]>("/customers");

  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(searchParams?.get("id") ?? null);
  const [detail, setDetail] = useState<Ticket | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [linkCustomer, setLinkCustomer] = useState("");

  const [commentBody, setCommentBody] = useState("");
  const [internalNote, setInternalNote] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return (tickets.data ?? []).filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.subject.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q) ||
          (t.assignee?.name ?? "").toLowerCase().includes(q) ||
          (t.requester?.name ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tickets.data, statusFilter, priorityFilter, search]);

  useEffect(() => {
    if (detailId) {
      api.get<Ticket>(`/tickets/${detailId}`).then(setDetail).catch(() => setDetail(null));
    } else {
      setDetail(null);
    }
  }, [detailId]);

  const priorityLabel = (p: string) => p.charAt(0) + p.slice(1).toLowerCase();

  async function createTicket() {
    setBusy(true);
    setError(null);
    try {
      await api.post("/tickets", {
        subject,
        description: description || undefined,
        priority,
        ...(linkCustomer ? { entityType: "Customer", entityId: linkCustomer } : {}),
      });
      setNewOpen(false);
      setSubject("");
      setDescription("");
      setPriority("MEDIUM");
      setLinkCustomer("");
      tickets.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setBusy(false);
    }
  }

  async function updateDetail(patch: Partial<Ticket>) {
    if (!detailId) return;
    await api.patch(`/tickets/${detailId}`, patch);
    const updated = await api.get<Ticket>(`/tickets/${detailId}`);
    setDetail(updated);
    tickets.reload();
  }

  async function assign(assigneeId: string | null) {
    if (!detailId) return;
    await api.post(`/tickets/${detailId}/assign`, { assigneeId });
    const updated = await api.get<Ticket>(`/tickets/${detailId}`);
    setDetail(updated);
    tickets.reload();
  }

  async function addComment() {
    if (!detailId || !commentBody.trim()) return;
    await api.post(`/tickets/${detailId}/comments`, { body: commentBody, isInternal: internalNote });
    setCommentBody("");
    setInternalNote(false);
    const updated = await api.get<Ticket>(`/tickets/${detailId}`);
    setDetail(updated);
  }

  if (tickets.loading || agents.loading || customers.loading) return <LoadingState />;
  if (tickets.error || agents.error || customers.error)
    return <ErrorState message={tickets.error ?? agents.error ?? customers.error ?? "Error"} />;

  const allTickets = tickets.data ?? [];

  return (
    <div>
      <PageHeader
        title="Tickets"
        subtitle={`${allTickets.length} tickets across all resellers`}
        action={
          <Button onClick={() => setNewOpen(true)}>
            <Icon name="plus" size={18} />
            <span className="hidden sm:inline">New Ticket</span>
          </Button>
        }
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search tickets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-[44px] px-4 rounded-md bg-white/70 border border-white/60 text-callout text-text-primary outline-none focus:border-accent-blue focus:ring-4 focus:ring-accent-blue/15"
          />
        </div>
        <select
          className="h-[44px] px-3 rounded-md bg-white/70 border border-white/60 text-callout text-text-primary outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{priorityLabel(s)}</option>
          ))}
        </select>
        <select
          className="h-[44px] px-3 rounded-md bg-white/70 border border-white/60 text-callout text-text-primary outline-none"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{priorityLabel(p)}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState label="No tickets match" />
      ) : (
        <Card className="p-1">
          {filtered.map((t, i) => (
            <div key={t.id} className={i > 0 ? "hairline" : ""}>
              <ListRow
                title={t.subject}
                subtitle={`${priorityLabel(t.priority)} · ${t.assignee?.name ?? "Unassigned"} · ${t.entityType ?? "General"}`}
                leading={
                  <div className="w-10 h-10 rounded-full bg-accent-orange/15 text-accent-orange flex items-center justify-center">
                    <Icon name="ticket" size={20} />
                  </div>
                }
                trailing={
                  <div className="flex items-center gap-2">
                    <StatusBadge status={t.status} />
                  </div>
                }
                onClick={() => {
                  setDetailId(t.id);
                  router.replace(`/support/tickets?id=${t.id}`);
                }}
              />
            </div>
          ))}
        </Card>
      )}

      <Sheet open={!!detailId} onClose={() => { setDetailId(null); router.replace("/support/tickets"); }} title={detail?.subject ?? "Ticket"}>
        {detail ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={detail.status} />
              <StatusBadge status={detail.priority} />
            </div>
            {detail.description && (
              <p className="text-callout text-text-secondary">{detail.description}</p>
            )}

            <div>
              <label className="block text-footnote font-medium text-text-secondary mb-1.5">Status</label>
              <select
                className="w-full h-[44px] px-3 rounded-md bg-white/70 border border-white/60 text-callout outline-none"
                value={detail.status}
                onChange={(e) => updateDetail({ status: e.target.value as Ticket["status"] })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{priorityLabel(s)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-footnote font-medium text-text-secondary mb-1.5">Assignee</label>
              <select
                className="w-full h-[44px] px-3 rounded-md bg-white/70 border border-white/60 text-callout outline-none"
                value={detail.assigneeId ?? ""}
                onChange={(e) => assign(e.target.value || null)}
              >
                <option value="">Unassigned</option>
                {(agents.data ?? []).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {detail.entityType && (
              <div className="glass rounded-lg p-3">
                <p className="text-caption text-text-tertiary">Linked entity</p>
                <p className="text-body font-semibold">{detail.entityType}: {detail.entityId}</p>
              </div>
            )}

            <div className="space-y-2">
              {(detail.comments ?? []).map((c) => (
                <div key={c.id} className={`rounded-lg p-3 ${c.isInternal ? "bg-accent-orange/10" : "bg-white/60"}`}>
                  <p className="text-caption text-text-tertiary">
                    {c.authorRole.toLowerCase().replace("_", " ")} · {formatDate(c.createdAt)}
                    {c.isInternal && " · internal"}
                  </p>
                  <p className="text-callout mt-1">{c.body}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Field
                label="Reply / internal note"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Write a message…"
              />
              <label className="flex items-center gap-2 text-footnote text-text-secondary">
                <input type="checkbox" checked={internalNote} onChange={(e) => setInternalNote(e.target.checked)} />
                Internal note (hidden from customer)
              </label>
              <Button fullWidth onClick={addComment} disabled={busy || !commentBody.trim()}>
                Add message
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-footnote text-text-tertiary py-6 text-center">Ticket not found</p>
        )}
      </Sheet>

      <Sheet open={newOpen} onClose={() => setNewOpen(false)} title="New Ticket">
        <div className="space-y-4">
          <Field label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What is the issue?" />
          <Field label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add context…" />
          <div>
            <label className="block text-footnote font-medium text-text-secondary mb-1.5">Priority</label>
            <select
              className="w-full h-[44px] px-3 rounded-md bg-white/70 border border-white/60 text-callout outline-none"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{priorityLabel(p)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-footnote font-medium text-text-secondary mb-1.5">Link customer (optional)</label>
            <select
              className="w-full h-[44px] px-3 rounded-md bg-white/70 border border-white/60 text-callout outline-none"
              value={linkCustomer}
              onChange={(e) => setLinkCustomer(e.target.value)}
            >
              <option value="">No customer — general ticket</option>
              {(customers.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-footnote text-accent-red">{error}</p>}
          <Button fullWidth onClick={createTicket} disabled={busy || !subject.trim()}>
            Create ticket
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
