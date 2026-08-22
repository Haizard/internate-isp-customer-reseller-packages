"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getStoredUser, logout } from "@/lib/auth";

export default function SettingsPage() {
  const user = getStoredUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function changePassword() {
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setMsg("Password changed successfully! Please sign in again with your new password.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account settings" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="users" size={18} className="text-accent-blue" />
            <h2 className="text-title-3 font-semibold">Account</h2>
          </div>
          <div className="space-y-3">
            <div className="glass rounded-lg p-3">
              <p className="text-caption text-text-tertiary">Name</p>
              <p className="text-body font-semibold">{user?.name ?? "—"}</p>
            </div>
            <div className="glass rounded-lg p-3">
              <p className="text-caption text-text-tertiary">Email</p>
              <p className="text-body font-semibold">{user?.email ?? "—"}</p>
            </div>
            <div className="glass rounded-lg p-3">
              <p className="text-caption text-text-tertiary">Role</p>
              <p className="text-body font-semibold">{user?.role?.replace("_", " ") ?? "—"}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="router" size={18} className="text-accent-orange" />
            <h2 className="text-title-3 font-semibold">Change Password</h2>
          </div>
          <div className="space-y-4">
            <Field
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
            <Field
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
            <Field
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
            />
            {msg && <p className="text-footnote text-accent-green">{msg}</p>}
            {error && <p className="text-footnote text-accent-red">{error}</p>}
            <Button
              fullWidth
              onClick={changePassword}
              disabled={busy || !currentPassword || !newPassword || !confirmPassword}
            >
              {busy ? "Changing…" : "Change Password"}
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-5 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="alert" size={18} className="text-accent-red" />
          <h2 className="text-title-3 font-semibold">Sign Out</h2>
        </div>
        <p className="text-callout text-text-secondary mb-4">
          Sign out of your account on this device.
        </p>
        <Button variant="destructive" onClick={logout}>
          Sign Out
        </Button>
      </Card>
    </div>
  );
}
