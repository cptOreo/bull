"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/ui/tabs";
import { formatCrore } from "@/lib/utils/formatters";

interface FinancialsTabProps {
  stock: { financials?: Record<string, unknown> };
}

const FINANCIAL_STATEMENTS = [
  { id: "income", label: "Income Statement", rows: [
    { label: "Revenue", key: "revenue", type: "currency" },
    { label: "EBITDA", key: "ebitda", type: "currency" },
    { label: "EBIT", key: "ebit", type: "currency" },
    { label: "Net Profit", key: "pat", type: "currency" },
    { label: "EPS (₹)", key: "eps", type: "number" },
    { label: "DPS (₹)", key: "dps", type: "number" },
  ]},
  { id: "balance", label: "Balance Sheet", rows: [
    { label: "Net Worth", key: "netWorth", type: "currency" },
    { label: "Total Debt", key: "totalDebt", type: "currency" },
    { label: "Shares Outstanding (Cr)", key: "shares", type: "number" },
  ]},
  { id: "cashflow", label: "Cash Flow", rows: [
    { label: "Operating CF", key: "operatingCF", type: "currency" },
    { label: "Investing CF", key: "investingCF", type: "currency" },
    { label: "Financing CF", key: "financingCF", type: "currency" },
    { label: "Free CF", key: "freeCF", type: "currency" },
  ]},
];

function FinancialTable({ statement, data }: { statement: typeof FINANCIAL_STATEMENTS[0]; data: Record<string, unknown> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="pb-2 w-48">Metric</th>
            <th className="pb-2 text-right">FY2026</th>
            <th className="pb-2 text-right">FY2025</th>
            <th className="pb-2 text-right">FY2024</th>
            <th className="pb-2 text-right">FY2023</th>
            <th className="pb-2 text-right">FY2022</th>
          </tr>
        </thead>
        <tbody>
          {statement.rows.map((row, i) => (
            <motion.tr key={row.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
              <td className="py-2 font-medium">{row.label}</td>
              {["FY2026", "FY2025", "FY2024", "FY2023", "FY2022"].map((fy) => (
                <td key={fy} className="py-2 text-right font-mono tabular-nums">
                  {data[`${row.key}_${fy}`] != null 
                    ? row.type === "currency" 
                      ? `₹${formatCrore(data[`${row.key}_${fy}`] as number)} Cr`
                      : row.type === "number"
                      ? (data[`${row.key}_${fy}`] as number).toLocaleString()
                      : String(data[`${row.key}_${fy}`])
                    : "—"}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FinancialsTab({ stock }: FinancialsTabProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="income" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {FINANCIAL_STATEMENTS.map(s => (
            <TabsTrigger key={s.id} value={s.id}>{s.label}</TabsTrigger>
          ))}
        </TabsList>

        {FINANCIAL_STATEMENTS.map(statement => (
          <TabsContent key={statement.id} value={statement.id} className="pt-6">
            <Card>
              <CardContent className="pt-0">
                <FinancialTable statement={statement} data={(stock.financials || {}) as Record<string, unknown>} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}