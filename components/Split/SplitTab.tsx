import React from 'react';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import EqualSplit from './EqualSplit';
import PercentageSplit from './PercentageSplit';
import WeightSplit from './WeightSplit';
import ExtraSplit from './ExtraSplit';
import ManualSplit from './ManualSplit';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

const SplitTab: React.FC = () => {
    const tabClass = "flex-1 px-3 py-1 border focus:bg-blue-100 focus:outline-none focus:text-indigo-800";
    const expense = useSelector((state: RootState) => state.expenses.expense);

    return (
        <TabGroup>
            <div className="flex flex-col md:flex-row content-center justify-between items-center">
                <div className="my-auto">Split</div>
                <TabList className="border rounded w-full md:w-max flex mt-2 md:mt-0">
                    <Tab className={tabClass}>Equal</Tab>
                    <Tab className={tabClass}>%</Tab>
                    <Tab className={tabClass}>Weight</Tab>
                    <Tab className={tabClass}>+/-</Tab>
                    <Tab className={tabClass}>Manual</Tab>
                </TabList>
                <div className="my-auto">with</div>
            </div>
            <TabPanels>
                <TabPanel><EqualSplit expense={expense} /></TabPanel>
                <TabPanel><PercentageSplit expense={expense}/></TabPanel>
                <TabPanel><WeightSplit expense={expense}/></TabPanel>
                <TabPanel><ExtraSplit expense={expense}/></TabPanel>
                <TabPanel><ManualSplit expense={expense}/></TabPanel>
            </TabPanels>
        </TabGroup>
    );
};

export default SplitTab;
