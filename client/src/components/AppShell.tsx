import type { ReactNode } from "react";

import { SHEET_ROOT_ID } from "./BottomSheet";
import { BottomNavigation, type BottomNavigationTab } from "./BottomNavigation";

export interface AppShellProps {
  navTab: BottomNavigationTab | null;
  onNavChange: (tab: BottomNavigationTab) => void;
  children: ReactNode;
}

export function AppShell({ navTab, onNavChange, children }: AppShellProps) {
  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-canvas pt-safe xl:flex-row">
      <div id={SHEET_ROOT_ID} className="pointer-events-none fixed inset-0 z-50" />
      <div className={`relative min-h-0 min-w-0 flex-1 overflow-y-auto bg-paper ${navTab ? "" : "pb-safe"}`}>
        {children}
      </div>
      {navTab ? <BottomNavigation activeTab={navTab} onChange={onNavChange} /> : null}
    </div>);

}