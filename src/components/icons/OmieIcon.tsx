interface OmieIconProps {
  className?: string;
}

export default function OmieIcon({ className = "w-4 h-4" }: OmieIconProps) {
  return (
    <img
      src="https://i.imgur.com/zyjweZx.png"
      alt="Omie"
      className={className}
      style={{ objectFit: 'cover' }}
    />
  );
}