import {useEffect, useMemo, useRef, useState} from "react";
import * as d3 from "d3";
import {UtteranceSample} from "@/types";
import {useAppDispatch, useAppSelector} from "@/store";
import {selectChecklist, selectFilteredIDs, setFilteredIDs} from "@/store/features/CorpusSlice";
import {ProcessResult} from "@/app/llm-processing/page";
import {useInferenceCounts} from "@/app/corpus/InferenceDistribution";

const specDims = ['DataSchema', 'Mark', 'Encoding', 'Design'] as const;
const categories = ['Explicit', 'Implicit'] as const;

interface SpecMatch {
  id: number;
  spec: string;
  isImplicit: boolean;
}

const InterpretationVis = ({processResults}: { processResults: ProcessResult[] }) => {
  const dispatch = useAppDispatch();
  const filteredIDs = useAppSelector(selectFilteredIDs);
  const utteranceSamples = useMemo(() => processResults.map(result => {
    return {
      id: result.id,
      explanation: result.explanation,
      evaluation: result.evaluation,
    }
  }), [processResults])
  const svgRef = useRef<SVGSVGElement>(null);
  const checklist = useAppSelector(selectChecklist);
  const [patterns, setPatterns] = useState<{ [key: string]: string[] }>({});

  // const inferenceCount = useMemo(() => {
  //   return utteranceSamples.map(sample => {
  //     const explanation = sample.explanation;
  //
  //     const counts = specDims.map(spec => {
  //       const implicitCount = explanation[spec].filter((d: any) => d.explicit === false).length;
  //       const explicitCount = explanation[spec].filter((d: any) => d.explicit === true).length;
  //
  //       // if some property in evaluation is not included in the explanation, it is implicit
  //       const evaluation = sample.evaluation;
  //       const missingCount = evaluation?.details
  //         .filter(d => d.category === spec)
  //         .filter((d: any) => {
  //           const prop = spec === 'DataSchema' ? d.property.replace(/encoding./g, '') : d.property;
  //           const propMatch = explanation[spec].some((e: any) => e.property === prop);
  //           return !propMatch;
  //         }).length || 0
  //
  //       return {
  //         explicitCount,
  //         implicitCount,
  //         missingCount,
  //       }
  //     })
  //
  //     return {
  //       id: sample.id,
  //       DataSchema: counts[0],
  //       Mark: counts[1],
  //       Encoding: counts[2],
  //       Design: counts[3],
  //     }
  //   })
  // }, [utteranceSamples])

  const inferenceCount = useInferenceCounts(processResults);

  useEffect(() => {
    const patterns: { [key: string]: string[] } = {};

    inferenceCount.forEach(count => {
      const pattern = {
        dataSchema: count.DataSchema.implicitCount + count.DataSchema.missingCount > 0,
        mark: count.Mark.implicitCount + count.Mark.missingCount > 0,
        encoding: count.Encoding.implicitCount + count.Encoding.missingCount > 0,
        design: count.Design.implicitCount + count.Design.missingCount > 0,
      }

      const patternString = JSON.stringify(pattern);
      if (!patterns[patternString]) {
        patterns[patternString] = [];
      }
      patterns[patternString].push(count.id);
    })
    setPatterns(patterns);
  }, [inferenceCount])

  useEffect(() => {
    if (!svgRef.current) return;

    const margin = {top: 45, right: 40, bottom: 25, left: 40};
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight
    d3.select(svgRef.current).selectAll("*").remove();
    const svg = d3.select(svgRef.current)

    // Prepare data for stacked bar chart
    const stackData = specDims.map(spec => {
      // implicitCount = sum of missing + implicit
      const implicitCount = inferenceCount.map(d => d[spec].implicitCount + d[spec].missingCount).reduce((a, b) => a + b, 0);
      const explicitCount = inferenceCount.map(d => d[spec].explicitCount).reduce((a, b) => a + b, 0);


      const expPercent = (explicitCount / (explicitCount + implicitCount) * 100)
      const impPercent = 100 - expPercent;

      console.log('Stack Data', spec, explicitCount, implicitCount, expPercent.toFixed(0), impPercent.toFixed(0))

      return {
        dimension: spec,
        Explicit: expPercent,
        Implicit: impPercent
      }
    })

    // Stack the data
    const stack = d3.stack<any>()
      .keys(categories)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const stackedData = stack(stackData);

    // Scales
    const x = d3.scaleBand()
      .domain(specDims)
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(stackedData, d => d3.max(d, d => d[1])) || 0])
      .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal()
      .domain(specDims)
      .range(['#6495ED', '#FF7F52', '#008080', '#9370DB']);

    const opacity = d3.scaleOrdinal()
      .domain(categories)
      .range([1.0, 0.4])

    // Add bars
    svg.selectAll("g.category")
      .data(stackedData)
      .join("g")
      .attr("class", "category")
      // @ts-expect-error
      .attr("opacity", d => opacity(d.key))
      .selectAll("rect")
      .data(d => d)
      .join("rect")
      .attr("x", d => x(d.data.dimension) || 0)
      .attr("y", d => y(d[1]))
      // @ts-expect-error
      .attr("fill", d => color(d.data.dimension))
      .attr("height", d => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth());

    // Add axes
    svg.append("g")
      .attr("transform", `translate(${0}, ${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "middle")
      .attr('class', d => `${d}`)

    svg.append("g")
      .attr("transform", `translate(${margin.left}, ${0})`)
      .call(d3.axisLeft(y));

    // Add legend
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(0, 2)`);

    categories.toReversed().forEach((cat, i) => {
      const legendCol = legend.append("g")
        .attr("transform", `translate(${width - margin.right - 15}, ${i * 16 + 4})`);

      specDims.forEach((spec, j) => {
        legendCol.append("rect")
          .attr("width", 12)
          .attr("height", 12)
          // @ts-expect-error
          .attr("fill", color(spec))
          // @ts-expect-error
          .attr("opacity", opacity(cat))
          .attr("x", j * 12)
      });

      legendCol.append("text")
        .attr("x", -4)
        .attr("y", 10)
        .attr("font-size", 12)
        .attr("text-anchor", "end")
        .text(cat === 'Implicit' ? 'Partially or Completely Implicit' : 'Completely Explicit');
    });

  });

  return <>
    <div className="flex py-2 font-bold text-neutral-600">
      LLM Interpretation
    </div>
    <div className="w-full h-[260px]">
      <svg ref={svgRef} className="w-full h-full border"/>
    </div>
    {/*pattern list*/}
    <div className="flex flex-col mt-1">
      <h4 className="flex font-semibold text-neutral-600 py-1">Patterns</h4>
      <div className="flex flex-col h-[220px] overflow-auto">
        {Object.entries(patterns)
          .sort((a, b) => {
            const aCount = a[1].length;
            const bCount = b[1].length;
            if (aCount > bCount) return -1;
            if (aCount < bCount) return 1;
            return 0;
          })
          .map(([pattern, samples]) => {
            const patternObj = JSON.parse(pattern);
            const filtered = filteredIDs.includes(Number(samples[0]));
            return <div key={pattern}
                        className={`flex justify-between select-none cursor-pointer hover:bg-white border-t py-1.5 px-2 ${filtered ? 'bg-white' : ''}`}
                        onClick={() => {
                          if (filtered) {
                            dispatch(setFilteredIDs([]))
                          } else dispatch(setFilteredIDs(samples.map(s => Number(s))))
                        }}
            >
              <span className={`text-data font-bold ${patternObj.dataSchema ? 'opacity-40' : ''}`}>Data</span>
              <span className={`text-mark font-bold ${patternObj.mark ? 'opacity-40' : ''}`}>Mark</span>
              <span className={`text-encoding font-bold ${patternObj.encoding ? 'opacity-40' : ''}`}>Encoding</span>
              <span className={`text-design font-bold ${patternObj.design ? 'opacity-40' : ''}`}>Design</span>
              <span className="text-gray-500 w-10 text-end pr-2">{samples.length}</span>
            </div>
          })}
      </div>
    </div>
  </>
}

export default InterpretationVis;