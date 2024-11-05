'use client'
import ManageHeader from '../ManageHeader'
import AddFriend from './AddFriend';
import React, { useState } from 'react';
function FriendsContainer() {
    const [isModalOpen, setModalOpen] = useState(false);

    const openModal = () => {
        setModalOpen(true)
    };
  return (
    <div>
    <ManageHeader 
        title="Friends"
        buttons={[
            { label: "Add Friend", primary: true, onClick: openModal },
        ]}
    />
    <AddFriend isOpen={isModalOpen} closeModal={() => setModalOpen(false)} />
    </div>
  )
}

export default FriendsContainer

