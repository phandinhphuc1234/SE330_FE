import { Skeleton } from "./Skeleton";

interface TableRowSkeletonProps {
  columns?: number;
}

export function TableRowSkeleton({ columns = 5 }: TableRowSkeletonProps) {
  return (
    <tr className="border-b border-[#DED5C8]">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-4 py-4">
          <Skeleton variant="text" className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#DED5C8] bg-white">
      <table className="w-full">
        <thead className="bg-[#F7F3EA]">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-4 py-3 text-left">
                <Skeleton variant="text" className="h-4 w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRowSkeleton key={index} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
