import {useCallback, useEffect, useRef} from "react";
import {useAppDispatch} from "@/store";
import {clearVegaElementHighlight, setVegaElementHighlight} from "@/store/features/CanvasSlice";

const SVGRenderer = ({svgString, selectable}: { svgString: string, selectable: boolean }) => {
  const containerRef = useRef<SVGGElement>(null);
  const dispatch = useAppDispatch()

  const addSVGElementListeners = useCallback((svgElement: SVGGElement) => {
    let isSelecting = false;
    let startPoint: [number, number] | null = null;
    let selectionRect: SVGRectElement | null = null;

    const handleMouseDown = (e: MouseEvent) => {
      isSelecting = true;
      const svgPoint = getSVGPoint(svgElement, e.clientX, e.clientY);
      startPoint = [svgPoint.x, svgPoint.y];

      // Clear previous selectionHighlight
      dispatch(clearVegaElementHighlight())

      // Create selection rectangle
      selectionRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      selectionRect.setAttribute('x', String(svgPoint.x));
      selectionRect.setAttribute('y', String(svgPoint.y));
      selectionRect.setAttribute('width', '0');
      selectionRect.setAttribute('height', '0');
      selectionRect.setAttribute('stroke-width', '1');
      selectionRect.setAttribute('fill-opacity', '0.1');
      selectionRect.classList.add('stroke-blue-300', 'fill-blue-300/70')
      svgElement.appendChild(selectionRect);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isSelecting || !startPoint || !selectionRect) return;

      const svgPoint = getSVGPoint(svgElement, e.clientX, e.clientY);
      const currentPoint: [number, number] = [svgPoint.x, svgPoint.y];

      // Update selection rectangle
      const minX = Math.min(startPoint[0], currentPoint[0]);
      const minY = Math.min(startPoint[1], currentPoint[1]);
      const width = Math.abs(currentPoint[0] - startPoint[0]);
      const height = Math.abs(currentPoint[1] - startPoint[1]);

      selectionRect.setAttribute('x', String(minX));
      selectionRect.setAttribute('y', String(minY));
      selectionRect.setAttribute('width', String(width));
      selectionRect.setAttribute('height', String(height));
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isSelecting || !startPoint || !selectionRect) return;

      const svgPoint = getSVGPoint(svgElement, e.clientX, e.clientY);
      const endPoint: [number, number] = [svgPoint.x, svgPoint.y];

      // Process selection
      const selectedArea: [number, number, number, number] = [
        startPoint[0], startPoint[1], endPoint[0], endPoint[1]
      ];

      // Log selected elements
      const selectedElementInfo = getVegaElementsInSelection(selectedArea, svgElement);
      const selectedElements = selectedElementInfo.map(item => item.elem);

      if (selectedElements.length > 0) {
        // calculate the bounding box of selected elements
        const bbox = selectedElements[0].getBoundingClientRect();
        selectedElements.forEach((element) => {
          const elementBbox = element.getBoundingClientRect();
          const x2 = Math.max(bbox.x + bbox.width, elementBbox.x + elementBbox.width);
          const y2 = Math.max(bbox.y + bbox.height, elementBbox.y + elementBbox.height);
          bbox.x = Math.min(bbox.x, elementBbox.x);
          bbox.y = Math.min(bbox.y, elementBbox.y);
          bbox.width = x2 - bbox.x;
          bbox.height = y2 - bbox.y;
        })

        const svgPoint = getSVGPoint(svgElement, bbox.x, bbox.y);

        dispatch(setVegaElementHighlight({
          containerPos: [svgElement.getBoundingClientRect().x, svgElement.getBoundingClientRect().y],
          bbox: [svgPoint.x, svgPoint.y, bbox.width, bbox.height],
          elements: selectedElementInfo.map(item => item.type)
        }))
      }

      // Clean up
      if (selectionRect && selectionRect.parentNode) {
        selectionRect.parentNode.removeChild(selectionRect);
        selectionRect = null;
      }
      isSelecting = false;
      startPoint = null;
    };
    // Add event listeners to SVG element
    svgElement.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Return cleanup function
    return () => {
      svgElement.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dispatch]);

  useEffect(() => {
    if (containerRef.current) {
      // Parse the SVG string
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
      const svgElement = svgDoc.documentElement;

      // Clear previous content
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }

      containerRef.current.appendChild(document.importNode(svgElement, true));
      if (selectable) {
        return addSVGElementListeners(containerRef.current)
      }
    }
  }, [svgString, selectable, addSVGElementListeners]);

  return <g ref={containerRef} className="vega-visualization"/>;
};


// Helper function to get SVG coordinates
const getSVGPoint = (svg: SVGGElement, x: number, y: number) => {
  const point = svg.ownerSVGElement?.createSVGPoint() ||
    document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGPoint();
  point.x = x;
  point.y = y;

  // Convert to SVG coordinate system
  if (svg.ownerSVGElement) {
    const ctm = svg.getScreenCTM();
    if (ctm) {
      return point.matrixTransform(ctm.inverse());
    }
  }
  return point;
};


/**
 * Identifies and logs Vega-Lite visualization elements within a selected area
 * @param selectedArea The rectangular area coordinates [startX, startY, endX, endY]
 * @param svgElement The SVG element containing the visualization
 */
