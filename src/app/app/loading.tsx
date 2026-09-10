export default function AppLoading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="bg-muted h-7 w-48 animate-pulse rounded" />
      <div className="bg-muted h-4 w-full max-w-md animate-pulse rounded" />
      <div className="bg-muted h-24 w-full animate-pulse rounded-md" />
      <div className="bg-muted h-24 w-full animate-pulse rounded-md" />
    </div>
  );
}
