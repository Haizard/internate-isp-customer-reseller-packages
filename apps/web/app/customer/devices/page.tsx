"use client";

import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { Icon } from "@/components/ui/Icon";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { relativeTime } from "@/lib/format";

interface Device {
  id: string;
  macAddress: string;
  deviceName: string | null;
  lastSeenAt: string | null;
}

export default function DevicesPage() {
  const { data, loading, error, reload } = useApi<Device[]>("/customers/me/devices");

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const devices = data ?? [];

  return (
    <div>
      <PageHeader title="Connected Devices" subtitle="Devices on your network" />

      {devices.length === 0 ? (
        <EmptyState label="No devices connected" />
      ) : (
        <Card className="p-1">
          {devices.map((d, i) => (
            <div key={d.id} className={i > 0 ? "hairline" : ""}>
              <ListRow
                title={d.deviceName ?? "Unknown device"}
                subtitle={d.macAddress}
                leading={
                  <div className="w-10 h-10 rounded-full bg-[rgba(64,200,224,0.15)] text-accent-teal flex items-center justify-center">
                    <Icon name="eye" size={20} />
                  </div>
                }
                trailing={
                  <span className="text-footnote text-accent-green font-medium">
                    online · {relativeTime(d.lastSeenAt)}
                  </span>
                }
              />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