const getVegaElementsInSelection = (
  selectedArea: [number, number, number, number],
  svgElement: SVGGElement | null
) => {
  if (!svgElement) return [];

  // Normalize rectangle coordinates (ensure startX < endX and startY < endY)
  const [x1, y1, x2, y2] = selectedArea;
  const rect: [number, number, number, number] = [
    Math.min(x1, x2), Math.min(y1, y2),
    Math.max(x1, x2), Math.max(y1, y2),
  ];

  const elementInfo: Record<string, any[]> = {
    marks: [],
    axes: [],
    legends: [],
    titles: [],
  };

  const selectedElementInfo: { elem: SVGElement, type: string }[] = [];

  // Process marks (data visualization elements)
  const markElements = svgElement.querySelectorAll('.role-mark');
  markElements.forEach(element => {
    if (isElementInSelection(svgElement, element as SVGElement, rect)) {
      const dataValues = extractDataValues(element as SVGElement);
      elementInfo.marks.push({
        type: getMarkType(element),
        bounds: getElementBounds(svgElement, element as SVGElement),
        data: dataValues
      });
      selectedElementInfo.push({elem: element as SVGElement, type: 'mark'});
    }
  });

  // Process axes
  const axisElements = svgElement.querySelectorAll('.role-axis-tick, .role-axis-label, .role-axis-title');
  axisElements.forEach(element => {
    if (isElementInSelection(svgElement, element as SVGElement, rect)) {
      elementInfo.axes.push({
        label: getAxisLabel(element as SVGElement),
        orientation: element.classList.contains('x') ? 'x' : 'y',
        bounds: getElementBounds(svgElement, element as SVGElement)
      });
      if (element.classList.contains('role-axis-label')) {
        selectedElementInfo.push({elem: element as SVGElement, type: 'axis-label'});
      } else if (element.classList.contains('role-axis-title')) {
        selectedElementInfo.push({elem: element as SVGElement, type: 'axis-title'});
      } else {
        selectedElementInfo.push({elem: element as SVGElement, type: 'axis-tick'});
      }
    }
  });

  // Process legends
  const legendElements = svgElement.querySelectorAll('.role-legend');
  legendElements.forEach(element => {
    if (isElementInSelection(svgElement, element as SVGElement, rect)) {
      elementInfo.legends.push({
        title: 'Legend ' + getLegendTitle(element as SVGElement),
        bounds: getElementBounds(svgElement, element as SVGElement)
      });
      selectedElementInfo.push({elem: element as SVGElement, type: 'legend'});
    }
  });

  // Process titles
  const titleElements = svgElement.querySelectorAll('.role-title');
  titleElements.forEach(element => {
    if (isElementInSelection(svgElement, element as SVGElement, rect)) {
      elementInfo.titles.push({
        text: element.textContent,
        bounds: getElementBounds(svgElement, element as SVGElement)
      });
      selectedElementInfo.push({elem: element as SVGElement, type: 'title'});
    }
  });

  const allElements = [...markElements, ...axisElements, ...legendElements, ...titleElements];
  const selectedElements = selectedElementInfo.map(item => item.elem);
  const unSelectedElements = allElements.filter(element => !selectedElements.includes(element as SVGElement));

  if (selectedElements.length > 0) {
    // set opacity of selected elements to 1
    selectedElements.forEach(element => {
      element.setAttribute('opacity', '1');
    });
    // set opacity of unselected elements to 0.3
    unSelectedElements.forEach(element => {
      element.setAttribute('opacity', '0.3');
    });
  } else {
    // set opacity of all elements to 1
    allElements.forEach(element => {
      element.setAttribute('opacity', '1');
    });
  }

  return selectedElementInfo;
};

/**
 * Determine if an SVG element is within the selected area
 */
const isElementInSelection = (container: SVGGElement, element: SVGElement, rect: [number, number, number, number]): boolean => {
  const bounds = getElementBounds(container, element);
  // Check if the element overlaps with selection rectangle
  return !(
    bounds.x > rect[2] || // element is right of selection
    bounds.x + bounds.width < rect[0] || // element is left of selection
    bounds.y > rect[3] || // element is below selection
    bounds.y + bounds.height < rect[1] // element is above selection
  );
};

/**
 * Get the bounding box of an SVG element
 */
const getElementBounds = (container: SVGGElement, element: SVGElement): {
  x: number,
  y: number,
  width: number,
  height: number
} => {
  const bbox = element.getBoundingClientRect()
  const svgPoint = getSVGPoint(container as SVGGElement, bbox.x, bbox.y)
  return {
    x: svgPoint.x,
    y: svgPoint.y,
    width: bbox.width,
    height: bbox.height
  };
};

/**
 * Extract data values from mark elements' attributes or data properties
 */
const extractDataValues = (element: SVGElement): Record<string, any> => {
  // Try to find data in __data__ property (D3 convention)
  // @ts-ignore
  const d3Data = element.__data__;
  if (d3Data) return d3Data;

  // Extract from data attributes
  const dataAttributes: Record<string, any> = {};
  Array.from(element.attributes).forEach(attr => {
    if (attr.name.startsWith('data-')) {
      const key = attr.name.substring(5); // remove 'data-' prefix
      dataAttributes[key] = attr.value;
    }
  });

  return dataAttributes;
};

/**
 * Determine the type of mark from element classes
 */
const getMarkType = (element: Element): string => {
  if (element.classList.contains('mark-rect')) return 'rect';
  if (element.classList.contains('mark-symbol')) return 'symbol';
  if (element.classList.contains('mark-line')) return 'line';
  if (element.classList.contains('mark-area')) return 'area';
  if (element.classList.contains('mark-bar')) return 'bar';
  if (element.classList.contains('mark-text')) return 'text';
  return 'unknown';
};

/**
 * Extract axis label from an axis element
 */
const getAxisLabel = (axisElement: SVGElement): string => {
  return axisElement.classList.toString()
};

/**
 * Extract legend title from a legend element
 */
const getLegendTitle = (legendElement: SVGElement): string => {
  const titleElement = legendElement.querySelector('.legend-title');
  return titleElement ? titleElement.textContent || '' : '';
};

export default SVGRenderer;