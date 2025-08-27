interface SalesforceIconProps {
  className?: string;
}

export default function SalesforceIcon({ className = "w-4 h-4" }: SalesforceIconProps) {
  return (
    <img
      src="https://i.imgur.com/wx54tHB.png"
      alt="Salesforce"
      className={className}
      style={{ objectFit: 'cover' }}
    />
  );
}