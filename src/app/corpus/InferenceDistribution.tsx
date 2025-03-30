import React, {useEffect, useMemo, useRef} from 'react';
import * as d3 from 'd3';
import {ProcessResult} from "@/app/llm-processing/page";

const specDims = ['DataSchema', 'Mark', 'Encoding', 'Design'] as const;

const InferenceDistribution = ({processResults}: { processResults: ProcessResult[] }) => {

  const utteranceSamples = useMemo(() => processResults.map(result => {
    return {
      id: result.id,
      explanation: result.explanation,
      evaluation: result.evaluation,
    }
  }), [processResults])

  const svgRef = useRef<SVGSVGElement>(null);
  const svgRef2 = useRef<SVGSVGElement>(null);

  // Revised to return arrays of paths instead of just counts
  const inferenceDetails = utteranceSamples.map(sample => {
    const implicitPaths: string[] = [];
    const missingPaths: string[] = [];

    // Collect paths of implicit inference items
    specDims.forEach((spec) => {
      const implicitItems = sample.explanation[spec]?.filter((d: any) => d.explicit === false) || [];
      implicitItems.forEach((item: any) => {
        const path = `${spec}.${item.property}`;
        implicitPaths.push(path);
      });
    })

    // Collect paths of missing items
    const evaluation = sample.evaluation;
    specDims.forEach((spec) => {
      const missingItems = evaluation?.details
        .filter(d => d.category === spec)
        .filter((d: any) => {
          const prop = spec === 'DataSchema' ? d.property.replace(/encoding./g, '') : d.property;
          const propMatch = sample.explanation[spec]?.some((e: any) => e.property === prop) || false;
          return !propMatch;
        }) || [];

      missingItems.forEach((item: any) => {
        const path = `${spec}.${item.property}`;
        missingPaths.push(path);
      });
    })

    return {
      id: sample.id,
      implicitCount: implicitPaths.length,
      missingCount: missingPaths.length,
      totalCount: implicitPaths.length + missingPaths.length,
      implicitPaths,
      missingPaths,
    };
  });

// For the histogram, we still need just the counts
  const inferenceCounts = inferenceDetails.map(detail => detail.totalCount);

  useEffect(() => {
    if (!utteranceSamples.length || !svgRef.current) return;

    // Create a histogram
    const margin = {top: 30, right: 20, bottom: 30, left: 40};
    const width = 500 - margin.left - margin.right;
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
      .call(d3.axisLeft(y).ticks(5));

    // Add title
    svg.append("text")
      .attr("class", "fill-neutral-600")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Distribution of Implicit Inferences");

  }, [inferenceCounts, utteranceSamples]);

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
      .domain(pathData.map(d => d.path))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(pathData, d => d.total) || 0])
      .range([height, 0]);

    const colorImplicit = '#69b3a2';
    const colorMissing = 'rgb(236,152,152)';

// Add grouped bars
    const groups = svg.selectAll("g.path-group")
      .data(pathData)
      .enter()
      .append("g")
      .attr("class", "path-group")
      .attr("transform", d => `translate(${x0(d.path) || 0},0)`);

    // Create bars for each type (implicit/missing)
    groups.selectAll("rect")
      .data(d => d.missing > 0 ? [{key: 'implicit', value: d.total}, {
        key: 'missing',
        value: d.missing
      }] : [{key: 'implicit', value: d.implicit}])
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", d => y(d.value as number))
      .attr("width", x0.bandwidth())
      .attr("height", d => height - y(d.value as number))
      .attr("fill", d => d.key === 'implicit' ? colorImplicit : colorMissing)
      // Add tooltip functionality
      .on("mouseover", function (event, d) {
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
      .on("mouseout", function () {
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
      .text((d: any) => d.split('.').slice(1).join('.')) // Remove the first part of the path for display
      .style("fill", (d: any) => {
        // Color based on specification class (first part of the path)
        const specClass = d.split('.')[0];
        switch (specClass) {
          case 'Encoding':
            return 'var(--color-encoding)';
          case 'Mark':
            return 'var(--color-mark)';
          case 'DataSchema':
            return 'var(--color-data)';
          case 'Design':
            return 'var(--color-design)';
          default:
            return '#000';
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

export const useInferenceCounts = (processingResults: ProcessResult[]) => {
  const inferenceCounts = useMemo(() => {
    return processingResults.map(sample => {
      const explanation = sample.explanation;

      const counts = specDims.map(spec => {
        const implicitCount = explanation[spec]?.filter((d: any) => d.explicit === false).length || 0;
        const explicitCount = explanation[spec]?.filter((d: any) => d.explicit === true).length || 0;

        // if some property in evaluation is not included in the explanation, it is implicit
        const evaluation = sample.evaluation;
        const missingCount = evaluation?.details
          .filter(d => d.category === spec)
          .filter((d: any) => {
            const prop = spec === 'DataSchema' ? d.property.replace(/encoding./g, '') : d.property;
            const propMatch = explanation[spec]?.some((e: any) => e.property === prop) || false;
            return !propMatch;
          }).length || 0

        return {
          explicitCount,
          implicitCount,
          missingCount,
        }
      })

      return {
        id: sample.id,
        DataSchema: counts[0],
        Mark: counts[1],
        Encoding: counts[2],
        Design: counts[3],
      }
    })
  }, [processingResults])

  return inferenceCounts;
}