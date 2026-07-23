interface AvatarProps {
  imageUrl: string | null;
  name: string;
  size?: 'sm' | 'md';
}

export function Avatar({ imageUrl, name, size = 'md' }: AvatarProps) {
  const sizeClass = size === 'sm' ? 'size-8' : 'size-10';
  if (imageUrl) {
    return (
      <img
        className={`${sizeClass} rounded-full bg-surface-subtle`}
        src={imageUrl}
        alt=""
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <span
      className={`grid ${sizeClass} place-items-center rounded-full bg-primary-subtle text-sm font-semibold text-primary-emphasis`}
      aria-hidden="true"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
