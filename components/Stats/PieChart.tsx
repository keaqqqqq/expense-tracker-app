'use client'
import { DonutData } from "@/types/ChartData";
import React from "react";
// import dynamic from "next/dynamic";
import ReactApexChart from "react-apexcharts";

// Dynamically import ApexCharts with SSR disabled
// const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false });
interface DonutChartProp {
  donutData: DonutData
}
const DonutChart: React.FC<DonutChartProp> = ({donutData}) => {
  const {chartSeries, chartLabels, title} = donutData
  // Donut Chart options
  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      width: "100%", // Make chart width 100% of container
      height: "100%", // Make chart height 100% of container
    },
    labels: chartLabels,
    title: {
      text: title,
      align: "center",
      margin: 20, 
      style: {
        fontSize: "18px",
        fontWeight: "bold",
        color: "#263238",
      },
      
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      markers: {
        size: 8, 
        strokeWidth: 0,
      },
      itemMargin: {
        vertical: 10, 
        horizontal: 10, 
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `RM${val}`,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "75%", // Increase donut size to fill more space
        },
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: "100%",
          },
          legend: {
            position: "bottom"
          }
        }
      }
    ]
  };

  // Donut Chart series data (example expense data)
  // const chartSeries = [40, 20, 15, 10, 15]; // Percentage data for each category

  return (
    <div className="w-full h-full flex items-center justify-center bg-white">
      <ReactApexChart
        options={chartOptions}
        series={chartSeries}
        type="donut"
        width="90%"
        height="90%"
      />
    </div>
  );
};

export default DonutChart;