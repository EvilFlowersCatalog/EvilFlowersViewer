export const debounce = (func: any, timeout = 300) => {
  let timer: any;
  return (...args: any) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
};

export const resizeElements = (
  children: any,
  width: number,
  height: number,
  oldWidth: number,
  oldHeight: number
) => {
  for (const child of children) {
    // Adjust stroke width
    if (child) {
      const strokeWidth = child.getAttribute('stroke-width');
      if (strokeWidth) {
        const newStrokeWidth = (parseFloat(strokeWidth) / oldWidth) * width;
        child.setAttribute('stroke-width', newStrokeWidth.toString());
      }

      // FOR STRAIGHT LINE
      if (child instanceof SVGLineElement) {
        const x1 = child.x1.baseVal.value;
        const y1 = child.y1.baseVal.value;
        const x2 = child.x2.baseVal.value;
        const y2 = child.y2.baseVal.value;

        // Adjust height and width for position
        child.setAttribute('x1', ((x1 / oldWidth) * width).toString());
        child.setAttribute('y1', ((y1 / oldHeight) * height).toString());
        child.setAttribute('x2', ((x2 / oldWidth) * width).toString());
        child.setAttribute('y2', ((y2 / oldHeight) * height).toString());
      }
      // FOR RECT
      else if (child instanceof SVGRectElement) {
        const x = child.x.baseVal.value;
        const y = child.y.baseVal.value;
        const entWidth = child.width.baseVal.value;
        const entHeight = child.height.baseVal.value;

        // Adjust height and width for position
        child.setAttribute('x', ((x / oldWidth) * width).toString());
        child.setAttribute('y', ((y / oldHeight) * height).toString());
        child.setAttribute('width', ((entWidth / oldWidth) * width).toString());
        child.setAttribute(
          'height',
          ((entHeight / oldHeight) * height).toString()
        );
      }
      // FOR LINE
      else if (child instanceof SVGPathElement) {
        const d = child.getAttribute('d') as string;
        if (d) {
          const coords = d.split(' ').map((coord) => {
            const command = coord[0];
            const points = coord.substring(1).split(',');
            const x = ((parseFloat(points[0]) / oldWidth) * width).toFixed(0);
            const y = ((parseFloat(points[1]) / oldHeight) * height).toFixed(0);

            if (command && x && y) return `${command}${x},${y}`;
          });
          child.setAttribute('d', coords.join(' '));
        }
      }
    }
  }
};
