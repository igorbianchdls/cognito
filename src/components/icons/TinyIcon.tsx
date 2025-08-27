interface TinyIconProps {
  className?: string;
}

export default function TinyIcon({ className = "w-4 h-4" }: TinyIconProps) {
  return (
    <img
      src="https://i.imgur.com/HJ0pWrw.png"
      alt="Tiny ERP"
      className={className}
      style={{ objectFit: 'cover' }}
    />
  );
}