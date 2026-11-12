import { openDB, DBSchema, IDBPDatabase } from "idb";

interface BullDB extends DBSchema {
  stockQuotes: {
    key: string;
    value: {
      symbol: string;
      data: unknown;
      timestamp: number;
    };
    indexes: { "by-timestamp": number };
  };
  stockHistory: {
    key: string;
    value: {
      symbol: string;
      range: string;
      interval: string;
      data: unknown;
      timestamp: number;
    };
    indexes: { "by-symbol": string };
  };
  searchResults: {
    key: string;
    value: {
      query: string;
      data: unknown;
      timestamp: number;
    };
  };
  concepts: {
    key: string;
    value: {
      conceptId: string;
      content: unknown;
      timestamp: number;
    };
  };
  ragEmbeddings: {
    key: string;
    value: {
      id: string;
      text: string;
      embedding: number[];
      metadata: Record<string, unknown>;
    };
  };
  userProgress: {
    key: string;
    value: {
      userId: string;
      xp: number;
      level: number;
      mastery: Record<string, { level: number; progress: number }>;
      streak: number;
      lastActive: string;
      badges: string[];
      timestamp: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<BullDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<BullDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BullDB>("bull-v2", 1, {
      upgrade(db) {
        db.createObjectStore("stockQuotes", { keyPath: "symbol" }).createIndex("by-timestamp", "timestamp");
        db.createObjectStore("stockHistory", { keyPath: "symbol" }).createIndex("by-symbol", "symbol");
        db.createObjectStore("searchResults", { keyPath: "query" });
        db.createObjectStore("concepts", { keyPath: "conceptId" });
        db.createObjectStore("ragEmbeddings", { keyPath: "id" });
        db.createObjectStore("userProgress", { keyPath: "userId" });
      },
    });
  }
  return dbPromise;
}

export async function cacheStockQuote(symbol: string, data: unknown): Promise<void> {
  const db = await getDB();
  await db.put("stockQuotes", { symbol: symbol.toUpperCase(), data, timestamp: Date.now() });
}

export async function getCachedStockQuote(symbol: string, maxAge = 60000): Promise<unknown | null> {
  const db = await getDB();
  const cached = await db.get("stockQuotes", symbol.toUpperCase());
  if (!cached) return null;
  if (Date.now() - cached.timestamp > maxAge) return null;
  return cached.data;
}

export async function cacheStockHistory(symbol: string, range: string, interval: string, data: unknown): Promise<void> {
  const db = await getDB();
  await db.put("stockHistory", { symbol: symbol.toUpperCase(), range, interval, data, timestamp: Date.now() });
}

import { type PriceSeries } from "./transformers";

export async function getCachedStockHistory(symbol: string, range: string, interval: string, maxAge = 300000): Promise<PriceSeries | null> {
  const db = await getDB();
  const key = `${symbol.toUpperCase()}:${range}:${interval}`;
  const cached = await db.get("stockHistory", key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > maxAge) return null;
  return cached.data as PriceSeries | null;
}

export async function cacheSearchResults(query: string, data: unknown): Promise<void> {
  const db = await getDB();
  await db.put("searchResults", { query: query.toLowerCase(), data, timestamp: Date.now() });
}

export async function getCachedSearchResults(query: string, maxAge = 300000): Promise<unknown | null> {
  const db = await getDB();
  const cached = await db.get("searchResults", query.toLowerCase());
  if (!cached) return null;
  if (Date.now() - cached.timestamp > maxAge) return null;
  return cached.data;
}

export async function saveUserProgress(
  userId: string,
  progress: Omit<BullDB["userProgress"]["value"], "userId" | "timestamp">
): Promise<void> {
  const db = await getDB();
  await db.put("userProgress", { userId, ...progress, timestamp: Date.now() });
}

export async function getUserProgress(userId: string): Promise<unknown | null> {
  const db = await getDB();
  return db.get("userProgress", userId);
}