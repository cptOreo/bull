"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/ui/button";
import { Target, BookOpen } from "lucide-react";
import { ProgressHeatmapView } from "@/components/learn/progress-heatmap-view";

export default function ProfilePage() {
  return (
    <div className="min-h-screen pb-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-8">
        <div className="flex items-center justify-end gap-2 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/practice">
              <Target className="h-4 w-4 mr-1.5" />
              Practice Arena
            </Link>
          </Button>
          <Button variant="default" size="sm" asChild>
            <Link href="/learn">
              <BookOpen className="h-4 w-4 mr-1.5" />
              Skill Tree
            </Link>
          </Button>
        </div>
        <ProgressHeatmapView showHeader={true} />
      </div>
    </div>
  );
}
