import { ProcessResult } from "@/app/llm-processing/page";
import { useMemo, useRef, useEffect, useState } from "react";
import * as d3 from "d3";

const specDims = ['dataSchema', 'mark', 'encoding', 'design'] as const;
const dimDisplayNames: Record<string, string> = {
  'overall': 'Overall',
  'dataSchema': 'Data Schema',
  'mark': 'Mark',
  'encoding': 'Encoding',
  'design': 'Design'
};

const AccuracyVis = (props: { processResult: ProcessResult[] }) => {
  const { processResult } = props;
  const overallChartRef = useRef<SVGSVGElement>(null);
  const detailChartRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Listen for container width changes to implement responsiveness
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.getBoundingClientRect().width);
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate overall accuracy for each dimension
  const accuracyByDim = useMemo(() => {
    const dataSchema: number[] = processResult.map((result) => {
      const evaluation = result.evaluation;
      const matches = evaluation?.categoryMatches.DataSchema
      return matches.matched === matches.total ? 1 : 0
    })
    const mark: number[] = processResult.map((result) => {
      const evaluation = result.evaluation;
      const matches = evaluation?.categoryMatches.Mark
      return matches.matched === matches.total ? 1 : 0
    })
    const encoding: number[] = processResult.map((result) => {
      const evaluation = result.evaluation;
      const matches = evaluation?.categoryMatches.Encoding
      return matches.matched === matches.total ? 1 : 0
    })
    const design: number[] = processResult.map((result) => {
      const evaluation = result.evaluation;
      const matches = evaluation?.categoryMatches.Design
      return matches.matched === matches.total ? 1 : 0
    })

    // Calculate overall accuracy (Data Schema, Mark, and Encoding all correct)
    const overall: number[] = processResult.map((result, index) => {
      return (dataSchema[index] === 1 && mark[index] === 1 && encoding[index] === 1) ? 1 : 0
    })

    return {
      overall: overall.reduce((a, b) => a + b, 0) / overall.length,
      dataSchema: dataSchema.reduce((a, b) => a + b, 0) / dataSchema.length,
      mark: mark.reduce((a, b) => a + b, 0) / mark.length,
      encoding: encoding.reduce((a, b) => a + b, 0) / encoding.length,
      design: design.reduce((a, b) => a + b, 0) / design.length,
    }
  }, [processResult]);

  // Get explicit/implicit accuracy for each dimension
  const dataSchemaAcc = useMemo(() => {
    const dataSchema = processResult.map((result) => {
      const explanation = result.explanation.DataSchema;
      const evaluation = result.evaluation;
      let implicitCount = 0;
      let explicitCount = 0;

      let implicitMatch = 0;
      let explicitMatch = 0;

      evaluation?.details.forEach(detail => {
        if (detail.category === 'DataSchema') {
          const prop = detail.property.replace(/encoding./g, '');
          const explicit = explanation.find((d: any) => d.property === prop)?.explicit || false;
          if (explicit) {
            explicitCount++;
            if (detail.matched) {
              explicitMatch++;
            }
          } else {
            implicitCount++;
            if (detail.matched) {
              implicitMatch++;
            }
          }
        }
      })

      return {
        id: result.id,
        implicitCount,
        explicitCount,
        implicitMatch,
        explicitMatch,
      }
    });

    const impTotalCount = dataSchema.reduce((a, b) => a + b.implicitCount, 0);
    const expTotalCount = dataSchema.reduce((a, b) => a + b.explicitCount, 0);

    const impTotalMatch = dataSchema.reduce((a, b) => a + b.implicitMatch, 0);
    const expTotalMatch = dataSchema.reduce((a, b) => a + b.explicitMatch, 0);

    const impAccuracy = impTotalCount === 0 ? 0 : impTotalMatch / impTotalCount;
    const expAccuracy = expTotalCount === 0 ? 0 : expTotalMatch / expTotalCount;

    return {
      implicitAccuracy: impAccuracy,
      explicitAccuracy: expAccuracy,
    }
  }, [processResult]);

  const markAcc = useMemo(() => {
    const mark = processResult.map((result) => {
      const explanation = result.explanation.Mark;
      const evaluation = result.evaluation;
      let implicitCount = 0;
      let explicitCount = 0;

      let implicitMatch = 0;
      let explicitMatch = 0;

      evaluation?.details.forEach(detail => {
        if (detail.category === 'Mark') {
          const prop = detail.property;
          const explicit = explanation.find((d: any) => d.property === prop)?.explicit || false;
          if (explicit) {
            explicitCount++;
            if (detail.matched) {
              explicitMatch++;
            }
          } else {
            implicitCount++;
            if (detail.matched) {
              implicitMatch++;
            }
          }
        }
      })

      return {
        id: result.id,
        implicitCount,
        explicitCount,
        implicitMatch,
        explicitMatch,
      }
    });

    const impTotalCount = mark.reduce((a, b) => a + b.implicitCount, 0);
    const expTotalCount = mark.reduce((a, b) => a + b.explicitCount, 0);

    const impTotalMatch = mark.reduce((a, b) => a + b.implicitMatch, 0);
    const expTotalMatch = mark.reduce((a, b) => a + b.explicitMatch, 0);

    const impAccuracy = impTotalCount === 0 ? 0 : impTotalMatch / impTotalCount;
    const expAccuracy = expTotalCount === 0 ? 0 : expTotalMatch / expTotalCount;

    return {
      implicitAccuracy: impAccuracy,
      explicitAccuracy: expAccuracy,
    }
  }, [processResult]);

  const encodingAcc = useMemo(() => {
    const encoding = processResult.map((result) => {
      const explanation = result.explanation.Encoding;
      const evaluation = result.evaluation;
      let implicitCount = 0;
      let explicitCount = 0;

      let implicitMatch = 0;
      let explicitMatch = 0;

      evaluation?.details.forEach(detail => {
        if (detail.category === 'Encoding') {
          const prop = detail.property;
          const explicit = explanation.find((d: any) => d.property === prop)?.explicit || false;
          if (explicit) {
            explicitCount++;
            if (detail.matched) {
              explicitMatch++;
            }
          } else {
            implicitCount++;
            if (detail.matched) {
              implicitMatch++;
            }
          }
        }
      })

      return {
        id: result.id,
        implicitCount,
        explicitCount,
        implicitMatch,
        explicitMatch,
      }
    });

    const impTotalCount = encoding.reduce((a, b) => a + b.implicitCount, 0);
    const expTotalCount = encoding.reduce((a, b) => a + b.explicitCount, 0);

    const impTotalMatch = encoding.reduce((a, b) => a + b.implicitMatch, 0);
    const expTotalMatch = encoding.reduce((a, b) => a + b.explicitMatch, 0);

    const impAccuracy = impTotalCount === 0 ? 0 : impTotalMatch / impTotalCount;
    const expAccuracy = expTotalCount === 0 ? 0 : expTotalMatch / expTotalCount;

    return {
      implicitAccuracy: impAccuracy,
      explicitAccuracy: expAccuracy,
    }
  }, [processResult]);

  const designAcc = useMemo(() => {
    const design = processResult.map((result) => {
      const explanation = result.explanation.Design;
      const evaluation = result.evaluation;
      let implicitCount = 0;
      let explicitCount = 0;

      let implicitMatch = 0;
      let explicitMatch = 0;

      evaluation?.details.forEach(detail => {
        if (detail.category === 'Design') {
          const prop = detail.property;
          const explicit = explanation?.find((d: any) => d.property === prop)?.explicit || false;
          if (explicit) {
            explicitCount++;
            if (detail.matched) {
              explicitMatch++;
            }
          } else {
            implicitCount++;
            if (detail.matched) {
              implicitMatch++;
            }
          }
        }
      })

      return {
        id: result.id,
        implicitCount,
        explicitCount,
        implicitMatch,
        explicitMatch,
      }
    });

    const impTotalCount = design.reduce((a, b) => a + b.implicitCount, 0);
    const expTotalCount = design.reduce((a, b) => a + b.explicitCount, 0);

    const impTotalMatch = design.reduce((a, b) => a + b.implicitMatch, 0);
    const expTotalMatch = design.reduce((a, b) => a + b.explicitMatch, 0);

    const impAccuracy = impTotalCount === 0 ? 0 : impTotalMatch / impTotalCount;
    const expAccuracy = expTotalCount === 0 ? 0 : expTotalMatch / expTotalCount;

    return {
      implicitAccuracy: impAccuracy,
      explicitAccuracy: expAccuracy,
    }
  }, [processResult]);

  // Draw overall accuracy bar chart
  useEffect(() => {
    if (!overallChartRef.current || !containerWidth) return;

    const margin = { top: 30, right: containerWidth > 500 ? 50 : 30, bottom: 50, left: 50 };
    const width = containerWidth - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const chartColors = {
      main: '#b7ec98', // Blue,
      text: '#374151', // Dark gray, text color
      grid: '#E5E7EB', // Grid line color
      highlight: '#b7ec98' // Highlight color
    };

    const svg = d3.select(overallChartRef.current);
    svg.selectAll("*").remove();

    const chart = svg
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Include overall in the accuracy chart
    const overallChartDims = ['overall', ...specDims] as const;
    const data = overallChartDims.map(dim => ({
      dimension: dim,
      displayName: dimDisplayNames[dim],
      accuracy: accuracyByDim[dim as keyof typeof accuracyByDim]
    }));

    const x = d3.scaleBand()
        .domain(data.map(d => d.displayName))
        .range([0, width])
        .padding(0.4);

    const y = d3.scaleLinear()
        .domain([0, 1])
        .nice()
        .range([height, 0]);


    // Add title
    chart.append("text")
        .attr("class", "fill-neutral-600")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Accuracy by Dimension");

    // Add grid lines
    chart.append("g")
        .attr("class", "grid")
        .attr("stroke", chartColors.grid)
        .attr("stroke-dasharray", "4,3")
        .attr("stroke-opacity", 0.2)
        .call(
            d3.axisLeft(y)
                .ticks(5)
                .tickSize(-width)
                .tickFormat(() => "")
        );

    // Add x-axis
    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "11px")
        .style("fill", chartColors.text);

    // Add y-axis
    chart.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => d3.format(".0%")(d as number)))
        .selectAll("text")
        .style("font-size", "11px")
        .style("fill", chartColors.text);

    // Add y-axis label
    chart.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", chartColors.text)
        .text("Accuracy");

    // Draw bar chart
    chart.selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.displayName) as number)
        .attr("width", x.bandwidth())
        .attr("y", d => y(d.accuracy))
        .attr("height", d => height - y(d.accuracy))
        .attr("fill", chartColors.main)
        .on("mouseover", function() {
          d3.select(this)
              .transition()
              .duration(200)
              .attr("fill", chartColors.highlight);
        })
        .on("mouseout", function() {
          d3.select(this)
              .transition()
              .duration(200)
              .attr("fill", chartColors.main);
        });

    // Add value labels
    chart.selectAll(".label")
        .data(data)
        .join("text")
        .attr("class", "label")
        .attr("x", d => (x(d.displayName) as number) + x.bandwidth() / 2)
        .attr("y", d => y(d.accuracy) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("font-weight", "500")
        .style("fill", chartColors.text)
        .text(d => d3.format(".1%")(d.accuracy));

  }, [accuracyByDim, containerWidth]);

  // Draw explicit/implicit accuracy comparison chart
  useEffect(() => {
    if (!detailChartRef.current || !containerWidth) return;

    const margin = { top: 30, right: 100, bottom: 50, left: 50 };
    const width = containerWidth - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const chartColors = {
      explicit: '#b7ec98', // Blue
      // explicit: '#3B82F6', // Blue
      implicit: '#98c6ec', // Orange
      text: '#374151', // Dark gray, text color
      grid: '#E5E7EB', // Grid line color
    };

    const svg = d3.select(detailChartRef.current);
    svg.selectAll("*").remove();

    const chart = svg
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Process data
    const categories = specDims.map(dim => dimDisplayNames[dim]);
    const types = ['Explicit', 'Implicit'];

    const x0 = d3.scaleBand()
        .domain(categories)
        .range([0, width])
        .padding(0.2);

    const x1 = d3.scaleBand()
        .domain(types)
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const y = d3.scaleLinear()
        .domain([0, 1])
        .nice()
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(types)
        .range([chartColors.explicit, chartColors.implicit]);


    // Add title
    chart.append("text")
        .attr("class", "fill-neutral-600")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Comparison of Explicit and Implicit Accuracy");

    // Add grid lines
    chart.append("g")
        .attr("class", "grid")
        .attr("stroke", chartColors.grid)
        .attr("stroke-dasharray", "4,3")
        .attr("stroke-opacity", 0.2)
        .call(
            d3.axisLeft(y)
                .ticks(5)
                .tickSize(-width)
                .tickFormat(() => "")
        );

    // Add x-axis
    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0))
        .selectAll("text")
        .style("font-size", "11px")
        .style("fill", chartColors.text);

    // Add y-axis
    chart.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => d3.format(".0%")(d as number)))
        .selectAll("text")
        .style("font-size", "11px")
        .style("fill", chartColors.text);

    // Add y-axis label
    chart.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", chartColors.text)
        .text("Accuracy");

    // Draw grouped bar chart
    const categoryGroups = chart.selectAll(".category-group")
        .data(specDims)
        .join("g")
        .attr("class", "category-group")
        .attr("transform", d => `translate(${x0(dimDisplayNames[d])},0)`);

    // Add explicit and implicit bars for each dimension
    categoryGroups.selectAll(".bar")
        .data(d => {
          let categoryData;
          switch(d) {
            case 'dataSchema': categoryData = dataSchemaAcc; break;
            case 'mark': categoryData = markAcc; break;
            case 'encoding': categoryData = encodingAcc; break;
            case 'design': categoryData = designAcc; break;
          }

          return [
            { type: 'Explicit', value: categoryData.explicitAccuracy },
            { type: 'Implicit', value: categoryData.implicitAccuracy }
          ];
        })
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x1(d.type) as number)
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.value))
        .attr("fill", d => color(d.type) as string)
        .append("title")
        .text(d => `${d.type}: ${d3.format(".1%")(d.value)}`);

    // Add legend
    const legend = chart.append("g")
        .attr("font-size", "11px")
        .attr("text-anchor", "start")
        .selectAll("g")
        .data(types)
        .join("g")
        .attr("transform", (d, i) => `translate(${width + 10},${i * 25})`);

    legend.append("rect")
        .attr("x", 0)
        .attr("width", 16)
        .attr("height", 16)
        .attr("fill", d => color(d) as string)
        .attr("rx", 2)
        .attr("ry", 2);

    legend.append("text")
        .attr("x", 20)
        .attr("y", 8)
        .attr("dy", "0.32em")
        .style("fill", chartColors.text)
        .text(d => d);

  }, [dataSchemaAcc, markAcc, encodingAcc, designAcc, containerWidth]);

  return (
      <div className="accuracy-vis" ref={containerRef}>
        <div className="flex items-center py-2 font-bold text-neutral-600">
          Misinterpretation Analysis
        </div>

        <div className="mb-6">
          <div className="border border-slate-200 rounded-lg p-4">
            <svg ref={overallChartRef}></svg>
          </div>
        </div>

        <div className="mb-6">
          <div className="border border-slate-200 rounded-lg p-4">
            <svg ref={detailChartRef}></svg>
          </div>
        </div>
      </div>
  );
};

export default AccuracyVis;
