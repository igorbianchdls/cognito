interface RdStationIconProps {
  className?: string;
}

export default function RdStationIcon({ className = "w-4 h-4" }: RdStationIconProps) {
  return (
    <img
      src="https://i.imgur.com/QQ4I8UP.png"
      alt="RD Station"
      className={className}
      style={{ objectFit: 'cover' }}
    />
  );
}