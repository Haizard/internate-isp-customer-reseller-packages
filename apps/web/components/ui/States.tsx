import { Icon } from "../ui/Icon";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="glass rounded-lg p-8 flex flex-col items-center justify-center text-text-tertiary gap-2">
      <div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
      <p className="text-footnote">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="glass rounded-lg p-8 flex flex-col items-center justify-center text-text-tertiary gap-2">
      <Icon name="alert" size={26} className="text-accent-red" />
      <p className="text-footnote text-accent-red">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-footnote text-accent-blue font-semibold mt-1">
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="glass rounded-lg p-8 text-center text-text-tertiary">
      <Icon name="box" size={28} className="mx-auto mb-2" />
      <p className="text-footnote">{label}</p>
    </div>
  );
}
