export default function Spinner({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className={`animate-spin rounded-full border-[3px] border-primary-600/20 border-t-primary-600 dark:border-primary-400/20 dark:border-t-primary-400 ${className}`} />
    </div>
  );
}
