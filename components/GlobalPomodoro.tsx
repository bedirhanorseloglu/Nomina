"use client";

import { usePathname } from "next/navigation";
import FloatingPomodoro from "./FloatingPomodoro";

export default function GlobalPomodoro() {
  const pathname = usePathname();
  
  return (
    <div style={{ display: pathname === "/" ? "none" : "block" }}>
      <FloatingPomodoro />
    </div>
  );
}
