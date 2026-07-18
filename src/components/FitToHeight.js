import React, { useRef, useState, useLayoutEffect, useCallback } from 'react';

export default function FitToHeight({ children, className }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);

  const recalc = useCallback(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    inner.style.transform = 'scale(1)';
    inner.style.width = '100%';

    const availableHeight = outer.clientHeight;
    const contentHeight = inner.scrollHeight;
	console.log('FitToHeight recalc:', { availableHeight, contentHeight });
    const nextScale = contentHeight > availableHeight
      ? availableHeight / contentHeight
      : 1;

    setScale(nextScale);
  }, []);

  useLayoutEffect(() => {
    recalc();
    const outerObserver = new ResizeObserver(recalc);
    const innerObserver = new ResizeObserver(recalc);
    if (outerRef.current) outerObserver.observe(outerRef.current);
    if (innerRef.current) innerObserver.observe(innerRef.current);
    return () => {
      outerObserver.disconnect();
      innerObserver.disconnect();
    };
  }, [recalc]);

  return (
    <div ref={outerRef} style={{ height: '100%', overflow: 'hidden' }}>
      <div
        ref={innerRef}
        className={className}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${100 / scale}%`,
        }}
      >
        {children}
      </div>
    </div>
  );
}