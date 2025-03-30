'use client';

import {useEffect, useRef, useState} from 'react';
import * as d3 from 'd3';
import {UtteranceSample} from "@/types";
import {useAppDispatch, useAppSelector} from "@/store";
import {setVisDataset, selectUtteranceSamples, setUtteranceSamples, setFilteredIDs} from "@/store/features/CorpusSlice";
import InterpretationVis from "@/app/corpus/InterpretationVis";
import VisSpecList from "@/app/corpus/VisSpecList";
import SampleList from "@/app/corpus/SampleList";
import InferenceDistribution from "@/app/corpus/InferenceDistribution";
import {ProcessResult} from "@/app/llm-processing/page";
import AccuracyVis from "@/app/corpus/AccuracyVis";

export type SpecCategory = 'Explicit' | 'Implicit';
export type TestState = 'no' | 'yes' | 'pending';
const specDims = ['dataSchema', 'mark', 'encoding', 'design'] as const;

const categories = ['Explicit', 'Implicit'] as const;
const datasetList = ['cars.csv', 'movies.csv', 'superstore.csv']

export default function Corpus() {
  const dispatch = useAppDispatch();

  const [processResults, setProcessResults] = useState<ProcessResult[]>([]);

  const [modelName, setModelName] = useState<string>('gemini-2.0-flash');

  useEffect(() => {
    const dataFile = `/vispilot/corpusData/${modelName}.json`;
    fetch(dataFile)
      .then(response => response.json())
      .then(data => {
        setProcessResults(data);
        console.log('Process results:', data);
      })
      .catch(error => {
        console.error('Error loading Process Results:', error);
      });
  }, [dispatch, modelName]);

  useEffect(() => {
    datasetList.forEach((filename) => {
      loadCSVDatasets(filename).then((data) => {
        dispatch(setVisDataset({filename, data}));
      })
    })
  }, [dispatch])

  return (
    <div className="p-8">
      <h1 className="text-2xl pb-4 border-b border-neutral-300">
        Text Prompt Corpus
        <span className={`text-sm ml-2 bg-gray-200 px-2 py-1 rounded cursor-pointer select-none hover:bg-gray-100 ${modelName.toLowerCase() !== 'gpt-4o' && 'opacity-30 hover:opacity-100'}`}
          onClick={() => {setModelName('gpt-4o')}}
        >
          {'gpt-4o'}
        </span>
        <span className={`text-sm ml-2 bg-gray-200 px-2 py-1 rounded cursor-pointer select-none hover:bg-gray-100 ${modelName.toLowerCase() !== 'gemini-2.0-flash' && 'opacity-30 hover:opacity-100'}`}
              onClick={() => {setModelName('gemini-2.0-flash')}}
        >
          {'gemini-2.0-flash'}
        </span>
        <span className={`text-sm ml-2 bg-gray-200 px-2 py-1 rounded cursor-pointer select-none hover:bg-gray-100 ${modelName.toLowerCase() !== 'claude-3.5-sonnet' && 'opacity-30 hover:opacity-100'}`}
              onClick={() => {setModelName('claude-3.5-sonnet')}}
        >
          {'claude-3.5-sonnet'}
        </span>
      </h1>
      <div className='grid grid-cols-12 gap-4 pb-2 border-b'>
        <div className='col-span-2'>
          <VisSpecList data={processResults}/>
        </div>
        <div className='col-span-5 grid grid-cols-3'>
          <div className='col-span-1'>
            <InterpretationVis processResults={processResults}/>
          </div>
          <div className="col-span-2 pt-6 px-2">
            <InferenceDistribution processResults={processResults}/>
          </div>
        </div>
        <div className='col-span-5'>
          <AccuracyVis processResult={processResults}/>
        </div>
      </div>
      <div className="w-full">
        <SampleList data={processResults}/>
      </div>
    </div>
  );
}

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