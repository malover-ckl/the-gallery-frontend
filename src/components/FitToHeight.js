import React, { useRef, useState, useLayoutEffect, useCallback } from 'react';

export default function FitToHeight({ children, className }) {
  const outerRef   = useRef(null);
  const measureRef = useRef(null);
  const [scale, setScale] = useState(1);

  const recalc = useCallback(() => {
    const outer   = outerRef.current;
    const measure = measureRef.current;
    if (!outer || !measure) return;

    const availableHeight = outer.clientHeight;
    const contentHeight   = measure.scrollHeight;

    const nextScale = contentHeight > availableHeight
      ? availableHeight / contentHeight
      : 1;

    setScale(nextScale);
  }, []);

  useLayoutEffect(() => {
    recalc();
    const outerObserver   = new ResizeObserver(recalc);
    const measureObserver = new ResizeObserver(recalc);
    if (outerRef.current)   outerObserver.observe(outerRef.current);
    if (measureRef.current) measureObserver.observe(measureRef.current);
    return () => {
      outerObserver.disconnect();
      measureObserver.disconnect();
    };
  }, [recalc]);

  return (
    <div ref={outerRef} style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* Visible, scaled content */}
      <div
        className={className}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${100 / scale}%`,
        }}
      >
        {children}
      </div>

      {/* Hidden measuring copy — always natural size, never scaled.
          Used only to detect true content height without fighting
          the visible element's own resize events. */}
      <div
        ref={measureRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          visibility: 'hidden',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        {children}
      </div>
    </div>
  );
}