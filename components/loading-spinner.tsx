type LoadingSpinnerProps = {
  label: string;
};

export default function LoadingSpinner({ label }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-white px-6 py-10 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-500 dark:border-amber-900/40 dark:border-t-amber-400"
        aria-hidden="true"
      />
      <p className="text-sm text-zinc-700 dark:text-zinc-300">{label}</p>
    </div>
  );
}
