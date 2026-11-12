"use client";

import * as React from "react";
import { CommandPaletteTrigger } from "@/components/search/command-palette-trigger";
import { ThemeToggle } from "./theme-toggle";
import { ProfileMenu } from "./profile-menu";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card/80 backdrop-blur-lg px-4 lg:px-6">
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <CommandPaletteTrigger />
        <ThemeToggle />
        <ProfileMenu />
      </div>
    </header>
  );
}