import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { benchData, resolverKeys, getResolverColor } from "@/lib/bench-data";

const AccuracyTable = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="text-[11px]">Test Case</TableHead>
        {resolverKeys.map((resolverKey) => {
          const resolver = benchData.resolvers.find(
            (innerResolver) => innerResolver.key === resolverKey,
          );
          return (
            <TableHead key={resolverKey} className="text-right text-[11px]">
              <span className="inline-flex items-center justify-end gap-1.5">
                <span
                  className="size-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: getResolverColor(resolverKey) }}
                />
                {resolver?.label ?? resolverKey}
              </span>
            </TableHead>
          );
        })}
      </TableRow>
    </TableHeader>
    <TableBody>
      {benchData.testCases.map((testCase) => {
        return (
          <TableRow key={testCase.id}>
            <TableCell className="font-medium max-w-[200px] truncate text-[11px]">
              <a
                href={`https://github.com/aidenybai/react-bench/blob/main/packages/benchmark/${testCase.filePath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {testCase.testId}
              </a>
            </TableCell>
            {resolverKeys.map((resolverKey) => {
              const result =
                testCase.results[resolverKey as keyof typeof testCase.results];

              return (
                <TableCell
                  key={resolverKey}
                  className="text-right tabular-nums text-[11px]"
                  style={{
                    color: result.correct
                      ? "var(--foreground)"
                      : "var(--muted-foreground)",
                    backgroundColor: result.correct
                      ? "rgba(100, 200, 150, 0.15)"
                      : "rgba(240, 120, 120, 0.15)",
                  }}
                >
                  {result.correct ? "\u2713" : "\u2717"}
                </TableCell>
              );
            })}
          </TableRow>
        );
      })}
    </TableBody>
  </Table>
);

export { AccuracyTable };
