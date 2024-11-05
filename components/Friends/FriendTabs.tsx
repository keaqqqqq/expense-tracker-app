'use client'
import React, { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface FriendTabsProps {
  allContent: ReactNode;
  nonZeroContent: ReactNode;
  owesYouContent: ReactNode;
  youOweContent: ReactNode;
  allCount?: number;
  nonZeroCount?: number;
  owesYouCount?: number;
  youOweCount?: number;
}

const FriendTabs = ({
  allContent,
  nonZeroContent,
  owesYouContent,
  youOweContent,
  allCount = 0,
  nonZeroCount = 0,
  owesYouCount = 0,
  youOweCount = 0
}: FriendTabsProps) => {
  return (
    <div className="w-full flex flex-col items-center mt-6">
      <Tabs defaultValue="all" className="w-full max-w-12xl">
        <div className="flex justify-center mb-6">
          <TabsList className="grid w-full max-w-[400px] grid-cols-4 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            <TabsTrigger 
              value="all" 
              className="relative data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 rounded-lg transition-all duration-200"
            >
              All
              {allCount > 0 && (
                <Badge variant="secondary" className="ml-1 absolute -top-2 -right-2 bg-zinc-200 dark:bg-zinc-600">
                  {allCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="non-zero" 
              className="relative data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 rounded-lg transition-all duration-200"
            >
              Non-zero
              {nonZeroCount > 0 && (
                <Badge variant="secondary" className="ml-1 absolute -top-2 -right-2 bg-zinc-200 dark:bg-zinc-600">
                  {nonZeroCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="owes-you" 
              className="relative data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 rounded-lg transition-all duration-200"
            >
              Owes you
              {owesYouCount > 0 && (
                <Badge variant="secondary" className="ml-1 absolute -top-2 -right-2 bg-zinc-200 dark:bg-zinc-600">
                  {owesYouCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="you-owe" 
              className="relative data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 rounded-lg transition-all duration-200"
            >
              You owe
              {youOweCount > 0 && (
                <Badge variant="secondary" className="ml-1 absolute -top-2 -right-2 bg-zinc-200 dark:bg-zinc-600">
                  {youOweCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="border rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 p-4">
          <TabsContent value="all" className="mt-0">
            {allContent}
          </TabsContent>

          <TabsContent value="non-zero" className="mt-0">
            {nonZeroContent}
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