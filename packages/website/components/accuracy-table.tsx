import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { benchData, getResolverColor } from "@/lib/bench-data";

interface AccuracyTableProps {
  resolverKeys: string[];
}

const AccuracyTable = ({ resolverKeys }: AccuracyTableProps) => (
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
            <TableCell className="font-medium text-[11px] max-w-[300px]">
              <a
                href={`https://github.com/aidenybai/react-bench/blob/main/packages/benchmark/${testCase.filePath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {testCase.testId}
              </a>
              {testCase.description && (
                <p className="text-[10px] text-muted-foreground font-normal mt-0.5 whitespace-normal">
                  {testCase.description}
                </p>
              )}
              <p className="text-[9px] text-muted-foreground/60 font-normal mt-0.5 font-mono whitespace-normal">
                {testCase.componentName && (
                  <span>{testCase.componentName} · </span>
                )}
                {testCase.filePath}
              </p>
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
