import { notFound } from "next/navigation";
import { PortalPage } from "@/products/portaldocontador/frontend/PortalPage";
import {
  PORTAL_SECTIONS,
  type PortalSection,
} from "@/products/portaldocontador/shared/contracts";
export default async function Page({
  params,
}: {
  params: Promise<{ empresaId: string; secao: string }>;
}) {
  const { empresaId, secao } = await params;
  if (
    !/^[1-9]\d*$/.test(empresaId) ||
    !Number.isSafeInteger(Number(empresaId)) ||
    !PORTAL_SECTIONS.includes(secao as PortalSection)
  )
    notFound();
  return (
    <PortalPage
      companyId={Number(empresaId)}
      section={secao as PortalSection}
    />
  );
}
