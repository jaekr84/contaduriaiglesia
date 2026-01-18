
import { Skeleton } from "@/components/ui/skeleton"
import { TableSkeleton } from "@/components/ui/table-skeleton"

export function AnnualSummarySkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-48" />
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Skeleton className="h-[120px] rounded-xl" />
                            <Skeleton className="h-[120px] rounded-xl" />
                            <Skeleton className="h-[120px] rounded-xl" />
                            <Skeleton className="h-[120px] rounded-xl" />
                        </div>
                    </div>
                    <Skeleton className="h-[450px] w-full rounded-xl" />
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-48" />
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Skeleton className="h-[120px] rounded-xl" />
                            <Skeleton className="h-[120px] rounded-xl" />
                            <Skeleton className="h-[120px] rounded-xl" />
                            <Skeleton className="h-[120px] rounded-xl" />
                        </div>
                    </div>
                    <Skeleton className="h-[450px] w-full rounded-xl" />
                </div>
            </div>

            <div className="mt-8">
                <TableSkeleton rows={12} columns={13} />
            </div>
        </div>
    )
}
