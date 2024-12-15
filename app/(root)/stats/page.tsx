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

    return (
        <div className="space-y-6 p-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Paid */}
                <div className="p-4 border rounded bg-white">
                    <div className="font-medium">Total Paid</div>
                    <span className="text-gray-500 text-xs">Expense</span>
                    <div className="text-lg sm:text-xl text-green-500">
                        RM {allData.totalPaid.toFixed(2)}
                    </div>
                </div>

                {/* Total Split */}
                <div className="p-4 border rounded bg-white">
                    <div className="font-medium">Total Split</div>
                    <span className="text-gray-500 text-xs">Expense</span>
                    <div className="text-lg sm:text-xl text-blue-500">
                        RM {allData.totalSplit.toFixed(2)}
                    </div>
                </div>

                {/* Total Transfer */}
                <div className="p-4 border rounded bg-white">
                    <div className="font-medium">Total Transfer</div>
                    <span className="text-gray-500 text-xs">Transfer</span>
                    <div className="text-lg sm:text-xl text-yellow-500">
                        RM {allData.totalTransfer.toFixed(2)}
                    </div>
                </div>

                {/* Total Received */}
                <div className="p-4 border rounded bg-white">
                    <div className="font-medium">Total Received</div>
                    <span className="text-gray-500 text-xs">Transfer</span>
                    <div className="text-lg sm:text-xl text-purple-500">
                        RM {allData.totalReceived.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Area Chart */}
            <div className="w-full p-4 rounded bg-white">
                <div className="h-[300px] sm:h-[400px] lg:h-[500px]">
                    <AreaChart chartData={allData.chartData} />
                </div>
            </div>

            {/* Donut Charts */}
            {allData.categoryDonut.chartSeries.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white rounded p-4">
                        <div className="h-[300px] sm:h-[350px]">
                            <DonutChart donutData={allData.categoryDonut} />
                        </div>
                    </div>
                    <div className="bg-white rounded p-4">
                        <div className="h-[300px] sm:h-[350px]">
                            <DonutChart donutData={allData.groupDonut} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default StatsPage;