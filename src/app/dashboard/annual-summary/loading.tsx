import { Skeleton } from "@/components/ui/skeleton"
import { AnnualSummarySkeleton } from "./components/AnnualSummarySkeleton"

export default function Loading() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <Skeleton className="h-9 w-64" />
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-10 w-[180px]" />
                    <Skeleton className="h-10 w-[100px]" />
                </div>
            </div>

            <AnnualSummarySkeleton />
        </div>
    )
}
