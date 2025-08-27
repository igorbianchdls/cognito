interface TotvsIconProps {
  className?: string;
}

export default function TotvsIcon({ className = "w-4 h-4" }: TotvsIconProps) {
  return (
    <img
      src="https://i.imgur.com/3bXA0Fh.png"
      alt="TOTVS"
      className={className}
      style={{ objectFit: 'cover' }}
    />
  );
}