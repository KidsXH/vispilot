'use client'

import {useAppDispatch} from "@/store";
import {useEffect, useRef} from "react";
import {historyData} from "@/mocks/historyData";
import * as d3 from 'd3';

const HistoryPanel = () => {
  const dispatch = useAppDispatch();
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const nTimeStamps = historyData.length;
    const intervalWidth = 120;
    const totalWidth = (nTimeStamps - 1) * intervalWidth;

    const height = svg.clientHeight;
    const width = Math.max(totalWidth, svg.clientWidth);
    const svgElement = d3.select(svg);
    svgElement.selectAll('*').remove();
    svgElement.attr('viewBox', `0 0 ${width} ${height}`);
    svgElement.attr('width', width);

    const margin = {top: 20, right: 20, bottom: 20, left: 50};
    const timelineHeight = 75;
    const chatColor = 'oklch(0.442 0.017 285.786)';
    const canvasColor = 'oklch(0.809 0.105 251.813)';

    // render a horizontal line as timeline
    const timeline = svgElement.append('line')
      .attr('class', 'stroke-4 stroke-neutral-300')
      .attr('x1', margin.left)
      .attr('y1', timelineHeight)
      .attr('x2', width - margin.right)
      .attr('y2', timelineHeight);

    // render circles for each timestamp
    const circles = svgElement.selectAll('circle')
      .data(historyData)
      .enter()
      .append('circle')
      .attr('fill', d => d.type === 'chat' ? chatColor : canvasColor)
      .attr('cx', (d, i) => margin.left + i * intervalWidth)
      .attr('cy', timelineHeight)
      .attr('r', 6)

    // timestamp labels have two types: 'chat' and 'canvas'
    // render labels for each timestamp, if the type is 'chat', render a chat bubble above the circles, if the type is 'canvas', render a blank rectangle below the circles
    const chatLabelGroup = svgElement.append('g');
    const canvasLabelGroup = svgElement.append('g');

    historyData.forEach((d, i) => {
      const x = margin.left + i * intervalWidth;
      const y = timelineHeight;

      if (d.type === 'chat') {
        // render the linkage line
        chatLabelGroup.append('line')
          .attr('class', `stroke-3`)
          .attr('stroke', chatColor)
          .attr('x1', x)
          .attr('y1', y)
          .attr('x2', x)
          .attr('y2', y - 30);

        // render label bg
        chatLabelGroup.append('rect')
          .attr('fill', chatColor)
          .attr('x', x - 40)
          .attr('y', y - 50)
          .attr('rx', 4)
          .attr('ry', 4)
          .attr('width', 80)
          .attr('height', 25);

        chatLabelGroup.append('text')
          .attr('class', 'text-sm fill-white font-bold')
          .attr('x', x)
          .attr('y', y - 32)
          .attr('text-anchor', 'middle')
          .text(d.title);
      } else if (d.type === 'canvas') {
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
          .attr('class', `fill-neutral-100 stroke-2`)
          .attr('stroke', canvasColor)
          .attr('x', x - 50)
          .attr('y', y + 30)
          .attr('rx', 2)
          .attr('ry', 2)
          .attr('width', 100)
          .attr('height', 60);

        // render the label bg
        canvasLabelGroup.append('rect')
          .attr('fill', canvasColor)
          .attr('x', x - 40)
          .attr('y', y + 30 + 60 + 6)
          .attr('rx', 4)
          .attr('ry', 4)
          .attr('width', 80)
          .attr('height', 25);

        // render the canvas label
        canvasLabelGroup.append('text')
          .attr('class', 'text-sm fill-white font-bold')
          .attr('x', x)
          .attr('y', y + 30 + 60 + 23)
          .attr('text-anchor', 'middle')
          .text(d.title);
      }
    });


  });

  return (
    <>
      <div className='flex flex-col p-2 min-w-0'>
        <div className='font-bold text-xl'>History</div>
        <div className='h-[240px] flex overflow-x-scroll pb-2 items-center mt-1'>
          <svg ref={svgRef} className='h-[210px] w-full'/>
        </div>
      </div>
    </>
  );
};

export default HistoryPanel;
