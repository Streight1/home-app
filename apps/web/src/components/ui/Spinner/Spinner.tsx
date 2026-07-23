export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <span
      className={`${size === 'sm' ? 'size-4 border-2' : 'size-7 border-[3px]'} block animate-spin rounded-full border-primary-soft border-t-primary motion-reduce:animate-none`}
      aria-hidden="true"
    />
  );
}
