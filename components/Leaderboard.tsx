'use client'
 
 import React, { useEffect } from 'react'
 import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
 interface User {
     name: string;
     image: string;
     expensesCreated: number;
     settledRatio: number;
     totalPoint: number;
 }
 import { HelpCircle } from 'lucide-react';
 interface LeaderboardProps {
     users: User[];
 }
 
 export const Leaderboard = ({ users }: LeaderboardProps) => {
     const sortedUsers = [...users].sort((a, b) => b.totalPoint - a.totalPoint);
 
     const ranking: { [key: number]: string } = {};
     ranking[1] = '🥇';
     ranking[2] = '🥈';
     ranking[3] = '🥉';
     
    
     return (
         <Table>
             <TableHeader>
                 <TableRow>
                     <TableHead>#</TableHead>
                     <TableHead>Name</TableHead>
                     <TableHead>
                         <div className='flex gap-3'>
                             Expenses Created
                             <div>
                             <HelpCircle className="h-4 w-4">
                                 <title>The point is calculated based on the number of expenses that are created.</title>
                             </HelpCircle>
                             </div>
                         </div>
                     </TableHead>
                     <TableHead>
                         <div className='flex gap-3'>
                             Expenses Settled Ratio
                             <div>
                             <HelpCircle className="h-4 w-4">
                                 <title>The point is calculated based on the number of expenses that are settled.</title>
                             </HelpCircle>
                             </div>
                         </div>
                     </TableHead>
                     <TableHead>
                         <div className='flex gap-3'>
                             Total Point
                             <div>
                             <HelpCircle className="h-4 w-4">
                                 <title>The total points are calculated by multiplying the number of expenses created by the number of expenses settled.</title>
                             </HelpCircle>
                             </div>
                         </div>
                     </TableHead>
                 </TableRow>
             </TableHeader>
             <TableBody>
                 {sortedUsers.map((user, index) => (
                     <TableRow key={user.name + index}>
                         <TableCell>
                             {(index + 1) === 1 || (index + 1) === 2 || (index + 1) === 3
                             ? ranking[index+1]
                             : index + 1
                             }
                         </TableCell>
                         <TableCell>
                             <div className='flex gap-3'>
                                 <img src={user.image} alt="user image" className='rounded-full w-5 h-5'/>
                                 {user.name}
                             </div>
                         </TableCell>
                         <TableCell>{user.expensesCreated}</TableCell>
                         <TableCell>{user.settledRatio}</TableCell>
                         <TableCell>{user.totalPoint}</TableCell>
                     </TableRow>
                 ))}
             </TableBody>
         </Table>
     )
 }