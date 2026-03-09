import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { benchData, resolverKeys, controlKey, getResolverColor } from "@/lib/bench-data";

const AccuracyTable = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="text-xs">Test Case</TableHead>
        {resolverKeys.map((resolverKey) => {
          const resolver = benchData.resolvers.find(
            (innerResolver) => innerResolver.key === resolverKey,
          );
          return (
            <TableHead key={resolverKey} className="text-right text-xs">
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
        const controlResult = controlKey
          ? testCase.results[controlKey as keyof typeof testCase.results]
          : null;
        return (
          <TableRow key={testCase.id}>
            <TableCell
              className="font-medium max-w-[200px] truncate"
              title={testCase.difficulty}
            >
              {testCase.testId}
            </TableCell>
            {resolverKeys.map((resolverKey) => {
              const result =
                testCase.results[resolverKey as keyof typeof testCase.results];
              const isControl = resolverKey === controlKey;
              const controlCorrect = controlResult?.correct ?? false;
              const didImproveOverControl =
                !isControl && result.correct && !controlCorrect;
              const didRegressFromControl =
                !isControl && !result.correct && controlCorrect;

              let cellBackgroundColor = "transparent";
              if (didImproveOverControl) {
                cellBackgroundColor = "rgba(100, 200, 150, 0.2)";
              } else if (didRegressFromControl) {
                cellBackgroundColor = "rgba(240, 120, 120, 0.2)";
              }

              return (
                <TableCell
                  key={resolverKey}
                  className="text-right tabular-nums text-xs"
                  style={{
                    color: result.correct
                      ? "var(--foreground)"
                      : "var(--muted-foreground)",
                    backgroundColor: cellBackgroundColor,
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
