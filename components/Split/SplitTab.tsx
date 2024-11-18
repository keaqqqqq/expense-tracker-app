import React, { useEffect, useState } from 'react';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import EqualSplit from './EqualSplit';
import PercentageSplit from './PercentageSplit';
import WeightSplit from './WeightSplit';
import ExtraSplit from './ExtraSplit';
import ManualSplit from './ManualSplit';
import { useExpense } from '@/context/ExpenseContext';

const SplitTab: React.FC = () => {
    const tabClass = "flex-1 px-3 py-1 border ";
    const selectedTabClass = "bg-blue-100 outline-none text-indigo-800";
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { expense, setSplitPreference} = useExpense();
    useEffect(() => {
        switch (expense.split_preference) {
            case 'equal':
                setSelectedIndex(0);
                break;
            case 'percentage':
                setSelectedIndex(1);
                break;
            case 'weight':
                setSelectedIndex(2);
                break;
            case 'extra':
                setSelectedIndex(3);
                break;
            case 'manual':
                setSelectedIndex(4);
                break;
            default:
                setSelectedIndex(0); // Default to the first tab if no match
                setSplitPreference('equal');
        }
    }, [])
    return (
        <TabGroup selectedIndex={selectedIndex}>
            <div className="flex flex-col md:flex-row content-center justify-between items-center">
                <div className="my-auto">Split</div>
                <TabList className="border rounded w-full md:w-max flex mt-2 md:mt-0">
                    <Tab className={tabClass + (selectedIndex==0 && selectedTabClass)} onClick={() => {setSelectedIndex(0);setSplitPreference('equal')}}>Equal</Tab>
                    <Tab className={tabClass + (selectedIndex==1 && selectedTabClass)} onClick={() => {setSelectedIndex(1);setSplitPreference("percentage")}}>%</Tab>
                    <Tab className={tabClass + (selectedIndex==2 && selectedTabClass)} onClick={() => {setSelectedIndex(2);setSplitPreference("weight")}}>Weight</Tab>
                    <Tab className={tabClass + (selectedIndex==3 && selectedTabClass)} onClick={() => {setSelectedIndex(3);setSplitPreference('extra')}}>+/-</Tab>
                    <Tab className={tabClass + (selectedIndex==4 && selectedTabClass)} onClick={() => {setSelectedIndex(4);setSplitPreference("manual")}}>Manual</Tab>
                </TabList>
                <div className="my-auto">with</div>
            </div>
            <TabPanels>
                <TabPanel><EqualSplit /></TabPanel>
                <TabPanel><PercentageSplit /></TabPanel>
                <TabPanel><WeightSplit /></TabPanel>
                <TabPanel><ExtraSplit /></TabPanel>
                <TabPanel><ManualSplit /></TabPanel>
            </TabPanels>
        </TabGroup>
    );
};

export default SplitTab;
