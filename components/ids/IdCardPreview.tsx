"use client";

// Live ID card preview. Redraws the card canvas whenever the form input changes
// (debounced), at full 1050×675 resolution, scaled down by CSS. The canvas is
// forwarded so parents can reach in for the downloadable PNG.

import { forwardRef, useEffect } from "react";
import { renderCard, CARD_W, CARD_H, type RenderInput } from "@/lib/idcard/render";
import { ensureFonts } from "@/lib/imageUtils";

export interface IdCardPreviewProps {
  input: RenderInput;
  className?: string;
}

const IdCardPreview = forwardRef<HTMLCanvasElement, IdCardPreviewProps>(function IdCardPreview({ input, className }, ref) {
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const canvas = typeof ref === "object" && ref ? ref.current : null;
      if (!canvas || cancelled) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      void ensureFonts().then(() => {
        if (cancelled) return;
        canvas.width = CARD_W;
        canvas.height = CARD_H;
        renderCard(ctx, input);
      });
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [input, ref]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ aspectRatio: `${CARD_W} / ${CARD_H}`, width: "100%", height: "auto" }}
      role="img"
      aria-label="Live preview of the ID card"
    />
  );
});

export default IdCardPreview;