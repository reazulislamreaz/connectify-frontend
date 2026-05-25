interface ProfileDetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function ProfileDetailRow({ icon, label, value }: ProfileDetailRowProps) {
  if (!value?.trim()) return null;

  return (
    <div className="flex min-w-0 gap-3 overflow-hidden rounded-xl bg-wa-panel/60 px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        {icon}
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 break-all text-sm font-medium text-slate-800 [overflow-wrap:anywhere]">
          {value}
        </p>
      </div>
    </div>
  );
}
