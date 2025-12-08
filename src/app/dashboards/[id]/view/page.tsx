import DashboardViewerPanel from "@/components/dashboards/DashboardViewerPanel";

export default function DashboardViewPage({ params }: { params: { id: string } }) {
  const id = params?.id;
  return (
    <DashboardViewerPanel id={id} />
  );
}
