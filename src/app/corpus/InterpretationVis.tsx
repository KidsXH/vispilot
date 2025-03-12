import {useEffect, useMemo, useRef, useState} from "react";
import * as d3 from "d3";
import {UtteranceSample} from "@/types";
import {useAppDispatch, useAppSelector} from "@/store";
import {selectChecklist, selectFilteredIDs, setFilteredIDs} from "@/store/features/CorpusSlice";

const specDims = ['dataSchema', 'mark', 'encoding', 'design'] as const;
const categories = ['Explicit', 'Implicit'] as const;

interface SpecMatch {
  id: number;
  spec: string;
  isImplicit: boolean;
}

const InterpretationVis = ({utteranceSamples}: { utteranceSamples: UtteranceSample[] }) => {
  const dispatch = useAppDispatch();
  const filteredIDs = useAppSelector(selectFilteredIDs);
  const svgRef = useRef<SVGSVGElement>(null);
  const checklist = useAppSelector(selectChecklist);
  const [patterns, setPatterns] = useState<{ [key: string]: number[] }>({});
  const [matchedSpecs, setMatchedSpecs] = useState<{
    dataSchema: SpecMatch[],
    mark: SpecMatch[],
    encoding: SpecMatch[],
    design: SpecMatch[]
  }>({
    dataSchema: [],
    mark: [],
    encoding: [],
    design: []
  });

  useEffect(() => {
    const matchedSpecs: {
      dataSchema: SpecMatch[],
      mark: SpecMatch[],
      encoding: SpecMatch[],
      design: SpecMatch[]
    } = {
      dataSchema: [],
      mark: [],
      encoding: [],
      design: []
    }

    const patterns: { [key: string]: number[] } = {};

    utteranceSamples.forEach(sample => {
      const {inference} = sample;
      const pattern = {
        dataSchema: false,
        mark: false,
        encoding: false,
        design: false,
      }
      Object.keys(inference.dataSchema).forEach(_spec => {
        const spec = _spec.replace(/\//g, '.');
        const value = inference.dataSchema[_spec];
        checklist.data.forEach(reg => {
          if (new RegExp(reg).test(spec)) {
            const isImplicit = value.toLowerCase() === 'implicit inference';
            if (isImplicit) pattern.dataSchema = true;
            matchedSpecs.dataSchema.push(
              {id: sample.id, spec, isImplicit}
            );
          }
        })
      })

      Object.keys(inference.mark).forEach(_spec => {
        const spec = _spec.replace(/\//g, '.');
        const value = inference.mark[_spec];
        checklist.mark.forEach(reg => {
          if (new RegExp(reg).test(spec)) {
            const isImplicit = value.toLowerCase() === 'implicit inference';
            if (isImplicit) pattern.mark = true;
            matchedSpecs.mark.push(
              {id: sample.id, spec, isImplicit}
            );
          }
        })
      })

      Object.keys(inference.encoding).forEach(_spec => {
        const spec = _spec.replace(/\//g, '.');
        const value = inference.encoding[_spec];
        checklist.encoding.forEach(reg => {
          const isImplicit = value.toLowerCase() === 'implicit inference';
          if (isImplicit) pattern.encoding = true;
          if (new RegExp(reg).test(spec)) {
            matchedSpecs.encoding.push(
              {id: sample.id, spec, isImplicit}
            );
          }
        })
      })

      Object.keys(inference.design).forEach(_spec => {
        const spec = _spec.replace(/\//g, '.');
        const value = inference.design[_spec];
        checklist.design.forEach(reg => {
          const isImplicit = value.toLowerCase() === 'implicit inference';
          if (isImplicit) pattern.design = true;
          if (new RegExp(reg).test(spec)) {
            matchedSpecs.design.push(
              {id: sample.id, spec, isImplicit}
            );
          }
        })
      })

      const patternString = JSON.stringify(pattern);
      if (!patterns[patternString]) {
        patterns[patternString] = [];
      }
      patterns[patternString].push(sample.id);
    })

    setPatterns(patterns);
    setMatchedSpecs(matchedSpecs)
  }, [checklist, utteranceSamples])

  const badSamples = useMemo(() => {
    return utteranceSamples.filter(sample => {
      const {inference} = sample;
      return Array.isArray(inference.dataSchema) ||
        Array.isArray(inference.mark) ||
        Array.isArray(inference.encoding) ||
        Array.isArray(inference.design);
    })
  }, [utteranceSamples]);

  console.log('Patterns', patterns)
  console.log('Match', matchedSpecs)
  console.log('Bad Samples', badSamples)

  useEffect(() => {
    if (!svgRef.current) return;

    const margin = {top: 45, right: 40, bottom: 25, left: 40};
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight
    d3.select(svgRef.current).selectAll("*").remove();
    const svg = d3.select(svgRef.current)

    // Prepare data for stacked bar chart
    const stackData = specDims.map(spec => {
      const data = matchedSpecs[spec as keyof typeof matchedSpecs];
      const implicitSpecs = data.filter(d => d.isImplicit).map(d => d.id)
      const implicitCount = [...new Set(implicitSpecs)].length;
      const explicitCount = utteranceSamples.length - implicitCount;

      console.log('Stack Data', spec, explicitCount, implicitCount)

      return {
        dimension: spec,
        Explicit: explicitCount,
        Implicit: implicitCount
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

  }, [matchedSpecs, utteranceSamples]);

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
            const filtered = filteredIDs.includes(samples[0]);
            return <div key={pattern}
                        className={`flex justify-between select-none cursor-pointer hover:bg-white border-t py-1.5 px-2 ${filtered ? 'bg-white' : ''}`}
                        onClick={() => {
                          if (filtered) {
                            dispatch(setFilteredIDs([]))
                          }
                          else dispatch(setFilteredIDs(samples))
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