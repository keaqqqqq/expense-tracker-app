import Sidebar from "@/components/Sidebar";
import { cookies } from "next/headers";
import TopBar from "@/components/Topbar";
import { fetchUserData } from "@/lib/actions/user.action";
import { UserData } from '@/types/User';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const uid = cookieStore.get('currentUserUid')?.value;

  let userData: UserData | null = null;

  if (uid) {
      try {
          userData = await fetchUserData(uid);
      } catch (error) {
          console.error("Error fetching user data:", error);
      }
  }

  return (
      <main className="flex h-screen w-full font-inter">
          <Sidebar  name={userData?.name || null} image={userData?.image || null}/>
          <div className="flex flex-col flex-1 md:ml-64">
              <div className="hidden md:block">
                  <TopBar name={userData?.name || null} image={userData?.image || null} />
              </div>
              <div className="p-4 flex-1 sm:p-8 mt-16 md:mt-0">
                  {children}
              </div>
          </div>
      </main>
  );
}