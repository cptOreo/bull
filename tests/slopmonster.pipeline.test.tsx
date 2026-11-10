import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react"
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import { spawnSync } from "child_process";
import type { LiveStockSnapshot, Block } from "@/lib/engine/types";
import { identifyStockInQuery, getLiveStockQuote } from "@/lib/data/live";
import { StockSnapshotCard } from "@/components/chat/stock-snapshot-card";
import { MessageBubble } from "@/components/chat/message-bubble";
import {
  SLOPMONSTER_SYSTEM_PROMPT,
  PREDEFINED_COMMENTARIES,
  buildChaiCommentaryFromSnapshot,
} from "@/lib/llm/slopmonster";
import { POST } from "@/app/api/chat/route";