import type { ReactNode } from "react";

import { ScreenColumn } from "./ScreenColumn";
import { SkipPracticeButton } from "./SkipPracticeButton";

export interface PracticeActionBarProps {
  children: ReactNode;
  onSkip?: () => void;
  skipDisabled?: boolean;
}

/**
 * Bottom padding a practice screen's content needs so nothing hides under the bar:
 * bar height (2.5px border + 12px top + 56px row + 16px bottom [+ 4px gap + 44px skip row]) + 16px.
 */
export const practiceBarContentPadding = {
  withSkip: "pb-[calc(152px+env(safe-area-inset-bottom))]",
  withoutSkip: "pb-[calc(104px+env(safe-area-inset-bottom))]"
};

export function PracticeActionBar({ children, onSkip, skipDisabled = false }: PracticeActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t-[2.5px] border-ink bg-paper">
      <ScreenColumn className="flex flex-col gap-1 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
        <div className="flex gap-3">{children}</div>
        {onSkip ? <SkipPracticeButton onSkip={onSkip} disabled={skipDisabled} /> : null}
      </ScreenColumn>
    </div>);

}