import { redirect } from "next/navigation"

export default async function ErpAirtableSchemaRedirectPage({
  params,
}: {
  params: Promise<{ schemaId: string }>
}) {
  const { schemaId } = await params
  redirect(`/airtable/${schemaId}`)
}
