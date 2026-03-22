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
                  className="text-[10px] px-1.5 py-0 h-4 cursor-default"
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
        <p className="text-[11px] text-muted-foreground font-normal whitespace-normal">
          {description}
        </p>
      )}
      <p className="text-[10px] text-muted-foreground/60 font-normal font-mono whitespace-normal">
        {componentName && <span>{componentName} · </span>}
        {filePath}
      </p>
    </div>
  );
};

export { TestCaseCell };
