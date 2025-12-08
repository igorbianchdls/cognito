import DashboardViewerClient from "@/components/dashboards/DashboardViewerClient";

type ApiResponse = { success: true; item: { id: string; title: string; description: string | null; sourcecode: string } } | { success: false; error: string };

export default async function DashboardViewPage({ params }: { params: { id: string } }) {
  const id = params?.id;
  if (!id) {
    return <div className="min-h-screen p-6"><div className="p-4 bg-white border rounded">Dashboard não encontrado.</div></div>;
  }

  let data: ApiResponse;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/dashboards/${id}`, { cache: 'no-store' });
    data = await res.json();
  } catch (e) {
    return <div className="min-h-screen p-6"><div className="p-4 bg-red-50 border border-red-200 rounded">Falha ao carregar: {(e as Error).message}</div></div>;
  }

  if (!('success' in data) || !data.success) {
    return <div className="min-h-screen p-6"><div className="p-4 bg-red-50 border border-red-200 rounded">{('error' in data && data.error) ? data.error : 'Erro desconhecido'}</div></div>;
  }

  const { item } = data;
  return (
    <DashboardViewerClient title={item.title} description={item.description} sourcecode={item.sourcecode} />
  );
}
