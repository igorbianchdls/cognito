export function ErpPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description: string
}) {
  return (
    <div>
      {eyebrow ? <div className="mb-2 text-xs font-medium uppercase tracking-normal text-gray-500">{eyebrow}</div> : null}
      <h1 className="text-2xl font-semibold tracking-normal text-gray-950">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">{description}</p>
    </div>
  )
}

