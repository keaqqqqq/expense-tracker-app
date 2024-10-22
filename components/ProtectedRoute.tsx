
import React from 'react'
// import SideNav from './Sidebar'
import Sidebar from './Sidebar'
import TopBar from './Topbar'
import Main from './Main'

export default function ProtectedRoute(props) {
    const {children} = props;
    return (
        <Main>
            <Sidebar/>
            <div className="flex flex-col flex-1 ml-64"> {/* Margin matches sidebar width */}
                <TopBar username={"username"} onSearch={()=>console.log('fish')} />
                <div className="p-4 flex-1  p-4 sm:p-8">
                   {children}
                </div>
            </div>
        </Main>
    )
}
