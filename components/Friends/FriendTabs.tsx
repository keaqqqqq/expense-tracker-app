'use client'
import React, { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FriendTabsProps {
  allContent: ReactNode;
  owesYouContent: ReactNode;
  youOweContent: ReactNode;
  allCount?: number;
  owesYouCount?: number;
  youOweCount?: number;
}

const FriendTabs = ({
  allContent,
  owesYouContent,
  youOweContent,
  allCount = 0,
  owesYouCount = 0,
  youOweCount = 0
}: FriendTabsProps) => {
  return (
    <div className="w-full flex flex-col items-center mt-4">
      <Tabs defaultValue="all" className="w-full max-w-12xl">
        <div className="flex justify-center mb-4">
          <TabsList className="grid w-full max-w-[500px] grid-cols-3 gap-1 p-1 bg-zinc-200 dark:bg-zinc-800/80 rounded-lg h-10">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm rounded-md transition-all duration-200 px-3 py-1.5 h-8"
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                All
                {allCount > 0 && (
                  <span className="text-xs bg-zinc-200/80 dark:bg-zinc-600/80 px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                    {allCount}
                  </span>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="owes-you" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm rounded-md transition-all duration-200 px-3 py-1.5 h-8"
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <span className="whitespace-nowrap">Owes you</span>
                {owesYouCount > 0 && (
                  <span className="text-xs bg-zinc-200/80 dark:bg-zinc-600/80 px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                    {owesYouCount}
                  </span>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="you-owe" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm rounded-md transition-all duration-200 px-3 py-1.5 h-8"
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <span className="whitespace-nowrap">You owe</span>
                {youOweCount > 0 && (
                  <span className="text-xs bg-zinc-200/80 dark:bg-zinc-600/80 px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                    {youOweCount}
                  </span>
                )}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="">
          <TabsContent value="all" className="m-0 p-4">
            {allContent}
          </TabsContent>

          <TabsContent value="owes-you" className="m-0 p-4">
            {owesYouContent}
          </TabsContent>

          <TabsContent value="you-owe" className="m-0 p-4">
            {youOweContent}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default FriendTabs;