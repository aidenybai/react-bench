"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Annotation } from "instruckt";

interface InstrucktToolbarProps {
  "data-testid"?: string;
  endpoint?: string;
}

export const InstrucktToolbar = ({
  "data-testid": testId,
  endpoint,
}: InstrucktToolbarProps) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isModuleLoaded, setIsModuleLoaded] = useState(false);
  const destroyRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    import("instruckt").then(({ Instruckt }) => {
      setIsModuleLoaded(true);

      if (!endpoint) return;

      const instance = new Instruckt({
        endpoint,
        adapters: ["react"],
        onAnnotationAdd: (annotation) => {
          setAnnotations((previous) => [...previous, annotation]);
        },
      });
      destroyRef.current = () => instance.destroy();
    });

    return () => {
      destroyRef.current?.();
    };
  }, [endpoint]);

  const activeAnnotationCount = annotations.filter(
    (annotation) => annotation.status === "pending",
  ).length;

  return (
    <div
      data-testid={testId}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "var(--background)",
        fontSize: 14,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: isModuleLoaded ? "#22c55e" : "#94a3b8",
        }}
      />
      <span style={{ fontWeight: 600 }}>Feedback</span>
      {activeAnnotationCount > 0 && (
        <span
          style={{
            padding: "2px 6px",
            borderRadius: 4,
            background: "#6366f1",
            color: "white",
            fontSize: 12,
          }}
        >
          {activeAnnotationCount}
        </span>
      )}
    </div>
  );
};
