type BankLogoProps = {
  className?: string
}

type BankLogoConfig = {
  label: string
  bg: string
  color?: string
  accent?: string
  compact?: string
}

function BankLogo({
  className = 'w-8 h-8',
  label,
  bg,
  color = '#ffffff',
  accent,
  compact,
}: BankLogoProps & BankLogoConfig) {
  const display = compact || label
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={`${label} logo`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="64" height="64" rx="14" fill={bg} />
      {accent ? <path d="M12 46h40" stroke={accent} strokeWidth="5" strokeLinecap="round" /> : null}
      <text
        x="32"
        y="35"
        fill={color}
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize={display.length > 7 ? 11 : display.length > 4 ? 13 : 16}
        fontWeight="800"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {display}
      </text>
    </svg>
  )
}

export function ItauIcon(props: BankLogoProps) {
  return <BankLogo {...props} label="Itaú" compact="itau" bg="#ff7900" color="#163f8f" />
}

export function BradescoIcon(props: BankLogoProps) {
  return <BankLogo {...props} label="Bradesco" compact="bradesco" bg="#cc092f" />
}

export function BancoDoBrasilIcon(props: BankLogoProps) {
  return <BankLogo {...props} label="Banco do Brasil" compact="BB" bg="#f8db00" color="#0038a8" />
}

export function SantanderIcon(props: BankLogoProps) {
  return <BankLogo {...props} label="Santander" compact="santander" bg="#e60000" />
}

export function CaixaIcon(props: BankLogoProps) {
  return <BankLogo {...props} label="Caixa" compact="CAIXA" bg="#005ca9" accent="#f39200" />
}

export function NubankIcon(props: BankLogoProps) {
  return <BankLogo {...props} label="Nubank" compact="nu" bg="#820ad1" />
}

export function BancoInterIcon(props: BankLogoProps) {
  return <BankLogo {...props} label="Inter" compact="inter" bg="#ff7a00" />
}

export function BtgPactualIcon(props: BankLogoProps) {
  return <BankLogo {...props} label="BTG Pactual" compact="BTG" bg="#111827" />
}

export function C6BankIcon(props: BankLogoProps) {
  return <BankLogo {...props} label="C6 Bank" compact="C6" bg="#242424" accent="#c6a76f" />
}

export function SafraIcon(props: BankLogoProps) {
  return <BankLogo {...props} label="Safra" compact="safra" bg="#003c71" />
}

export function SicoobIcon(props: BankLogoProps) {
  return <BankLogo {...props} label="Sicoob" compact="sicoob" bg="#00a091" />
}

export function SicrediIcon(props: BankLogoProps) {
  return <BankLogo {...props} label="Sicredi" compact="sicredi" bg="#1d7f37" />
}

export function BanrisulIcon(props: BankLogoProps) {
  return <BankLogo {...props} label="Banrisul" compact="banrisul" bg="#004b93" />
}

export function MercadoPagoIcon(props: BankLogoProps) {
  return <BankLogo {...props} label="Mercado Pago" compact="MP" bg="#00b1ea" />
}

export function PicPayIcon(props: BankLogoProps) {
  return <BankLogo {...props} label="PicPay" compact="PicPay" bg="#11c76f" />
}
