
import React from 'react'
// import SideNav from './Sidebar'
import Sidebar from './Sidebar'
import TopBar from './Topbar'

export default function Main(props) {
    const { children } = props
    return (
        <main className='flex-1 flex flex-col'>
        {children}
        </main>
    )
}
