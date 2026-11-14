"use client";

import { useState, type ReactNode } from "react";
import { Tabs } from "@/components/ui/tabs";

/** The row of big country tabs. The lists inside are prepared on the server. */
export function CountryTabs({
  label,
  items,
}: {
  label: string;
  items: { id: string; label: string; content: ReactNode }[];
}) {
  const [value, setValue] = useState(items[0]?.id ?? "");
  return <Tabs size="big" label={label} items={items} value={value} onChange={setValue} />;
}
