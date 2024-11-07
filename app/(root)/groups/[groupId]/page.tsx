// app/groups/[uid]/[groupId]/page.tsx
import { getGroupDetails } from '@/lib/actions/user.action';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface GroupDetailsPageProps {
  params: {
    uid: string;
    groupId: string;
  }
}

export default async function GroupDetailsPage({ params }: GroupDetailsPageProps) {
  const cookieStore = cookies();
  const uid = cookieStore.get('currentUserUid')?.value;

  if (!uid) {
    redirect('/auth');
  }

  try {
    const group = await getGroupDetails(params.groupId);

    if (!group) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Group not found</h2>
            <p className="mt-2 text-gray-600">The group you're looking for doesn't exist.</p>
          </div>
        </div>
      );
    }

    return (
      <div></div>
    );
  } catch (error) {
    console.error('Error loading group details:', error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Error loading group</h2>
          <p className="mt-2 text-gray-600">Something went wrong while loading the group details.</p>
        </div>
      </div>
    );
  }
}