"use client";

import * as React from "react";
import { SkillTreeView } from "@/components/learn/skill-tree-view";

export default function LearnPage() {
  return (
    <div className="min-h-screen pb-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-8">
        <SkillTreeView showHeader={true} />
      </div>
    </div>
  );
}
