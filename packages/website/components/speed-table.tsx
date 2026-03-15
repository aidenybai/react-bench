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

const CHANGE_THRESHOLD_PERCENT = 0.5;

const getRelativeBackgroundColor = (
  value: number,
  fastestSpeed: number,
  speedRange: number,
): string => {
  if (!value || speedRange <= 0) return "transparent";
  const relativePosition = (value - fastestSpeed) / speedRange;
  const opacity = 0.08 + Math.abs(relativePosition * 2 - 1) * 0.17;
  if (relativePosition <= 0.5) {
    return `rgba(100, 200, 150, ${opacity})`;
  }
  return `rgba(240, 120, 120, ${opacity})`;
};

interface SpeedTableProps {
  resolverKeys: string[];
  controlKey?: string;
}

const SpeedTable = ({ resolverKeys, controlKey }: SpeedTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="text-[11px]">Test Case</TableHead>
        {resolverKeys.map((resolverKey) => (
          <TableHead key={resolverKey} className="text-right text-[11px]">
            <ResolverHeaderCell resolverKey={resolverKey} />
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {benchData.testCases.map((testCase) => {
        const controlResult = controlKey
          ? testCase.results[controlKey as keyof typeof testCase.results]
          : null;
        const allSpeeds = resolverKeys
          .map(
            (key) =>
              testCase.results[key as keyof typeof testCase.results].speed,
          )
          .filter(Boolean);
        const fastestSpeed = Math.min(...allSpeeds);
        const speedRange = Math.max(...allSpeeds) - fastestSpeed;

        return (
          <TableRow key={testCase.id}>
            <TableCell className="font-medium text-[11px] max-w-[300px] overflow-hidden">
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
              const isControl = resolverKey === controlKey;
              const percentChange =
                !isControl && controlResult?.speed && result.speed
                  ? ((result.speed - controlResult.speed) /
                      controlResult.speed) *
                    100
                  : 0;
              const changeText =
                Math.abs(percentChange) >= CHANGE_THRESHOLD_PERCENT
                  ? `${percentChange < 0 ? "\u2193" : "\u2191"}${Math.round(Math.abs(percentChange))}%`
                  : null;

              return (
                <TableCell
                  key={resolverKey}
                  className="text-right tabular-nums text-[11px]"
                  style={{
                    color: isControl
                      ? "var(--muted-foreground)"
                      : "var(--foreground)",
                    backgroundColor: getRelativeBackgroundColor(
                      result.speed,
                      fastestSpeed,
                      speedRange,
                    ),
                  }}
                >
                  {result.speed ? `${result.speed}s` : "\u2014"}
                  {changeText && (
                    <span className="ml-1.5 text-[10px] opacity-70">
                      {changeText}
                    </span>
                  )}
                </TableCell>
              );
            })}
          </TableRow>
        );
      })}
    </TableBody>
  </Table>
);

export { SpeedTable };
