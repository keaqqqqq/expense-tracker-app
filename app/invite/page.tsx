import InviteHandler from '@/components/Friends/InviteHandler';
export default function InvitePage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  return <InviteHandler token={searchParams.token} />;
}