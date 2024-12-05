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
    <div className="w-full flex flex-col items-center mt-6">
      <Tabs defaultValue="all" className="w-full max-w-12xl">
        <div className="flex justify-center mb-6">
          <TabsList className="grid w-full max-w-[600px] grid-cols-3 gap-1 sm:gap-2 p-1 sm:p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl h-15">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 rounded-lg transition-all duration-200 px-2 sm:px-4 py-2"
            >
              <span className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                All
                {allCount > 0 && (
                  <span className="text-xs sm:text-xs bg-zinc-200 dark:bg-zinc-600 px-1 sm:px-2 py-0 sm:py-1 rounded-full min-w-[1.25rem] sm:min-w-[1.5rem] text-center">
                    {allCount}
                  </span>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="owes-you" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 rounded-lg transition-all duration-200 px-2 sm:px-4 py-2"
            >
              <span className="flex flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <span className="whitespace-nowrap text-center">Owes you</span>
                {owesYouCount > 0 && (
                  <span className="text-xs sm:text-xs bg-zinc-200 dark:bg-zinc-600 px-1.5 sm:px-2 py-0 sm:py-1 rounded-full min-w-[1.25rem] sm:min-w-[1.5rem] text-center">
                    {owesYouCount}
                  </span>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="you-owe" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 rounded-lg transition-all duration-200 px-2 sm:px-4 py-2"
            >
              <span className="flex flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <span className="whitespace-nowrap text-center">You owe</span>
                {youOweCount > 0 && (
                  <span className="text-xs sm:text-xs bg-zinc-200 dark:bg-zinc-600 px-1.5 sm:px-2 py-0 sm:py-1 rounded-full min-w-[1.25rem] sm:min-w-[1.5rem] text-center">
                    {youOweCount}
                  </span>
                )}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="border rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 p-4">
          <TabsContent value="all" className="mt-0">
            {allContent}
          </TabsContent>

          <TabsContent value="owes-you" className="mt-0">
            {owesYouContent}
          </TabsContent>

          <TabsContent value="you-owe" className="mt-0">
            {youOweContent}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default FriendTabs;