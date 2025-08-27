interface HubspotIconProps {
  className?: string;
}

export default function HubspotIcon({ className = "w-4 h-4" }: HubspotIconProps) {
  return (
    <img
      src="https://i.imgur.com/ukCpSXu.png"
      alt="HubSpot"
      className={className}
      style={{ objectFit: 'cover' }}
    />
  );
}