import type { GroupVisitPlanRow } from "@/lib/tour-data";

type GroupVisitPlanTableProps = {
  rows: readonly GroupVisitPlanRow[];
  title?: string;
  emptyMessage?: string;
};

export default function GroupVisitPlanTable({
  rows,
  title = "Planerade restaurangbesök",
  emptyMessage = "Ingen plan tillagd än.",
}: GroupVisitPlanTableProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>

      {rows.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-700">
            <thead>
              <tr className="text-left text-zinc-800 dark:text-zinc-400">
                <th className="px-2 py-2 font-semibold">Grupp</th>
                <th className="px-2 py-2 font-semibold">Restaurang</th>
                <th className="px-2 py-2 font-semibold">Tid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.map((row, index) => (
                <tr key={`${row.groupSlug}-${row.restaurantName}-${index}`}>
                  <td className="whitespace-nowrap px-2 py-2 font-medium text-zinc-900 dark:text-zinc-100">
                    {row.groupName}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-zinc-800 dark:text-zinc-300">
                    {row.restaurantName}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-zinc-800 dark:text-zinc-300">
                    {row.visitTime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-800 dark:text-zinc-400">{emptyMessage}</p>
      )}
    </section>
  );
}
