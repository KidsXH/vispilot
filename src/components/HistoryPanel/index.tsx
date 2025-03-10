'use client'

import {useAppDispatch, useAppSelector} from "@/store";
import {useEffect, useRef, useState} from "react";
import {createPortal} from 'react-dom';
// import {historyData} from "@/mocks/historyData";
import * as d3 from 'd3';
import {CanvasPath, HistoryItem} from "@/types";
import {selectHistory} from "@/store/features/HistorySlice";
import VegaLite from "@/components/VegaLite";

const HistoryIcon = {
  "pencil": "stylus_note",
  "shape": "shapes",
  "axis": "shuffle",
  "note": "sticky_note",
  "chat": "edit_note",
  "model": "smart_toy"
}

const HistoryPanel = () => {
  const dispatch = useAppDispatch();
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const historyData = useAppSelector(selectHistory);
  // State to track where to render Vega visualizations
  const [vegaContainers, setVegaContainers] = useState<Array<{
    id: number,
    element: HTMLElement,
    vegaString: string
  }>>([]);


  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Reset containers for new render
    setVegaContainers([]);
    const newContainers: Array<{ id: number, element: HTMLElement, vegaString: string }> = [];


    const nTimeStamps = historyData.length;
    const intervalWidth = 80;
    const totalWidth = (nTimeStamps) * intervalWidth + 100;

    const height = svg.clientHeight;
    const width = Math.max(totalWidth, svg.clientWidth);
    const svgElement = d3.select(svg);
    // remove containers
    vegaContainers.forEach((vega) => {
      vega.element.remove();
    })
    svgElement.selectAll('*').remove();
    svgElement.attr('style', `min-width: ${width}px; width: ${width}px; height: ${height}px;`);

    const margin = {top: 20, right: 20, bottom: 20, left: 50};
    const timelineHeight = 50;
    const chatColor = 'oklch(0.442 0.017 285.786)';
    const canvasColor = 'oklch(0.809 0.105 251.813)';

    const timeline = svgElement.append('line')
      .attr('class', 'stroke-4 stroke-neutral-200')
      .attr('x1', margin.left)
      .attr('y1', timelineHeight)
      .attr('x2', width - margin.right)
      .attr('y2', timelineHeight);

    const chatLabelGroup = svgElement.append('g');
    const canvasLabelGroup = svgElement.append('g');

    historyData.forEach((d, i) => {
      const x = margin.left + i * intervalWidth;
      const y = timelineHeight;

      if (d.type === 'chat') {
        const node = chatLabelGroup.append('g').attr('class', 'cursor-pointer')

        node.append('circle')
          .attr('fill', chatColor)
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', 18)

        node.append('text')
          .attr('class', 'fill-white material-symbols-outlined')
          .attr('x', x)
          .attr('y', y + 12)
          .attr('font-size', '12px')
          .attr('text-anchor', 'middle')
          .text(HistoryIcon['chat']);

        const addTooltip = () => {
          const tooltip = node.append('g').attr('class', 'tooltip');
          // render the linkage line
          tooltip.append('line')
            .attr('class', `stroke-3`)
            .attr('stroke', chatColor)
            .attr('x1', x)
            .attr('y1', y - 9)
            .attr('x2', x)
            .attr('y2', y - 30);

          // render label bg
          const textContent = d.content as string;
          const textWidth = Math.max(80, textContent.length * 8 + 16);
          tooltip.append('rect')
            .attr('fill', chatColor)
            .attr('x', x - textWidth / 2)
            .attr('y', y - 50)
            .attr('rx', 4)
            .attr('ry', 4)
            .attr('width', textWidth)
            .attr('height', 25);

          tooltip.append('text')
            .attr('class', 'text-sm fill-white font-bold')
            .attr('x', x)
            .attr('y', y - 32)
            .attr('text-anchor', 'middle')
            .text(d.content as string);
        }

        node.on('click', () => {
          // check if the node already has a tooltip
          const existingTooltip = node.selectAll('.tooltip');
          console.log(existingTooltip)
          if (existingTooltip.size() > 1) {
            existingTooltip.remove();
            return;
          }
          addTooltip();
        })

        node.on('mouseenter', () => {
          addTooltip();
        })

        node.on('mouseleave', () => {
          node.select('.tooltip').remove();
        })

      } else if (d.type === 'canvas') {
        const node = chatLabelGroup.append('g').attr('class', 'cursor-pointer')
        node.append('circle')
          .attr('fill', canvasColor)
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', 18)
        node.append('text')
          .attr('class', 'fill-white material-symbols-outlined')
          .attr('x', x)
          .attr('y', y + 12)
          .attr('font-size', '12px')
          .attr('text-anchor', 'middle')
          .text(HistoryIcon[(d.content as CanvasPath).type]);
        node.on('click', () => {
          // render a tooltip
          const tooltip = node.append('g');
          tooltip.append('text')
            .attr('class', 'fill-white font-bold')
            .attr('x', x)
            .attr('y', y - 50)
            .attr('text-anchor', 'middle')
            .text((d.content as CanvasPath).text || (d.content as CanvasPath).type);
        })
      } else {
        // render the linkage line
        chatLabelGroup.append('line')
          .attr('class', `stroke-3`)
          .attr('stroke', canvasColor)
          .attr('x1', x)
          .attr('y1', y)
          .attr('x2', x)
          .attr('y2', y + 30);

        // render a blank rectangle
        canvasLabelGroup.append('rect')
          .attr('class', `fill-neutral-100 stroke-4`)
          .attr('stroke', canvasColor)
          .attr('x', x - 60)
          .attr('y', y + 30)
          .attr('rx', 2)
          .attr('ry', 2)
          .attr('width', 120)
          .attr('height', 72);

        // render the label bg
        canvasLabelGroup.append('rect')
          .attr('fill', canvasColor)
          .attr('x', x - 40)
          .attr('y', y + 30 + 72 + 6)
          .attr('rx', 4)
          .attr('ry', 4)
          .attr('width', 80)
          .attr('height', 25);

        // render the canvas label
        canvasLabelGroup.append('text')
          .attr('class', 'text-sm fill-white font-bold')
          .attr('x', x)
          .attr('y', y + 30 + 72 + 23)
          .attr('text-anchor', 'middle')
          .text('VIS');

        // Create the foreignObject
        const foreignObject = svgElement.append('foreignObject')
          .attr('x', x - 60)
          .attr('y', y + 30)
          .attr('width', 120)
          .attr('height', 72);

        // Create a div inside the foreignObject
        const container = document.createElement('div');
        container.className = 'w-full h-full bg-white rounded-md shadow-md';

        // Append the div to the foreignObject
        foreignObject.node()?.appendChild(container);

        // Store reference to render Vega later
        newContainers.push({
          id: i,
          element: container,
          vegaString: d.content as string
        });

      }
    });
    setVegaContainers(newContainers);
  }, [historyData]);

  useEffect(() => {
      if (svgContainerRef.current) {
        svgContainerRef.current.scrollLeft = svgContainerRef.current.scrollWidth;
      }
  }, [historyData]);

  return (
    <>
      <div className='flex flex-col p-2 min-w-0'>
        <div className='font-bold text-xl'>History</div>
        <div className='h-[240px] flex overflow-auto w-full pb-2 items-center mt-1' ref={svgContainerRef}>
          <svg ref={svgRef} className='h-[210px] w-[1200px] select-none'/>
          {vegaContainers.map((container) => (
            createPortal(
              <div className="w-full h-full flex items-center justify-center mini-vega">
                <VegaLite
                  vegaString={container.vegaString}
                />
              </div>,
              container.element,
            )
          ))}
        </div>
      </div>
    </>
  );
};

export default HistoryPanel;
