'use client';

import {useEffect, useRef, useState} from 'react';
import * as d3 from 'd3';
import {UtteranceSample} from "@/types";
import {useAppDispatch, useAppSelector} from "@/store";
import {setVisDataset, selectUtteranceSamples, setUtteranceSamples, setFilteredIDs} from "@/store/features/CorpusSlice";
import InterpretationVis from "@/app/corpus/InterpretationVis";
import VisSpecList from "@/app/corpus/VisSpecList";
import AccuracyVis from "@/app/corpus/AccuracyVis";
import SampleList from "@/app/corpus/SampleList";
import InferenceDistribution from "@/app/corpus/InferenceDistribution";

export type SpecCategory = 'Explicit' | 'Implicit';
export type TestState = 'no' | 'yes' | 'pending';
const specDims = ['dataSchema', 'mark', 'encoding', 'design'] as const;

const categories = ['Explicit', 'Implicit'] as const;
const datasetList = ['cars.csv', 'movies.csv', 'superstore.csv']

export default function Corpus() {
  const dispatch = useAppDispatch();
  const utteranceSamples = useAppSelector(selectUtteranceSamples);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedIDs, setSelectedIDs] = useState<number[]>([]);
  const [filters, setFilters] = useState<{ [key: string]: SpecCategory }>({
    dataSchema: 'Explicit',
    mark: 'Explicit',
    encoding: 'Explicit',
    design: 'Explicit',
  });

  const [modelName, setModelName] = useState<string>('GPT-4o');
  useEffect(() => {
    const corpusDataFile = `/vispilot/corpusData/${modelName}.json`;
    fetch(corpusDataFile)
      .then(response => response.json())
      .then(data => {
        const utteranceSamples = prepareData(data);
        dispatch(setUtteranceSamples(utteranceSamples));
      })
      .catch(error => {
        console.error('Error loading corpus data:', error);
      });
  }, [dispatch, modelName]);

  useEffect(() => {
    datasetList.forEach((filename) => {
      loadCSVDatasets(filename).then((data) => {
        dispatch(setVisDataset({filename, data}));
      })
    })
  }, [dispatch])

  const filteredData = utteranceSamples.filter(point => {
    return Object.entries(filters).every(([key, value]) =>
      !value || point[key as keyof UtteranceSample] === value
    );
  });

  useEffect(() => {
    if (!svgRef.current) return;

    const margin = {top: 40, right: 40, bottom: 60, left: 60};
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const bubbleCategories = Array.from({length: 3 ** specDims.length}, (_, i) => {
      return specDims.map((_, j) => {
        return categories[Math.floor(i / (3 ** j)) % 3];
      });
    });

    const bubbleData = bubbleCategories.map((category, index) => {
      const filtered = filteredData.filter(d => {
        return specDims.every((spec, i) => {
          return Object.values(d.inference[spec]).some((d) => {
            // if one of value includes the category, return true
          })
        });
      });
      if (filtered.length === 0) return null;
      const avgAccuracy = d3.mean(filtered, d => d.accuracy.design) || 0;
      const avgInferenceLevel = 0;
      const sampleIDs = filtered.map(d => d.id);
      return {
        id: index,
        category,
        accuracy: avgAccuracy,
        inferenceLevel: avgInferenceLevel,
        frequency: filtered.length,
        sampleIDs,
      };
    }).filter(d => d !== null);

    // Scales
    const x = d3.scaleLinear()
      .domain([0, 1])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, 1])
      .range([height, 0]);

    const size = d3.scaleLinear()
      .domain([d3.min(bubbleData, d => d.frequency) || 0,
        d3.max(bubbleData, d => d.frequency) || 0])
      .range([10, 30]);

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .append("text")
      .attr("x", width / 2)
      .attr("y", 40)
      .attr("fill", "black")
      .text("Inference Level");

    svg.append("g")
      .call(d3.axisLeft(y))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -height / 2)
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .text("Accuracy");

    // Add bubbles
    svg.selectAll("circle")
      .data(bubbleData)
      .join("circle")
      .attr("class", 'cursor-pointer hover:stroke-pink-400 hover:stroke-2')
      .attr("cx", d => x(d.inferenceLevel))
      .attr("cy", d => y(d.accuracy))
      .attr("r", d => size(d.frequency))
      .attr("fill", "#4299e1")
      .attr("opacity", 0.7)
      .attr("stroke", d => selectedIDs.includes(d.sampleIDs[0]) ? "pink" : "none")
      .attr("stroke-width", 2)
      .on("click", (event, d) => {
        if (selectedIDs.includes(d.sampleIDs[0])) {
          setSelectedIDs(selectedIDs.filter(id => !d.sampleIDs.includes(id)));
        } else {
          setSelectedIDs(d.sampleIDs);
        }
      })
      .on("mouseover", (event, d) => {
        const tooltip = svg.append("g")
          .attr("class", "tooltip")
          .attr("transform", `translate(${x(d.inferenceLevel) + 10},${y(d.accuracy) - 10})`);

        tooltip.append("rect")
          .attr("fill", "white")
          .attr("stroke", "black")
          .attr("rx", 5)
          .attr("ry", 5);

        const text = tooltip.append("text")
          .attr("y", 15)
          .attr("x", 5);

        text.append("tspan")
          .text(`${d.id} (Freq: ${d.frequency})`)
          .attr("x", 5)
          .attr("dy", 0);

        Object.entries(d)
          .filter(([key]) => !['id', 'frequency', 'x', 'y'].includes(key))
          .forEach(([key, value], i) => {
            text.append("tspan")
              .text(`${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`)
              .attr("x", 5)
              .attr("dy", 20);
          });

        const bbox = tooltip.node()?.getBBox();
        if (bbox) {
          tooltip.select("rect")
            .attr("width", bbox.width + 10)
            .attr("height", bbox.height + 10);
        }
      })
      .on("mouseout", () => {
        svg.selectAll(".tooltip").remove();
      });
  }, [filteredData, selectedIDs]);


  return (
    <div className="p-8">
      <h1 className="text-2xl pb-4 border-b border-neutral-300">
        Text Prompt Corpus
        <span className="text-sm ml-2 bg-gray-200 px-2 py-1 rounded cursor-pointer select-none hover:bg-gray-100">
          {modelName}
        </span>
      </h1>
      <div className='grid grid-cols-6 gap-4 pb-2 border-b'>
        <div className='col-span-1'>
          <VisSpecList utteranceSamples={utteranceSamples}/>
        </div>
        <div className='col-span-3 grid grid-cols-3'>
          <div className='col-span-1'>
            <InterpretationVis utteranceSamples={utteranceSamples}/>
          </div>
          <div className="col-span-2 pt-6 px-2">
            <InferenceDistribution/>
          </div>
        </div>
        <div className='col-span-1'>
          {/*<AccuracyVis/>*/}
          {/*<div className='grid grid-cols-1'>*/}
          {/*  <svg ref={svgRef} className="border"/>*/}
          {/*</div>*/}
        </div>
      </div>
      <div className="w-full">
        <SampleList/>
      </div>
    </div>
  );
}

