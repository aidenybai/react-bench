import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { benchData, resolverKeys, controlKey, getResolverColor } from "@/lib/bench-data";

interface ChangeInfo {
  change: string;
  bgColor: string;
}

const CHANGE_THRESHOLD_PERCENT = 0.5;

const EMPTY_CHANGE_INFO: ChangeInfo = { change: "", bgColor: "transparent" };

const getChangeInfo = (
  controlValue: number,
  treatmentValue: number,
  lowerIsBetter: boolean,
): ChangeInfo => {
  if (!controlValue || !treatmentValue) return EMPTY_CHANGE_INFO;
  const percentChange =
    ((treatmentValue - controlValue) / controlValue) * 100;
  if (Math.abs(percentChange) < CHANGE_THRESHOLD_PERCENT)
    return EMPTY_CHANGE_INFO;
  const isImprovement = lowerIsBetter ? percentChange < 0 : percentChange > 0;
  const absolutePercent = Math.abs(percentChange);
  const intensity = Math.min(absolutePercent / 100, 1);
  const opacity = 0.1 + intensity * 0.3;
  return {
    change: `${isImprovement ? "\u2193" : "\u2191"}${Math.round(absolutePercent)}%`,
    bgColor: isImprovement
      ? `rgba(100, 200, 150, ${opacity})`
      : `rgba(240, 120, 120, ${opacity})`,
  };
};

const SpeedTable = () => (
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
              const changeInfo =
                !isControl && controlResult
                  ? getChangeInfo(controlResult.speed, result.speed, true)
                  : EMPTY_CHANGE_INFO;
              return (
                <TableCell
                  key={resolverKey}
                  className="text-right tabular-nums text-xs"
                  style={{
                    color: isControl
                      ? "var(--muted-foreground)"
                      : "var(--foreground)",
                    backgroundColor: changeInfo.bgColor,
                  }}
                >
                  {result.speed ? `${result.speed}s` : "\u2014"}
                  {changeInfo.change && (
                    <span className="ml-1.5 text-[10px] opacity-70">
                      {changeInfo.change}
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
