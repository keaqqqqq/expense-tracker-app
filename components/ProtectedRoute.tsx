'use client'
import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './Topbar';
import Main from './Main';

interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    return (
        <Main>
            <Sidebar />
            <div className="flex flex-col flex-1 ml-64"> {/* Margin matches sidebar width */}
                <TopBar username="username" onSearch={() => console.log('fish')} />
                <div className="p-4 flex-1 sm:p-8">
                    {children}
                </div>
            </div>
        </Main>
    );
}

export default ProtectedRoute;
