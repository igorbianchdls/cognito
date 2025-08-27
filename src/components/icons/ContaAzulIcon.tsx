interface ContaAzulIconProps {
  className?: string;
}

export default function ContaAzulIcon({ className = "w-4 h-4" }: ContaAzulIconProps) {
  return (
    <img
      src="https://i.imgur.com/Se4xr90.png"
      alt="ContaAzul"
      className={className}
      style={{ objectFit: 'cover' }}
    />
  );
}