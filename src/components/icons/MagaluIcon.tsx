interface MagaluIconProps {
  className?: string;
}

export default function MagaluIcon({ className = "w-4 h-4" }: MagaluIconProps) {
  return (
    <img
      src="https://i.imgur.com/fJv8YCb.png"
      alt="Magazine Luiza"
      className={className}
      style={{ objectFit: 'cover' }}
    />
  );
}