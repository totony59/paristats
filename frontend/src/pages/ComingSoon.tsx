export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold text-slate-50">{title}</h1>
      <p className="text-sm text-slate-400">
        Cette page sera construite dans une prochaine étape.
      </p>
    </div>
  );
}
