import PasteBinSession from '../components/PasteBinSession';

export default async function PasteBinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PasteBinSession id={id} />;
}
