import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TestCaseCell } from "@/components/test-case-cell";
import { benchData } from "@/lib/bench-data";
import { ResolverHeaderCell } from "@/components/resolver-header-cell";

interface AccuracyTableProps {
  resolverKeys: string[];
}

const AccuracyTable = ({ resolverKeys }: AccuracyTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="text-xs">Test Case</TableHead>
        {resolverKeys.map((resolverKey) => (
          <TableHead key={resolverKey} className="text-right text-xs">
            <ResolverHeaderCell resolverKey={resolverKey} />
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {benchData.testCases.map((testCase) => (
        <TableRow key={testCase.id}>
          <TableCell className="font-medium text-xs max-w-[300px] overflow-hidden">
            <TestCaseCell
              testId={testCase.testId}
              description={testCase.description}
              componentName={testCase.componentName}
              filePath={testCase.filePath}
            />
          </TableCell>
          {resolverKeys.map((resolverKey) => {
            const result =
              testCase.results[resolverKey as keyof typeof testCase.results];

            return (
              <TableCell
                key={resolverKey}
                className="text-right tabular-nums text-xs"
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
      ))}
    </TableBody>
  </Table>
);

export { AccuracyTable };
