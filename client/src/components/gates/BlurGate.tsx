import React, { useState } from "react";
import { Button } from "@/components/ui/button";

type GateProps = {
  isLocked: boolean;
  children: React.ReactNode;
  onUnlock: () => void;

  // NEW PROP
  showButtonOnClick?: boolean;
};

export function BlurGate({
  isLocked,
  children,
  onUnlock,
  showButtonOnClick = false, // default = show button immediately
}: GateProps) {
  const [showButton, setShowButton] = useState(!showButtonOnClick);

  if (!isLocked) return <>{children}</>;

  return (
    <div className="relative">
      {/* Blurred Content */}
      <div className="blur-sm pointer-events-none select-none">{children}</div>

      {/* Overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-lg cursor-pointer"
        onClick={() => {
          if (showButtonOnClick) {
            setShowButton(true);
          }
        }}
      >
        <div className="text-center space-y-3">
          {showButton && (
            <div>
              <p className="font-semibold text-xs text-primary">
                Unlock Full PROOF Report
              </p>
              <Button
                className="bg-gold text-xs text-white px-6 py-2 shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnlock();
                }}
              >
                Upgrade – $49.95
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
