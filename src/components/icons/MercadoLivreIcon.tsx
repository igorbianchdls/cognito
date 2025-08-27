interface MercadoLivreIconProps {
  className?: string;
}

export default function MercadoLivreIcon({ className = "w-4 h-4" }: MercadoLivreIconProps) {
  return (
    <img
      src="https://i.imgur.com/1su5g81.png"
      alt="Mercado Livre"
      className={className}
      style={{ objectFit: 'cover' }}
    />
  );
}