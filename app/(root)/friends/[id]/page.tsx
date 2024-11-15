import React from 'react'
import ExpenseCard from '@/components/ExpenseCard'
import { fetchUserData } from '@/lib/actions/user.action'
import ExpenseList from '@/components/ExpenseList'
interface Props {
  params: {
    id: string;
  }
}

// Define the expected shape of user data
interface UserData {
  name: string;
  image?: string;
  // Add other fields as needed
}

async function FriendDetails({ params }: Props) {
  if (!params.id) {
    return <div>Error: Missing user ID</div>;
  }

  try {
    const userData = await fetchUserData(params.id);
    
    if (!userData) {
      return <div>Error: User not found</div>;
    }

    return (
      <div>
      <ExpenseCard  
        name={userData.name}
        amount={-50} 
        type="user"
        avatarUrl={userData.image || '/default-avatar.jpg'}
      />
      <ExpenseList />
      </div>
    );
  } catch (error) {
    console.error('Error fetching user data:', error);
    return <div>Error: {error instanceof Error ? error.message : 'Failed to load user data'}</div>;
  }
}

export default FriendDetails;