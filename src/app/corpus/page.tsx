'use client';

import {useEffect, useRef, useState} from 'react';
import * as d3 from 'd3';
import CorpusTable from "@/app/corpus/CorpusTable";
import {generateCSVPrompt, generateSystemPrompt} from "@/prompts";
import {CSVData, Message, UtteranceSample} from "@/types";
import {sendRequest} from "@/model";
import {useAppDispatch, useAppSelector} from "@/store";
import {selectUtteranceSamples, setUtteranceSamples} from "@/store/features/CorpusSlice";

export type SpecCategory = 'Explicit' | 'Implicit' | 'None';
export type TestState = 'no' | 'yes' | 'pending';
const specifications = ['dataSchema', 'task', 'mark', 'encoding', 'design'] as const;
const categories = ['Explicit', 'Implicit', 'None'] as const;
const datasetList = ['cars.csv']

export default function Corpus() {
  const dispatch = useAppDispatch();
  const utteranceSamples = useAppSelector(selectUtteranceSamples);
  const svgRef = useRef<SVGSVGElement>(null);
  const svgDistRef = useRef<SVGSVGElement>(null);
  const [filters, setFilters] = useState<Partial<UtteranceSample>>({});

  const [csvDataSet, setCsvDataSet] = useState<{[key: string]: CSVData}>({});

  useEffect(
    () => {
      loadCSVbyFilename(datasetList[0]).then((data) => {
        setCsvDataSet({'cars.csv': data});
      })
    }, []
  )

  const handleDataLoad = (csvData: { [key: string]: string }[]) => {
    const preparedData = prepareData(csvData, false);
    dispatch(setUtteranceSamples(preparedData))
  };

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

    // we have 3^5 bubbles at most, the bubbleCategories are consist of all combinations of the 5 dimensions
    const bubbleCategories = Array.from({length: 3 ** specifications.length}, (_, i) => {
      return specifications.map((_, j) => {
        return categories[Math.floor(i / (3 ** j)) % 3];
      });
    });

    const bubbleData = bubbleCategories.map((category, index) => {
      const filtered = filteredData.filter(d => {
        return specifications.every((spec, i) => {
          return d[spec] === category[i];
        });
      });
      if (filtered.length === 0) return null;
      const avgAccuracy = d3.mean(filtered, d => d.accuracy) || 0;
      const avgInferenceLevel = d3.mean(filtered, d => d.inferenceLevel) || 0;
      return {
        id: index,
        category,
        accuracy: avgAccuracy,
        inferenceLevel: avgInferenceLevel,
        frequency: filtered.length,
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
      .attr("cx", d => x(d.inferenceLevel))
      .attr("cy", d => y(d.accuracy))
      .attr("r", d => size(d.frequency))
      .attr("fill", "#4299e1")
      .attr("opacity", 0.7)
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
  }, [filteredData]);

  useEffect(() => {
    if (!svgDistRef.current) return;

    const margin = {top: 40, right: 40, bottom: 60, left: 60};
    const width = 400 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    d3.select(svgDistRef.current).selectAll("*").remove();
    const svg = d3.select(svgDistRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Prepare data for stacked bar chart
    const stackData = specifications.map(spec => {
      const counts = categories.reduce((acc, cat) => {
        acc[cat] = utteranceSamples.filter(s => s[spec] === cat).length;
        return acc;
      }, {} as Record<string, number>);
      return {
        dimension: spec,
        ...counts
      };
    });

    // Stack the data
    const stack = d3.stack<any>()
      .keys(categories)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const stackedData = stack(stackData);

    // Scales
    const x = d3.scaleBand()
      .domain(specifications)
      .range([0, width])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(stackedData, d => d3.max(d, d => d[1])) || 0])
      .range([height, 0]);

    const color = d3.scaleOrdinal()
      .domain(categories)
      .range(['#4299e1', '#48bb78', '#ed8936']);

    // Add bars
    svg.selectAll("g.category")
      .data(stackedData)
      .join("g")
      .attr("class", "category")
      .attr("fill", d => color(d.key))
      .selectAll("rect")
      .data(d => d)
      .join("rect")
      .attr("x", d => x(d.data.dimension) || 0)
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth());

    // Add axes
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append("g")
      .call(d3.axisLeft(y));

    // Add legend
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(100, -20)`);

    categories.forEach((cat, i) => {
      const legendCol = legend.append("g")
        .attr("transform", `translate(${i * 80}, 0)`);

      legendCol.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", color(cat));

      legendCol.append("text")
        .attr("x", 20)
        .attr("y", 10)
        .attr("text-anchor", "start")
        .text(cat);
    });

  }, [utteranceSamples]);

  const dimensions = ['dataSchema', 'task', 'mark', 'encoding', 'design'] as const;

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Text Prompt Corpus</h1>
      <CSVReader onDataLoad={handleDataLoad}/>
      <div className='grid grid-cols-6 gap-4'>
        <div className='col-span-1'>
          <svg ref={svgDistRef} className="border"></svg>
        </div>
        <div className='col-span-5'>
          <div className="mb-4 grid grid-cols-5 gap-4">
            {dimensions.map(dim => (
              <div key={dim}>
                <label className="block mb-1">{dim}:</label>
                <select
                  value={filters[dim] || ''}
                  onChange={e => setFilters(prev => ({
                    ...prev,
                    [dim]: e.target.value || undefined
                  }))}
                  className="w-full border p-1 rounded"
                >
                  <option value="">All</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <svg ref={svgRef} className="border"></svg>
        </div>
      </div>
      <CorpusTable data={filteredData}/>
    </div>
  );
}

const CSVReader = ({onDataLoad}: { onDataLoad: (data: { [key: string]: string }[]) => void }) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
      const headers = rows[0];
      const data = rows.slice(1).map((row, lineno) => {
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
      onDataLoad(data);
    };
    reader.readAsText(file);
  };

  return (
    <div className="mb-4">
      <label
        htmlFor="csvInput"
        className="flex items-center justify-center w-full h-32 px-2 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none"
      >
        <div className="flex flex-col items-center space-y-2">
          <span className="material-symbols-outlined w-8 h-8 text-gray-400">upload_file</span>
          <span className="font-medium text-sm text-gray-600">
            Drop CSV file to upload or click to browse
          </span>
        </div>
        <input
          id="csvInput"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileUpload}
        />
      </label>
    </div>
  );
}

const prepareData = (csvData: { [key: string]: string }[], fake: boolean) => {
  return fake ? csvData.map((row, index) => {
    // Generate fake pattern data
    const ds = categories[Math.floor(Math.random() * categories.length)];
    const t = categories[Math.floor(Math.random() * categories.length)];
    const m = categories[Math.floor(Math.random() * categories.length)];
    const e = categories[Math.floor(Math.random() * categories.length)];
    const d = categories[Math.floor(Math.random() * categories.length)];

    // Calculate metrics based on pattern
    const explicitCount = [ds, t, m, e, d].filter(v => v === 'Explicit').length;
    const implicitCount = [ds, t, m, e, d].filter(v => v === 'Implicit').length;
    const frequency = explicitCount * 10 + implicitCount * 5 + 1;
    const accuracy = Math.min(1.0, (explicitCount * 0.2) + (implicitCount * 0.1) + Math.random() * 0.1);
    const inferenceLevel = Math.max(0, 1 - ((explicitCount * 0.2) + (implicitCount * 0.1)) - Math.random() * 0.1);

    return {
      id: index + 1,
      utteranceSet: row['Utterance Set'] || '',
      sequential: row['sequential'] || '',
      visId: row['visId'] || '',
      dataset: row['dataset'] || '',
      dataSchema: ds,
      task: t,
      mark: m,
      encoding: e,
      design: d,
      accuracy,
      inferenceLevel,
      tested: 'yes'
    } as UtteranceSample;
  })
  : csvData.map((row, index) => {
      return {
        id: index + 1,
        utteranceSet: row['Utterance Set'] || '',
        sequential: row['sequential'] || '',
        visId: row['visId'] || '',
        dataset: row['dataset'] || '',
        dataSchema: row['dataSchema'] || null,
        task: row['task'] || null,
        mark: row['mark'] || null,
        encoding: row['encoding'] || null,
        design: row['design'] || null,
        accuracy: row['accuracy'] ? parseFloat(row['accuracy']) : null,
        inferenceLevel: row['inferenceLevel'] ? parseFloat(row['inferenceLevel']) : null,
        tested: row['tested'] === 'yes' ? 'yes' : 'no'
      } as UtteranceSample
    })
};

const modelTest = async ({utteranceSet, visId, dataset, csvDataSet}: UtteranceSample & {csvDataSet: {[key: string]: CSVData}}) => {
  const systemPrompt = generateSystemPrompt();
  const csvData = csvDataSet['cars.csv'];
  const headers = Object.keys(csvData[0]);
  const csvPrompt = generateCSVPrompt({filename: dataset, csvData, headers});
  const messages: Message[] = [
    {
      id: 1,
      role: 'system',
      sender: 'system',
      content: [
        {type: 'text', text: systemPrompt},
      ]
    },
    {
      id: 2,
      role: 'user',
      sender: 'user',
      content: [
        {type: 'text', text: csvPrompt},
        {type: 'text', text: utteranceSet},
      ]
    }
  ]
  const response = await sendRequest(messages);
  console.log('response', response);
  return response;
}

const loadCSVbyFilename = async (filename: string) => {
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