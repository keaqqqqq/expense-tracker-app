// app/settings/page.tsx
import { cookies } from 'next/headers'
import Settings from '@/components/Settings';
import { fetchUserData } from '@/lib/actions/user.action';
async function SettingsPage() {
  const cookiesStore = cookies();
  const uid = cookiesStore.get('currentUserUid')?.value;
  
  if (!uid) {
    return null;
  }

  try {
    const userData = await fetchUserData(uid);
    
    const initialUserData = {
      id: uid,
      name: userData?.name || '',
      email: userData?.email || '',
      image: userData?.image || null
    };

    return <Settings initialUserData={initialUserData} />;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export default SettingsPage;