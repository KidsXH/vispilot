import React, { useEffect, useRef } from 'react';
import { useAppSelector } from "@/store";
import { selectUtteranceSamples } from "@/store/features/CorpusSlice";
import * as d3 from 'd3';

const InferenceDistribution = () => {
  const utteranceSamples = useAppSelector(selectUtteranceSamples);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!utteranceSamples.length || !svgRef.current) return;

    // Calculate number of inferences for each sample
    const inferenceCounts = utteranceSamples.map(sample => {
      // Count non-empty inference items
      const impCount = Object.values(sample.inference).reduce((count, inferences) => {
        // Count keys with non-empty values in each inference category
        const nonEmptyInferences = Object.entries(inferences).filter(([_, value]) =>
          value && value === 'implicit inference');
        return count + nonEmptyInferences.length;
      }, 0);

      // Recursive function to count missing properties
      const countMissingProps = (gtObj: any, infObj: any, path = ''): number => {
        if (!gtObj || typeof gtObj !== 'object') return 0;

        let count = 0;
        for (const [key, value] of Object.entries(gtObj)) {
          // Skip schema and data-related properties
          if (key === '$schema' || key === 'data' || key === 'transform') continue;

          const currentPath = path ? `${path}.${key}` : key;

          // If the key doesn't exist in inference object， not count for the property which has children
          if (!(key in infObj) && value && typeof value !== 'object' && currentPath !== 'mark.type') {
            console.log(`Missing inference for ${currentPath}: ${gtObj[key]} in sample ${sample.id}`);
            count += 1;
          }
          // If it exists but is an object, recurse deeper
          else if (value && typeof value === 'object' && infObj[key] && typeof infObj[key] === 'object') {
            count += countMissingProps(value, infObj[key], currentPath);
          }
        }
        return count;
      };

      // Count missing properties in groundTruth but not in inference
      const missingCount = countMissingProps(sample.groundTruth, sample.vegaLite);

      return impCount + missingCount;
    });

    // Create a histogram
    const margin = { top: 30, right: 20, bottom: 30, left: 40 };
    const width = 300 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create histogram data
    const maxCount = Math.max(...inferenceCounts);
    const bins = d3.histogram()
      .domain([0, maxCount + 1])
      .thresholds(maxCount + 1)
      (inferenceCounts);

    console.log('inferenceCounts bins', bins);
    // Scale for x-axis
    const x = d3.scaleLinear()
      .domain([0, maxCount + 1])
      .range([0, width]);

    // Scale for y-axis
    const y = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length) || 0])
      .range([height, 0]);

    // Add bars
    svg.selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
      .attr("x", d => x(d.x0 || 0))
      .attr("width", d => Math.max(0, x(d.x1 || 0) - x(d.x0 || 0) - 1))
      .attr("y", d => y(d.length))
      .attr("height", d => height - y(d.length))
      .attr("fill", "#69b3a2");

    // Add x-axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(maxCount + 1).tickFormat(d3.format("d")));

    // Add y-axis
    svg.append("g")
      .call(d3.axisLeft(y));

    // Add title
    svg.append("text")
      .attr("class", "fill-neutral-600")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Distribution of Implicit Inferences");

  }, [utteranceSamples]);

  return (
    <div className="mt-4">
      <svg ref={svgRef} className="border"></svg>
    </div>
  );
}

export default InferenceDistribution;