import type { NextConfig } from "next";
import type { Resolver, SourceResult } from "../components/bench-harness";

interface IsolateDefinition {
  name: string;
  port: number;
  description: string;
  dependencies: string[];
  configureNext: (baseConfig: NextConfig) => NextConfig;
  createResolver: () => Resolver;
}

export type { IsolateDefinition, Resolver, SourceResult };
