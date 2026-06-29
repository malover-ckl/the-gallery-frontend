// Compute popover position and pass the exact caret location as a CSS variable
function getPopoverStyle(i, cols, rows) {
  const col = i % cols;
  const row = Math.floor(i / cols);

  // Vertical: bottom 2 rows → open upward
  const isBottomRow = row >= rows - 2;
  const vertical = isBottomRow
    ? { bottom: 'calc(100% + 8px)', top: 'auto' }
    : { top: 'calc(100% + 8px)',    bottom: 'auto' };

  // Horizontal: Calculate shift percentage based on column position
  let shiftPercent = 50;
  if (col === 0) shiftPercent = 12; // Far left edge
  else if (col === 1 && cols > 4) shiftPercent = 25; // Left inner
  else if (col === cols - 2 && cols > 4) shiftPercent = 75; // Right inner
  else if (col === cols - 1) shiftPercent = 88; // Far right edge

  return {
    ...vertical,
    left: '50%',
    // We export the horizontal shift as a CSS variable instead of a strict transform
    '--popover-x': `-${shiftPercent}%`, 
    '--arrow-x': `${shiftPercent}%` 
  };
}