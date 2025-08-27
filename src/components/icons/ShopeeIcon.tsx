interface ShopeeIconProps {
  className?: string;
}

export default function ShopeeIcon({ className = "w-4 h-4" }: ShopeeIconProps) {
  return (
    <img
      src="https://i.imgur.com/78eDz6W.png"
      alt="Shopee"
      className={className}
      style={{ objectFit: 'cover' }}
    />
  );
}