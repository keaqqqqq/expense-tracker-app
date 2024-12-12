import AreaChart from "@/components/Stats/LineChart";
import DonutChart from "@/components/Stats/PieChart";
import { getTotalPaid } from "@/lib/actions/statistic.action";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const StatsPage = async () => {
    const cookiesStore = cookies();
    const uid = cookiesStore.get('currentUserUid')?.value;
    if (!uid) {
        redirect('/auth');
      }
    const allData = await getTotalPaid(uid);
    // let totalPaid = 0;
    // transactionN.forEach(t=>totalPaid=totalPaid+t.amount);
    return (
        <div className="space-y-4">
            <div className="flex flex-row gap-4">
                <div className="p-3 border rounded w-full">
                    <div>Total Paid</div>
                    <span className="text-gray-500 text-xs">Expense</span>
                    <div className="text-xl text-green-500">RM {allData.totalPaid.toFixed(2)}</div>
                </div>
                <div className="p-3 border rounded w-full">
                    <div>Total Split</div>
                    <span className="text-gray-500 text-xs">Expense</span>
                    <div className="text-xl text-red-500">RM {allData.totalSplit.toFixed(2)}</div>
                </div>
                <div className="p-3 border rounded w-full">
                    <div>Total Transfer</div>
                    <span className="text-gray-500 text-xs">Transfer</span>
                    <div className="text-xl text-green-500">RM {allData.totalTransfer.toFixed(2)}</div>
                </div>
                <div className="p-3 border rounded w-full">
                    <div>Total Received</div>
                    <span className="text-gray-500 text-xs">Transfer</span>
                    <div className="text-xl text-red-500">RM {allData.totalTransfer.toFixed(2)}</div>
                </div>
            </div>
            
            <div className="border w-full p-3 rounded h-[500px]">
               <AreaChart chartData ={allData.chartData}/>
            </div>
            
               {allData.categoryDonut.chartSeries.length>0 && 
            <div className="grid grid-cols-2 gap-4">
               <div className="border rounded p-3 h-[400px]">
                    <DonutChart donutData={allData.categoryDonut}/>
                </div>
                <div className="border rounded p-3 h-[400px]">
                    <DonutChart donutData={allData.groupDonut}/>
                </div>
            </div>
                }
        </div>
    )
}

export default StatsPage;