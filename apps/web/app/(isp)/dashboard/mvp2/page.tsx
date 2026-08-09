import { PageHeader } from "@/components/layout/PageHeader";

export default function Mvp2Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="MVP 2 gateway simulator"
        subtitle="Track the first cloud-side router adapter flow for profiles, status, and sessions."
      />

      <div className="rounded-2xl border border-white/60 bg-white/60 p-6 shadow-sm backdrop-blur">
        <p className="text-sm text-slate-600">
          The simulator is now available through the API and is ready for the next phase of enrollment and session state.
        </p>
      </div>
    </div>
  );
}
