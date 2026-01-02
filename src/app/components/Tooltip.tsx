"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactElement } from "react";

type TooltipProps = {
  content: string;
  ariaLabel?: string;
  children?: ReactElement;
};

export default function Tooltip({
  content,
  ariaLabel = "More info",
  children,
}: TooltipProps) {
  const trigger = children ?? (
    <button type="button" className="mixer-tooltip" aria-label={ariaLabel}>
      i
    </button>
  );

  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root delayDuration={150}>
        <TooltipPrimitive.Trigger asChild>{trigger}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className="mixer-tooltip-bubble"
            side="top"
            align="center"
            sideOffset={10}
            collisionPadding={12}
          >
            {content}
            <TooltipPrimitive.Arrow className="mixer-tooltip-arrow" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
