import type { Metadata } from "next";
import "./globals.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { StyledComponentsRegistry } from "@/components/providers/styled-registry";
import { ProviderStack } from "@/components/providers/provider-stack";
import { BenchHarness } from "@/components/bench-harness";

export const metadata: Metadata = {
  title: "React Bench - Evaluating coding agents on React.js tasks",
  description:
    "Benchmark comparing coding agent element retrieval tools on React.js component resolution tasks",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NuqsAdapter>
          <StyledComponentsRegistry>
            <ProviderStack>{children}</ProviderStack>
          </StyledComponentsRegistry>
        </NuqsAdapter>
        <BenchHarness />
        <div id="portal-root" />
      </body>
    </html>
  );
}
