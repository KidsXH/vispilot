import React, {useEffect, useRef} from 'react';
import {useAppSelector} from "@/store";
import {selectUtteranceSamples} from "@/store/features/CorpusSlice";
import * as d3 from 'd3';

const InferenceDistribution = () => {
  const utteranceSamples = useAppSelector(selectUtteranceSamples);
  const svgRef = useRef<SVGSVGElement>(null);
  const svgRef2 = useRef<SVGSVGElement>(null);

  // Revised to return arrays of paths instead of just counts
  const inferenceDetails = utteranceSamples.map(sample => {
    const implicitPaths: string[] = [];
    const missingPaths: string[] = [];

    // Collect paths of implicit inference items
    Object.entries(sample.inference).forEach(([category, inferences]) => {
      Object.entries(inferences).forEach(([key, value]) => {
        if (value && value.toLowerCase() === 'implicit inference') {
          // replace '/' with '.' and remove spaces
          implicitPaths.push(`${category}.${key.replace(/\//g, '.').replace(/\s+/g, '')}`);
        }
      });
    });

    // Recursive function to collect missing property paths
    const collectMissingProps = (gtObj: any, infObj: any, path = '') => {
      if (!gtObj || typeof gtObj !== 'object') return;

      for (const [key, value] of Object.entries(gtObj)) {
        // Skip schema and data-related properties
        if (key === '$schema' || key === 'data' || key === 'transform') continue;

        const currentPath = path ? `${path}.${key}` : key;

        // If the key doesn't exist in inference object, not count for the property which has children
        if (!(key in infObj) && value && typeof value !== 'object' && currentPath !== 'mark.type') {
          missingPaths.push(`${currentPath}: ${gtObj[key]}`);
        }
        // If it exists but is an object, recurse deeper
        else if (value && typeof value === 'object' && infObj[key] && typeof infObj[key] === 'object') {
          collectMissingProps(value, infObj[key], currentPath);
        }
      }
    };

    // Collect missing properties in groundTruth but not in inference
    collectMissingProps(sample.groundTruth, sample.vegaLite);

    return {
      id: sample.id,
      implicitCount: implicitPaths.length,
      missingCount: missingPaths.length,
      totalCount: implicitPaths.length + missingPaths.length,
      implicitPaths,
      missingPaths
    };
  });

// For the histogram, we still need just the counts
  const inferenceCounts = inferenceDetails.map(detail => detail.totalCount);

  useEffect(() => {
    if (!utteranceSamples.length || !svgRef.current) return;

    // Create a histogram
    const margin = {top: 30, right: 20, bottom: 30, left: 40};
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

  useEffect(() => {
    if (!utteranceSamples.length || !svgRef2.current) return;

    // Collect all unique paths and count their occurrences
    const pathCounts: Record<string, { implicit: number, missing: number }> = {};

    inferenceDetails.forEach(detail => {
      // Count implicit paths
      detail.implicitPaths.forEach(path => {
        if (!pathCounts[path]) {
          pathCounts[path] = {implicit: 0, missing: 0};
        }
        pathCounts[path].implicit += 1;
      });

      // Count missing paths
      detail.missingPaths.forEach(path => {
        // Extract just the path without the value
        const pathKey = path.split(':')[0].trim();
        if (!pathCounts[pathKey]) {
          pathCounts[pathKey] = {implicit: 0, missing: 0};
        }
        pathCounts[pathKey].missing += 1;
      });
    });

    // Convert to array and sort by total occurrences
    const pathData = Object.entries(pathCounts)
      .map(([path, counts]) => ({
        path,
        implicit: counts.implicit,
        missing: counts.missing,
        total: counts.implicit + counts.missing
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15); // Take top 15 for readability

    // Set up dimensions
    const margin = {top: 30, right: 100, bottom: 120, left: 60};
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Clear previous content
    d3.select(svgRef2.current).selectAll("*").remove();

    const svg = d3.select(svgRef2.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create grouped bar chart data instead of stacked
    const x0 = d3.scaleBand()
      .domain(pathData.map(d => d.missing > 0 ? ' ' + d.path : d.path))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(pathData, d => Math.max(d.implicit, d.missing)) || 0])
      .range([height, 0]);

    const colorImplicit = '#69b3a2';
    const colorMissing = '#e41a1c';

// Add grouped bars
    const groups = svg.selectAll("g.path-group")
      .data(pathData)
      .enter()
      .append("g")
      .attr("class", "path-group")
      .attr("transform", d => `translate(${x0(d.missing > 0 ? ' ' + d.path : d.path) || 0},0)`);

// Create bars for each type (implicit/missing)
    groups.selectAll("rect")
      .data(d => d.missing > 0 ? [{key: 'missing', value: d.missing}, {key: 'implicit', value: d.implicit}] : [{key: 'implicit', value: d.implicit}])
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", d => y(d.value as number))
      .attr("width", x0.bandwidth())
      .attr("height", d => height - y(d.value as number))
      .attr("fill", d => d.key === 'implicit' ? colorImplicit : colorMissing)
      // Add tooltip functionality
      .on("mouseover", function(event, d) {
        const [mouseX, mouseY] = d3.pointer(event, svg.node());

        // Create tooltip group
        const tooltip = svg.append("g")
          .attr("class", "tooltip")
          .attr("transform", `translate(${mouseX + 10},${mouseY - 15})`);

        // Add background rectangle
        tooltip.append("rect")
          .attr("fill", "white")
          .attr("stroke", "#ccc")
          .attr("rx", 3)
          .attr("ry", 3);

        // Add text
        const text = tooltip.append("text")
          .attr("y", 15)
          .attr("x", 5)
          .attr("font-size", "12px")
          .text(`${d.key}: ${d.value}`);

        // Size background based on text
        const bbox = text.node()?.getBBox();
        if (bbox) {
          tooltip.select("rect")
            .attr("width", bbox.width + 10)
            .attr("height", bbox.height + 10);
        }
      })
      .on("mouseout", function() {
        d3.select(svgRef2.current).selectAll(".tooltip").remove();
      });

    // Add x-axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .style("fill", (d: any) => {
        if (d.startsWith(' ')) {
          const path = d.substring(1);
          switch (path) {
            case 'encoding.y.aggregate':
              return 'var(--color-data)';
            case 'encoding.x.bin':
              return 'var(--color-design)';
            case 'encoding.x.timeUnit':
              return 'var(--color-design)';
            case 'encoding.y.axis.format':
              return 'var(--color-design)';
            case 'encoding.y.axis.title':
              return 'var(--color-design)';
            default:
              return '#000';
          }
        }
        else {
          // Color based on specification class (first part of the path)
          const specClass = d.split('.')[0];
          switch (specClass) {
            case 'encoding':
              return 'var(--color-encoding)';
            case 'mark':
              return 'var(--color-mark)';
            case 'dataSchema':
              return 'var(--color-data)';
            case 'design':
              return 'var(--color-design)';
            default:
              return '#000';
          }
        }
      });

    // Add y-axis
    svg.append("g")
      .call(d3.axisLeft(y).ticks(5))


    // Add title
    svg.append("text")
      .attr("class", "fill-neutral-600")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Top 15 Inferred Specification Items");

    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width + 10}, 0)`);

    legend.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", colorImplicit);

    legend.append("text")
      .attr("x", 20)
      .attr("y", 12.5)
      .text("Implicit")
      .style("font-size", "12px");

    legend.append("rect")
      .attr("x", 0)
      .attr("y", 25)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", colorMissing);

    legend.append("text")
      .attr("x", 20)
      .attr("y", 37.5)
      .text("Missing")
      .style("font-size", "12px");

  }, [utteranceSamples, inferenceDetails]);

  return (<>
      <div className="mt-4">
        <svg ref={svgRef} className="border"></svg>
      </div>
      <div className="mt-4">
        <svg ref={svgRef2} className="border"></svg>
      </div>
    </>
  );
}

export default InferenceDistribution;