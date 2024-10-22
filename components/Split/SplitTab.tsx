import React from 'react';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import EqualSplit from './EqualSplit';
import PercentageSplit from './PercentageSplit';
import WeightSplit from './WeightSplit';
import ExtraSplit from './ExtraSplit';
import ManualSplit from './ManualSplit';

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
                <TabPanel><PercentageSplit/></TabPanel>
                <TabPanel><WeightSplit/></TabPanel>
                <TabPanel><ExtraSplit/></TabPanel>
                <TabPanel><ManualSplit/></TabPanel>
            </TabPanels>
        </TabGroup>
    );
};

export default SplitTab;
