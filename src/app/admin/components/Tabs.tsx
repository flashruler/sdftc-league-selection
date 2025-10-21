"use client";

import React, { useState } from "react";

export type TabItem = {
  id: string;
  label: string;
  content: React.ReactNode;
};

export function Tabs({
  items,
  initialId,
  activeId,
  onChange,
  hideHeader,
}: {
  items: TabItem[];
  initialId?: string;
  activeId?: string;
  onChange?: (id: string) => void;
  hideHeader?: boolean;
}) {
  const defaultId = initialId || (items[0]?.id ?? "");
  const [uncontrolled, setUncontrolled] = useState<string>(defaultId);
  const active = activeId ?? uncontrolled;
  const setActive = (id: string) => {
    if (onChange) onChange(id);
    else setUncontrolled(id);
  };
  const activeItem = items.find((i) => i.id === active) ?? items[0];

  return (
    <div className="w-full">
      {!hideHeader && (
        <div role="tablist" aria-label="Admin sections" className="flex flex-wrap gap-2 border-b border-slate-200 mb-6">
          {items.map((item) => {
            const isActive = item.id === active;
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${item.id}`}
                id={`tab-${item.id}`}
                onClick={() => setActive(item.id)}
                className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors border-b-2 -mb-[1px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  isActive
                    ? "text-indigo-700 border-indigo-600 bg-indigo-50"
                    : "text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {activeItem && (
        <div
          role="tabpanel"
          id={`panel-${activeItem.id}`}
          aria-labelledby={`tab-${activeItem.id}`}
          className="bg-white rounded-2xl shadow-xl border border-slate-200/50 p-8"
        >
          {activeItem.content}
        </div>
      )}
    </div>
  );
}
