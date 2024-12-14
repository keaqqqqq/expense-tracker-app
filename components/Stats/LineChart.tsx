'use client'
import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ChartDataCollection } from '@/types/ChartData';

// Dynamically import ApexCharts with SSR disabled
const ApexCharts = dynamic(() => import('react-apexcharts'), { ssr: false });

const AreaChart: React.FC<{chartData:ChartDataCollection}> = ({chartData}) => {
  // State to manage current data type
  const [dataType, setDataType] = useState<keyof typeof chartData>('monthlyExpense');

  // Memoize chart options to prevent unnecessary rerenders
  const chartOptions = useMemo((): ApexCharts.ApexOptions => ({
    chart: {
      type: 'area',
      width: '100%',
      height: '100%',
      zoom: {
        enabled: false,
      },
      toolbar: {
        show: false,
      },
    },
    colors: [chartData[dataType].color],
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 100]
      }
    },
    xaxis: {
      categories: chartData[dataType].categories,
      title: {
        text: 'Months',
        style: {
          fontSize: '10px',
          fontWeight: 600,
        },
        offsetX: 0,  
        offsetY: -5   
      },
    },
    yaxis: {
      title: {
        text: dataType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        style: {
          fontSize: '10px',
          fontWeight: 600,
        },
        offsetX: 5,  
        offsetY: 0   
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val) => `RM ${val.toFixed(2)}`,
      },
    },
  }), [dataType]);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="flex justify-between items-center p-4">
        <h2 className="text-lg font-semibold text-black">
          {dataType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
        </h2>
        <select 
          value={dataType} 
          onChange={(e) => setDataType(e.target.value as keyof typeof chartData)}
          className="border rounded p-2 text-xs"
        >
          <option value="monthlyExpense">Monthly Expense</option>
          <option value="monthlySplit">Monthly Split</option>
          <option value="monthlyTransfer">Monthly Transfer</option>
          
        </select>
      </div>
      <div className="flex-grow">
        <ApexCharts
          key={dataType} // Force re-render when data type changes
          options={chartOptions}
          series={chartData[dataType].series}
          type="area"
          width="100%"
          height="100%"
        />
      </div>
    </div>
  );
};

export default AreaChart;