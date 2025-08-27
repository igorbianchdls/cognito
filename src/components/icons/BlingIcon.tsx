interface BlingIconProps {
  className?: string;
}

export default function BlingIcon({ className = "w-4 h-4" }: BlingIconProps) {
  return (
    <img
      src="https://i.imgur.com/zrNsw6k.png"
      alt="Bling"
      className={className}
      style={{ objectFit: 'cover' }}
    />
  );
}