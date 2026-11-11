"use client";

import * as React from "react";
import { PracticeArenaView } from "@/components/learn/practice-arena-view";

export default function PracticePage() {
  return (
    <div className="min-h-screen pb-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-8">
        <PracticeArenaView showHeader={true} />
      </div>
    </div>
  );
}
