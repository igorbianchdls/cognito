import DashboardViewerClient from "@/components/dashboards/DashboardViewerClient";

export default function DashboardViewPage({ params }: { params: { id: string } }) {
  const id = params?.id;
  return (
    <DashboardViewerClient id={id} />
  );
}
