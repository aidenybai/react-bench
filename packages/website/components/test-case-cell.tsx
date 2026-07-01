"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { getTestCategory } from "@/lib/test-categories";

interface TestCaseCellProps {
  testId: string;
  description?: string;
  componentName?: string;
  filePath: string;
}

const TestCaseCell = ({
  testId,
  description,
  componentName,
  filePath,
}: TestCaseCellProps) => {
  const category = getTestCategory(testId);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <a
          href={`https://github.com/aidenybai/react-bench/blob/main/packages/benchmark/${filePath}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {testId}
        </a>
        {category && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Badge
                  variant="outline"
                  className="h-4 cursor-default px-1.5 py-0 text-[10px]"
                />
              }
            >
              {category.label}
            </TooltipTrigger>
            <TooltipContent className="max-w-[240px]">
              {category.rationale}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {description && (
        <p className="text-[11px] font-normal whitespace-normal text-muted-foreground">
          {description}
        </p>
      )}
      <p className="font-mono text-[10px] font-normal whitespace-normal text-muted-foreground/60">
        {componentName && <span>{componentName} · </span>}
        {filePath}
      </p>
    </div>
  );
};

export { TestCaseCell };
