import React from 'react';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import EqualSplit from './EqualSplit';

const SplitTab: React.FC = () => {
    const tabClass = "px-3 py-1 border focus:bg-blue-100 focus:outline-none focus:text-indigo-800";

    return (
        <TabGroup>
            <div className="flex flex-row content-center justify-between items-center">
                <div className="my-auto">Split</div>
                <TabList className="border rounded w-max justify-center">
                    <Tab className={tabClass}>Equal</Tab>
                    <Tab className={tabClass}>%</Tab>
                    <Tab className={tabClass}>Weight</Tab>
                    <Tab className={tabClass}>+/-</Tab>
                    <Tab className={tabClass}>Manual</Tab>
                </TabList>
                <div className="my-auto">with</div>
            </div>
            <TabPanels>
                <TabPanel><EqualSplit /></TabPanel>
                <TabPanel>Content 2</TabPanel>
                <TabPanel>Content 3</TabPanel>
                <TabPanel>Manual 3</TabPanel>
            </TabPanels>
        </TabGroup>
    );
};

export default SplitTab;
