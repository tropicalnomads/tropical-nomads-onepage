interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps): JSX.Element {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-center text-ozora-cream/90">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-ozora-cream/70">{description}</p>
    </div>
  );
}