const prepareData = (data: any): UtteranceSample[] => {
  return data.map((item: any) => {
    return {
      id: item.id,
      utteranceSet: item.UtteranceSet,
      sequential: item.Sequential,
      visID: item.VisID,
      dataset: item.Dataset,
      groundTruth: item.ground_truth,
      vegaLite: item.vegalite,
      specGen: item.normed_gen_vis_spec,
      specGT: item.normed_gt_vis_spec,
      inference: {
        dataSchema: item.inference_level.dataSchema,
        mark: item.inference_level.mark,
        encoding: item.inference_level.encoding,
        design: item.inference_level.design,
      },
      accuracy: {
        dataSchema: item.accuracy.dataSchema,
        mark: item.accuracy.mark,
        encoding: item.accuracy.encoding,
        design: item.accuracy.design,
      },
      accGenDiff: item.gen_acc_diff,
      accGTDiff: item.gt_acc_diff,
      tested: 'yes'
    } as UtteranceSample;
  });
};

const loadCSVDatasets = async (filename: string) => {
  const response = await fetch(`/vispilot/data/${filename}`);
  const text = await response.text();
  const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
  const headers = rows[0];
  return rows.slice(1).map((row, lineno) => {
    return headers.reduce((obj: { [key: string]: string }, header, index) => {
      if (index === 0) {
        obj[header] = row.slice(0, row.length - headers.length + 1).join(', ');
        obj[header] = obj[header].replace(/"/g, '');
      } else {
        obj[header] = row[row.length - headers.length + index];
      }
      return obj;
    }, {});
  });
}