import SquadClient from "@/components/SquadClient";

export default function SquadPage({ params }: { params: { squadId: string } }) {
  return <SquadClient squadId={params.squadId} />;
}
