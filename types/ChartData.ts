interface ChartSeries {
    name: string;
    data: number[];
}

interface ChartData {
    categories: string[];
    series: ChartSeries[];
    color: string;
}

export interface ChartDataCollection {
    monthlyExpense: ChartData;
    monthlyTransfer: ChartData;
    monthlySplit: ChartData;
    monthlyReceived: ChartData;
}

export interface DonutData {
    chartSeries: number[]; // Array of percentages for each category
    chartLabels: string[]; // Array of category labels
    title: string;
  }
  