interface PipedriveIconProps {
  className?: string;
}

export default function PipedriveIcon({ className = "w-4 h-4" }: PipedriveIconProps) {
  return (
    <img
      src="https://i.imgur.com/3xpLWOk.png"
      alt="Pipedrive"
      className={className}
      style={{ objectFit: 'cover' }}
    />
  );
}