import type { Metadata } from "next";
import "./globals.css";
import { StyledComponentsRegistry } from "@/components/providers/styled-registry";
import { ProviderStack } from "@/components/providers/provider-stack";
import { BenchHarness } from "@/components/bench-harness";

export const metadata: Metadata = {
  title: "React Bench - Benchmark Harness",
  description:
    "75-component test harness for benchmarking coding agent element retrieval",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <ProviderStack>{children}</ProviderStack>
        </StyledComponentsRegistry>
        <BenchHarness />
        <div id="portal-root" />
      </body>
    </html>
  );
}
