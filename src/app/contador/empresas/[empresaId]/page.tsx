import { notFound } from "next/navigation";
import { PortalPage } from "@/products/portaldocontador/frontend/PortalPage";
export default async function Page({
  params,
}: {
  params: Promise<{ empresaId: string }>;
}) {
  const { empresaId } = await params;
  if (!/^[1-9]\d*$/.test(empresaId) || !Number.isSafeInteger(Number(empresaId)))
    notFound();
  return <PortalPage companyId={Number(empresaId)} />;
}
