'use client';

import React, {useRef, useState} from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea
} from '@/components/ui';
import {ChevronDown, ChevronUp, Database, Download, Upload} from 'lucide-react';
import Papa from 'papaparse';

interface Utterance {
  id: string;
  utterance: string;
  visID: string;
  dataset: string;
}

interface GroundTruth {
  visID: string;
  dataset: string;
  vegaLiteJson: any;
}

interface ProcessResult {
  id: string;
  utterance: string;
  visID: string;
  dataset: string;
  groundTruth: any;
  vegaLite: string;
  explanation?: any;
  evaluation?: {
    accuracy: number;
    similarity: number;
    details: any[];
    categoryMatches: any;
  };
  processingTime: number;
  error?: string;
}

interface VisualizationDataset {
  name: string;
  filename: string;
  data: any[];
}

export default function LLMProcessingPage() {
  const [systemPrompt, setSystemPrompt] = useState<string>(
    `You are an AI assistant that helps users create data visualizations. Your **Task1** is to convert the user's request into a Vega-Lite JSON specification. After that, wait for the user to provide an abstraction of your generated Vega-Lite JSON specification (**Vega-Lite Abstraction**). The user will categorize important properties of the Vega-Lite JSON specification into  'DataSchema', 'Mark', 'Encoding', and 'Design'. Your **Task2** is to explain the rationale of each property in the **Vega-Lite Abstraction**, and classify the properties into 'Explicit Reference' and 'Implicit Inference'.

## Framework of **Vega-Lite Abstraction**
- **DataSchema**: This component defines the structural properties of data, including attribute names and data transformations.
- **Mark**: This component specifies the type of visualization, such as bar, line, or scatter plot.
- **Encoding**: This component specifies the mapping between data attributes and visual properties, such as encoding.x.field, encoding.y.field, etc.
- **Design**:  The design component captures visualization properties not directly tied to data semantics, like background color, gridlines, axis properties, chart title, etc.


## Explanation Requirements
Give your explanation for the rationale of each property in the **Vega-Lite Abstraction**, then classify the properties into the following categories:
- Explicit Reference: There are explicit specification in the user request. For example, "Show me the average sales by region using a bar chart" explicitly specifies the field of data and the mark type.
- Implicit Inference: You infer the properties based on implicit assumptions and incomplete specification in the user request. For example, although "Show me the sales by region" specifies two fields of data, but not explicitly specify which is bound to x-axis and which is to y-axis. Therefore, the encoding.x.field and encoding.y.field are implicit inference.

## Response Format for Task1 (Vega-Lite JSON)
\`\`\`json
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": {
    "url": "dataset/{dataset}",
    "format": {"type": "csv"}
  },
  "mark": {
    // ...
  },
  "encoding": {
    // ...
  },
}
\`\`\`

## Response Format for Task2 (Explanation)
\`\`\`json
{
  "Mark": [
    {
      "property": "property path, e.g., mark.type", 
      "rationale": "explanation of the rationale",
      "explicit": true/false
    },
    ...
  ],
  "Encoding": [
    {
      "property": "property path, e.g., encoding.x.field", 
      "rationale": "explanation of the rationale",
      "explicit": true/false
    },
    ...
  ],
  "DataSchema": [
    {
      "property": "property path, e.g., encoding.x.field", 
      "rationale": "explanation of the rationale",
      "explicit": true/false
    },
    ...
  ],
  "Design": [
    {
      "property": "property path, e.g., encoding.x.axis.title", 
      "rationale": "explanation of the rationale",
      "explicit": true/false
    },
    ...
  ]
}
\`\`\`
    
    
## NOTE
- You must use data.url to define the data source, the url starts with "dataset/".
- The only four top level properties you can use are to specify the visualization is "$schema", "data", "mark", and "encoding".
- When you specify the "mark" property, you must use "mark.type" to specify the mark type instead of using "mark".
- When you explain the rationale, you must explain only the properties in the **Vega-Lite Abstraction**.
- Do not include any other information in your response, only the JSON format.
`
  );
  const [utterances, setUtterances] = useState<Utterance[]>([]);
  const [groundTruths, setGroundTruths] = useState<GroundTruth[]>([]);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [parallelism, setParallelism] = useState<number>(3);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [apiEndpoint, setApiEndpoint] = useState<string>('/api/llm');
  const [maxRequestsPerMin, setMaxRequestsPerMin] = useState<number>(12);
  const [modelName, setModelName] = useState<string>('Gemini 2.0 Flash');

  const [visualizationDatasets, setVisualizationDatasets] = useState<VisualizationDataset[]>([]);
  const [newDatasetName, setNewDatasetName] = useState<string>("");

  const fileInputUtteranceRef = useRef<HTMLInputElement>(null);
  const fileInputGroundTruthRef = useRef<HTMLInputElement>(null);
  const fileInputDatasetRef = useRef<HTMLInputElement>(null);
  const fileInputResultsRef = useRef<HTMLInputElement>(null);

  const handleResultsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const loadedResults = JSON.parse(text) as ProcessResult[];

      // Validate the format of loaded results
      if (!Array.isArray(loadedResults) ||
        !loadedResults.every(r => 'id' in r && 'utterance' in r && 'dataset' in r)) {
        throw new Error('Invalid results format');
      }

      setResults(loadedResults);

      // Reset file input
      if (fileInputResultsRef.current) {
        fileInputResultsRef.current.value = '';
      }
    } catch (err) {
      console.error("Failed to parse results JSON:", err);
      alert("Invalid JSON format in results file");
    }
  };

  const handleUtteranceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Convert parsed data to your Utterance interface
        const utterances = results.data.map((row: any, index) => {
          return {
            id: index.toString(),
            utterance: row["Utterance Set"],
            visID: row.visId,
            dataset: row.dataset.toLowerCase(),
          } as Utterance;
        });
        console.log(utterances)
        setUtterances(utterances);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        alert('Failed to parse CSV file');
      }
    });
  };

  const handleGroundTruthUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const data = JSON.parse(text);
      const groundTruths = Object.entries(data).map(([key, value]) => ({
        visID: key.split('-')[1],
        dataset: key.split('-')[0],
        vegaLiteJson: value
      }) as GroundTruth);
      console.log(groundTruths)
      setGroundTruths(groundTruths);
    } catch (err) {
      console.error("Failed to parse ground truth JSON:", err);
      alert("Invalid JSON format in ground truth file");
    }
  };

  const handleDatasetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      alert('Please provide a CSV file');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const newDataset: VisualizationDataset = {
          name: file.name.toLowerCase().replace(/.csv$/g, ''),
          filename: file.name,
          data: results.data
        };

        console.log('Parsed dataset:', newDataset);

        setVisualizationDatasets(prev => [...prev, newDataset]);
        setNewDatasetName('');

        // Reset the file input
        if (fileInputDatasetRef.current) {
          fileInputDatasetRef.current.value = '';
        }
      },
      error: (error) => {
        console.error('Error parsing CSV dataset:', error);
        alert('Failed to parse CSV dataset file');
      }
    });
  };

  const removeDataset = (datasetName: string) => {
    setVisualizationDatasets(prev => prev.filter(dataset => dataset.name !== datasetName));
  };

  const processUtterance = async (utterance: Utterance): Promise<ProcessResult> => {
    const startTime = Date.now();
    try {
      const groundTruth = groundTruths.find(
        gt => gt.visID === `${utterance.visID}` && gt.dataset.toLowerCase() === utterance.dataset.toLowerCase()
      );

      // Find dataset data if available
      const datasetData = visualizationDatasets.find(
        ds => ds.name === utterance.dataset
      )?.data || null;

      if (!datasetData) {
        throw new Error(`Dataset ${utterance.dataset} not found`);
      }

      // Import and use sendRequest from @/components/model
      const {sendUtteranceTestRequest} = await import('@/model');
      const response = await sendUtteranceTestRequest({
        model: modelName, // Use the selected model name
        systemPrompt,
        userPrompt: utterance.utterance,
        dataPrompt: convertDatasetToTextPrompt(utterance.dataset, datasetData)
      });

      return {
        id: utterance.id,
        utterance: utterance.utterance,
        visID: utterance.visID,
        dataset: utterance.dataset,
        groundTruth: groundTruth?.vegaLiteJson || null,
        vegaLite: response,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error(`Error processing utterance ${utterance.id}:`, error);
      return {
        id: utterance.id,
        utterance: utterance.utterance,
        visID: utterance.visID,
        dataset: utterance.dataset,
        groundTruth: null,
        vegaLite: '',
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const processAll = async () => {
    if (utterances.length === 0) {
      alert('Please upload utterances first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    // setResults([]);

    const processedResults: ProcessResult[] = results;

    // all error results and unprocessed utterances
    const testList = utterances.filter(
      (utterance) => !results.some((result) => result.id === utterance.id && !result.error)
    ).map(utterance => utterance.id)

    if (testList.length === 0) {
      alert('All utterances have been processed');
      setIsProcessing(false);
      return;
    }


    try {
      // Calculate delay needed between batches to respect rate limit
      const batchSize = parallelism;
      const minDelayBetweenBatches = (60 * 1000 * batchSize) / maxRequestsPerMin;

      // Process utterances with controlled parallelism and rate limiting
      for (let i = 0; i < testList.length; i += batchSize) {
        const batchStartTime = Date.now();

        const tests = testList.slice(i, i + batchSize);
        const batch = utterances.filter(u=> tests.includes(u.id));
        const batchPromises = batch.map(processUtterance);

        const batchResults = await Promise.all(batchPromises);

        batchResults.forEach((batchResult) => {
          const existingResultIndex = processedResults.findIndex(r => r.id === batchResult.id);
          if (existingResultIndex !== -1) {
            processedResults[existingResultIndex] = batchResult;
          } else {
            processedResults.push(batchResult);
          }
        })

        // sort results by id
        processedResults.sort((a, b) => Number(a.id) - Number(b.id));

        const newProgress = Math.floor((processedResults.length / utterances.length) * 100);
        setProgress(newProgress);
        setResults([...processedResults]);

        // Apply rate limiting if there are more batches to process
        if (i + batchSize < testList.length) {
          const batchProcessingTime = Date.now() - batchStartTime;
          const requiredDelay = Math.max(0, minDelayBetweenBatches - batchProcessingTime);

          if (requiredDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, requiredDelay));
          }
        }
      }
    } catch (error) {
      console.error("Error during batch processing:", error);
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  // function to request explanation (Task 2)
  const requestExplanation = async (result: ProcessResult): Promise<ProcessResult> => {
    if (!result.vegaLite) {
      return result;
    }

    try {
      const startTime = Date.now();

      // Find dataset data
      const datasetData = visualizationDatasets.find(
        ds => ds.name === result.dataset
      )?.data || null;

      if (!datasetData) {
        throw new Error(`Dataset ${result.dataset} not found`);
      }

      // Import and use sendUtteranceTestRequest
      const {sendUtteranceTestRequest} = await import('@/model');
      const response = await sendUtteranceTestRequest({
        model: modelName,
        systemPrompt,
        userPrompt: result.utterance,
        dataPrompt: convertDatasetToTextPrompt(result.dataset, datasetData),
        firstRoundResponse: result.vegaLite,
        nextUserPrompt: '**Vega-Lite Abstraction**:\n' + abstractVegaLiteJson(result.vegaLite),
      });

      const updatedResult = {
        ...result,
        explanation: JSON.parse(response),
        processingTime: result.processingTime + (Date.now() - startTime),
        error: undefined
      };

      // Evaluate the result after explanation
      if (updatedResult.groundTruth) {
        updatedResult.evaluation = evaluateResult(updatedResult) || undefined;
      }

      return updatedResult;
    } catch (error) {
      console.error(`Error requesting explanation for utterance ${result.id}:`, error);
      return {
        ...result,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Add a function to request explanations for all results
  const explainAll = async () => {
    if (results.length === 0) {
      alert('No results to explain');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    // Filter results that don't have explanations and don't have errors, or have vegaLite and errors but no explanations
    const resultsToExplain = results.filter(r => (!r.explanation && !r.error && r.vegaLite) || (r.vegaLite && r.error && !r.explanation));

    if (resultsToExplain.length === 0) {
      setIsProcessing(false);
      alert('All results already have explanations or have errors');
      return;
    }

    try {
      // Calculate delay needed between batches to respect rate limit
      const batchSize = parallelism;
      const minDelayBetweenBatches = (60 * 1000 * batchSize) / maxRequestsPerMin;
      let processedCount = 0;

      // Process in batches with controlled parallelism
      for (let i = 0; i < resultsToExplain.length; i += batchSize) {
        const batchStartTime = Date.now();
        const batch = resultsToExplain.slice(i, i + batchSize);

        const batchPromises = batch.map(async (result) => {
          const updatedResult = await requestExplanation(result);
          setResults(prev => prev.map(r => r.id === updatedResult.id ? updatedResult : r));
          return updatedResult;
        });

        await Promise.all(batchPromises);
        processedCount += batch.length;

        // Update progress
        const newProgress = Math.floor((processedCount / resultsToExplain.length) * 100);
        setProgress(newProgress);

        // Apply rate limiting if there are more batches to process
        if (i + batchSize < resultsToExplain.length) {
          const batchProcessingTime = Date.now() - batchStartTime;
          const requiredDelay = Math.max(0, minDelayBetweenBatches - batchProcessingTime);

          if (requiredDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, requiredDelay));
          }
        }
      }
    } catch (error) {
      console.error("Error during batch explanation processing:", error);
      alert("Error requesting explanations: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const downloadResults = () => {
    if (results.length === 0) return;

    const dataStr = JSON.stringify(results, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `llm-results-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleResultExpansion = (id: string) => {
    if (expandedResult === id) {
      setExpandedResult(null);
    } else {
      setExpandedResult(id);
    }
  };

  // Add this function to the component to evaluate explained results
  const evaluateExplainedResults = () => {
    if (results.length === 0) return;

    const updatedResults = results.map(result => {
      if (result.explanation && !result.evaluation) {
        const evaluationResult = evaluateResult(result);
        return {
          ...result,
          evaluation: evaluationResult || undefined
        };
      }
      return result;
    });

    setResults(updatedResults);
  };

  // Add new function to calculate statistics from results
  const calculateResultStatistics = (results: ProcessResult[]) => {
    if (!results.length) return null;

    return {
      total: results.length,
      success: results.filter(r => !r.error && r.vegaLite).length,
      error: results.filter(r => r.error).length,
      explained: results.filter(r => r.explanation).length,
      avgTime: Math.round(results.reduce((acc, r) => acc + r.processingTime, 0) / results.length),
      datasets: Array.from(new Set(results.map(r => r.dataset))).length
    };
  };

  // @ts-ignore
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">LLM Processing Tool</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>1. Upload Datasets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Utterance Dataset (CSV)</label>
                <div className="flex gap-2">
                  <Input
                    ref={fileInputUtteranceRef}
                    type="file"
                    accept=".csv"
                    onChange={handleUtteranceUpload}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputUtteranceRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2"/>
                    Upload
                  </Button>
                </div>
                {utterances.length > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loaded {utterances.length} utterances
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2">Ground Truth Dataset (JSON)</label>
                <div className="flex gap-2">
                  <Input
                    ref={fileInputGroundTruthRef}
                    type="file"
                    accept=".json"
                    onChange={handleGroundTruthUpload}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputGroundTruthRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2"/>
                    Upload
                  </Button>
                </div>
                {groundTruths.length > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loaded {groundTruths.length} ground truth items
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-2">Visualization Datasets (CSV)</label>
                <div className="grid grid-cols-1 gap-3 mb-4">
                  <Input
                    placeholder="Dataset Name"
                    value={newDatasetName}
                    onChange={(e) => setNewDatasetName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Input
                      ref={fileInputDatasetRef}
                      type="file"
                      accept=".csv"
                      onChange={handleDatasetUpload}
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputDatasetRef.current?.click()}
                      // disabled={!newDatasetName}
                    >
                      <Database className="h-4 w-4 mr-2"/>
                      Add
                    </Button>
                  </div>
                </div>
                {/* List of uploaded visualization datasets */}
                {visualizationDatasets.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Uploaded Datasets:</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {visualizationDatasets.map((dataset) => (
                        <div key={dataset.name}
                             className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                          <div>
                            <span className="font-medium">{dataset.name}</span>
                            <Badge variant="outline" className="ml-2">{dataset.filename}</Badge>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({dataset.data.length} rows)
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDataset(dataset.name)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. System Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={systemPrompt}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSystemPrompt(e.target.value)}
              rows={8}
              className="resize-none w-full"
              placeholder="Enter system prompt here..."
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>3. LLM Processing Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">API Endpoint</label>
              <Input
                value={apiEndpoint}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiEndpoint(e.target.value)}
                placeholder="API endpoint for LLM processing"
              />
            </div>
            <div>
              <label className="block mb-2">Parallelism</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={parallelism}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setParallelism(Math.min(50, Math.max(1, Number(e.target.value))))}
                placeholder="Number of parallel requests (1-10)"
              />
            </div>

            <div>
              <label className="block mb-2">Max Requests Per Minute</label>
              <Input
                type="number"
                min={1}
                max={300}
                step={1}
                value={maxRequestsPerMin}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMaxRequestsPerMin(Math.min(300, Math.max(1, Number(e.target.value))))}
                placeholder="Rate limit (1-300)"
              />
            </div>

            <div>
              <label className="block mb-2">Model Name</label>
              <Select value={modelName} onValueChange={setModelName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gemini 2.0 Flash">Gemini 2.0 Flash</SelectItem>
                  <SelectItem value="Gemini 2.0 Pro">Gemini 2.0 Pro</SelectItem>
                  <SelectItem value="Gemini 2.5 Pro">Gemini 2.5 Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={processAll}
            disabled={isProcessing || utterances.length === 0}
            className="w-full"
          >
            {isProcessing ? 'Processing...' : 'Process All Utterances'}
          </Button>
        </CardFooter>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>4. Processing Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="mb-2"/>
          <div className="text-sm text-muted-foreground">
            {results.length} / {utterances.length} utterances processed ({progress}%)
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>5. Results</CardTitle>
          <div className="flex flex-row gap-2">
            <Button
              onClick={explainAll}
              disabled={isProcessing || results.length === 0}
              variant="outline"
              size="sm"
            >
              Explain All
            </Button>
            <input
              type="file"
              accept=".json"
              ref={fileInputResultsRef}
              onChange={handleResultsUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputResultsRef.current?.click()}
              variant="outline"
              size="sm"
            >
              <Upload className="h-4 w-4 mr-2"/>
              Load JSON
            </Button>
            <Button
              onClick={downloadResults}
              disabled={results.length === 0}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2"/>
              Download JSON
            </Button>
          </div>
        </CardHeader>


        {results.length > 0 && (
          <div className="px-6 pb-4 mb-2 border-b">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
              {(() => {
                const stats = calculateResultStatistics(results);
                if (!stats) return null;

                return (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-semibold">{stats.total}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Success</p>
                      <p className="text-xl font-semibold text-green-600">{stats.success}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Errors</p>
                      <p className="text-xl font-semibold text-red-600">{stats.error}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Explained</p>
                      <p className="text-xl font-semibold text-blue-600">{stats.explained}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Time</p>
                      <p className="text-xl font-semibold">{stats.avgTime}ms</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Datasets</p>
                      <p className="text-xl font-semibold">{stats.datasets}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        <CardContent>
          <div className="space-y-4">
            {results.length > 0 ? (
              results.map((result) => (
                <Card key={result.id} className="border border-gray-200">
                  <CardHeader className="py-3" onClick={() => toggleResultExpansion(result.id)}
                              style={{cursor: 'pointer'}}>
                    <div className="flex justify-between items-center">
                      <div className={`flex items-center gap-2 ${result.error && 'text-red-500'}`}>
                        <span className="font-semibold">#{result.id}</span>
                        <Badge variant={result.error ? "destructive" : "outline"}>
                          {result.dataset}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {result.processingTime}ms
                        </span>
                        {result.evaluation && (
                          <div className="flex gap-2 w-60">
                            <Badge variant={(result.evaluation?.categoryMatches.DataSchema.matched === result.evaluation?.categoryMatches.DataSchema.total) ? "success" : "warning"}
                                   className="bg-green-100 text-data">
                              DataSchema
                            </Badge>
                            <Badge variant={(result.evaluation?.categoryMatches.Mark.matched === result.evaluation?.categoryMatches.Mark.total) ? "success" : "warning"}
                                   className="bg-green-100 text-mark">
                              Mark
                            </Badge>
                            <Badge variant={(result.evaluation?.categoryMatches.Encoding.matched === result.evaluation?.categoryMatches.Encoding.total) ? "success" : "warning"}
                                   className="bg-green-100 text-encoding">
                              Encoding
                            </Badge>
                          </div>
                        )}
                      </div>
                      {result.evaluation && (
                        <div className="flex ml-auto gap-2">
                          <Badge variant={result.evaluation?.accuracy === 1 ? "success" : "warning"}
                                 className="bg-green-100 text-green-800 rounded-full">
                            {result.evaluation?.accuracy === 1 ? '✔': 'X'}
                          </Badge>
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            Sim: {(result.evaluation.similarity * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      )}
                      {expandedResult === result.id ? (
                        <ChevronUp className="h-4 w-4"/>
                      ) : (
                        <ChevronDown className="h-4 w-4"/>
                      )}
                    </div>
                  </CardHeader>
                  {expandedResult === result.id && (
                    <CardContent>
                      <Tabs defaultValue="utterance">
                        <TabsList className="mb-2">
                          <TabsTrigger value="utterance">Utterance</TabsTrigger>
                          <TabsTrigger value="response">Vega-Lite Specification</TabsTrigger>
                          <TabsTrigger value="groundtruth">Ground Truth</TabsTrigger>
                          <TabsTrigger value="explanation">Explanation</TabsTrigger>
                          {result.evaluation && <TabsTrigger value="evaluation">Evaluation</TabsTrigger>}
                        </TabsList>

                        <TabsContent value="utterance">
                          <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-60">
                            {result.utterance}
                          </pre>
                        </TabsContent>

                        <TabsContent value="response">
                          <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-60">
                            {result.error ? (
                              <span className="text-red-500">{result.error}</span>
                            ) : (
                              result.vegaLite || "No response"
                            )}
                          </pre>
                        </TabsContent>

                        <TabsContent value="groundtruth">
                          <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-60">
                            {result.groundTruth ?
                              JSON.stringify(result.groundTruth, null, 2) :
                              "No ground truth available"}
                          </pre>
                        </TabsContent>

                        <TabsContent value="explanation">
                          {result.explanation ? (
                            <pre
                              className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-60">{JSON.stringify(result.explanation, null, 2)}</pre>
                          ) : (
                            <div className="text-center py-4">
                              <p className="mb-4 text-muted-foreground">No explanation available</p>
                              <Button
                                size="sm"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const updatedResult = await requestExplanation(result);
                                  setIsProcessing(false);
                                  setResults(prev => prev.map(r => r.id === updatedResult.id ? updatedResult : r));
                                }}
                                disabled={!result.vegaLite}
                              >
                                Request Explanation
                              </Button>
                            </div>
                          )}
                        </TabsContent>
                        {
                          result.evaluation && (
                            <TabsContent value="evaluation">
                              {result.evaluation ? (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-gray-50 p-3 rounded">
                                      <div className="text-sm text-muted-foreground mb-1">Accuracy</div>
                                      <div className="text-xl font-semibold">
                                        {(result.evaluation.accuracy * 100).toFixed(0)}%
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Critical categories match rate
                                      </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded">
                                      <div className="text-sm text-muted-foreground mb-1">Similarity</div>
                                      <div className="text-xl font-semibold">
                                        {(result.evaluation.similarity * 100).toFixed(0)}%
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Design properties match rate
                                      </div>
                                    </div>
                                  </div>

                                  <div className="border rounded overflow-hidden">
                                    <div className="bg-gray-100 px-3 py-2 font-medium">
                                      Category Matches
                                    </div>
                                    <div className="divide-y">
                                      {Object.entries(result.evaluation.categoryMatches).map(([category, data]: [string, any]) => (
                                        <div key={category} className="px-3 py-2 flex justify-between items-center">
                                          <div>{category}</div>
                                          <div className="flex items-center gap-2">
                <span className="text-sm">
                  {data.matched}/{data.total} matched
                </span>
                                            <span className={`text-sm font-medium ${
                                              data.matched === data.total ? 'text-green-600' : 'text-amber-600'
                                            }`}>
                  {data.total > 0 ? (data.matched / data.total * 100).toFixed(0) : 0}%
                </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="border rounded overflow-hidden">
                                    <div className="bg-gray-100 px-3 py-2 font-medium">
                                      Property Details
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                      <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                        <tr>
                                          <th
                                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property
                                          </th>
                                          <th
                                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category
                                          </th>
                                          <th
                                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status
                                          </th>
                                        </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                        {result.evaluation.details.map((detail, index) => (
                                          <tr key={index} className={detail.matched ? 'bg-green-50' : 'bg-red-50'}>
                                            <td className="px-3 py-2 text-sm font-mono">{detail.property}</td>
                                            <td className="px-3 py-2 text-sm">{detail.category}</td>
                                            <td className="px-3 py-2 text-sm">
                                              {detail.matched ? (
                                                <span className="text-green-600">Matched</span>
                                              ) : (
                                                <div>
                                                  <span className="text-red-600">Mismatched</span>
                                                  <div className="text-xs mt-1">
                                                    <div>Ground truth: <span
                                                      className="font-mono">{JSON.stringify(detail.groundTruthValue)}</span>
                                                    </div>
                                                    <div>Generated: <span
                                                      className="font-mono">{JSON.stringify(detail.generatedValue)}</span>
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-4">
                                  <p className="text-muted-foreground">No evaluation data available</p>
                                </div>
                              )}
                            </TabsContent>
                          )
                        }
                      </Tabs>
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                No results yet. Process utterances to see results here.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const convertDatasetToTextPrompt = (dataset: string, data: any[]): string => {
  if (!data || data.length === 0) {
    return `The dataset "${dataset}" is empty.`;
  }

  // Extract column headers
  const headers = Object.keys(data[0]);

  // Limit to first 5 rows to avoid token limits
  const limitedData = data.slice(0, 5);

  // Create CSV string representation
  let csvText = headers.join(',') + '\n';

  for (const row of limitedData) {
    const rowValues = headers.map(header => {
      const value = row[header];
      // Handle different value types and escape commas
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
      return String(value);
    });
    csvText += rowValues.join(',') + '\n';
  }

  return `The following is a sample (first 5 rows) from the dataset "${dataset.toLowerCase()}.csv":\n\n${csvText}\n\nTotal rows in dataset: ${data.length}`;
}

const abstractionRules = {
  'DataSchema': [
    'encoding.x.field',
    'encoding.y.field',
    'encoding.color.field',
    'encoding.column.field',
    'encoding.x.aggregate',
    'encoding.y.aggregate',
    'encoding.x.sort.encoding',
    'encoding.x.sort.order',
    'encoding.y.sort',
  ],
  'Mark': [
    'mark.type',
  ],
  'Encoding': [
    'encoding.x.field',
    'encoding.y.field',
    'encoding.color.field',
    'encoding.column.field',
  ],
}

const abstractVegaLiteJson = (vegaLiteJson: string): string => {
  try {
    // Parse the Vega-Lite JSON string
    const vegaLite = JSON.parse(vegaLiteJson);

    // Initialize the result object with the four categories
    const result: Record<string, any[]> = {
      DataSchema: [],
      Mark: [],
      Encoding: [],
      Design: []
    };

    // Helper function to get property paths recursively
    const getPropertyPaths = (obj: any, path: string = ''): { path: string, value: any }[] => {
      if (!obj || typeof obj !== 'object') {
        return [{path, value: obj}];
      }

      return Object.entries(obj).flatMap(([key, value]) => {
        const newPath = path ? `${path}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          return getPropertyPaths(value, newPath);
        }
        return [{path: newPath, value}];
      });
    };

    // Get all property paths
    const allProperties = getPropertyPaths(vegaLite);

    // Categorize properties based on abstractionRules
    allProperties.forEach(({path, value}) => {
      // Skip $schema property
      if (path === '$schema') return;
      let isDesign = true;
      // Check if property belongs to DataSchema
      if (abstractionRules.DataSchema.some(rule => path.startsWith(rule) || rule.startsWith(path))) {
        isDesign = false;
        const formattedPath = path.replace(/encoding\./g, '');
        result.DataSchema.push({path: formattedPath, value});
      }
      // Check if property belongs to Mark
      if (abstractionRules.Mark.some(rule => path.startsWith(rule) || rule.startsWith(path))) {
        isDesign = false;
        result.Mark.push({path, value});
      }
      // Check if property belongs to Encoding
      if (abstractionRules.Encoding.some(rule => path.startsWith(rule) || rule.startsWith(path))) {
        isDesign = false;
        result.Encoding.push({path, value});
      }
      // If not in any defined category, put in Design
      if (isDesign && (path.startsWith('encoding') || path.startsWith('mark') || path.startsWith('title') ||
        path.startsWith('width') || path.startsWith('height') || path.includes('axis') ||
        path.includes('legend'))) {
        // If it's encoding.*.type, skip it
        if (path.split('.').length == 3 && path.startsWith('encoding') && path.endsWith('.type')) return;
        result.Design.push({path, value});
      }
    });

    // Format the result to match the desired output
    const formattedResult = {
      Mark: result.Mark.map(item => ({
        property: item.path,
        value: item.value
      })),
      Encoding: result.Encoding.map(item => ({
        property: item.path,
        value: item.value
      })),
      DataSchema: result.DataSchema.map(item => ({
        property: item.path,
        value: item.value
      })),
      Design: result.Design.map(item => ({
        property: item.path,
        value: item.value
      }))
    };

    return JSON.stringify(formattedResult, null, 2);
  } catch (error) {
    console.error("Error abstracting Vega-Lite JSON:", error);
    return JSON.stringify({
      error: "Failed to abstract Vega-Lite specification",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

const evaluateResult = (result: ProcessResult) => {
  if (!result.groundTruth || result.error) {
    return null;
  }

  let generatedVegaLite;
  try {
    generatedVegaLite = JSON.parse(result.vegaLite);
  } catch (error) {
    console.error("Error parsing generated VegaLite:", error);
    return null;
  }

  const groundTruth = result.groundTruth;
  const details: {
    property: string,
    category: string,
    matched: boolean,
    groundTruthValue: any,
    generatedValue: any
  }[] = [];

  // Track matches for each category
  const categoryMatches: Record<string, { matched: number, total: number }> = {
    Mark: {matched: 0, total: 0},
    Encoding: {matched: 0, total: 0},
    DataSchema: {matched: 0, total: 0},
    Design: {matched: 0, total: 0}
  };

  // Helper function to get property value from object using path string
  const getPropertyByPath = (obj: any, path: string): any => {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = current[part];
    }

    return current;
  };

  // Helper function to determine property category
  const getPropertyCategories = (path: string): string[] => {
    const categories = [];
    if (abstractionRules.DataSchema.some(rule => rule === path)) {
      categories.push('DataSchema');
    }
    if (abstractionRules.Mark.some(rule => rule === path)) {
      categories.push('Mark');
    }
    if (abstractionRules.Encoding.some(rule => rule === path)) {
      categories.push('Encoding');
    }
    return categories.length === 0 ? ['Design'] : categories;
  };

  // Helper function to get all property paths recursively
  const getPropertyPaths = (obj: any, currentPath: string = ''): string[] => {
    if (!obj || typeof obj !== 'object') {
      return [currentPath];
    }

    return Object.entries(obj).flatMap(([key, value]) => {
      const newPath = currentPath ? `${currentPath}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return getPropertyPaths(value, newPath);
      }

      return [newPath];
    });
  };

  // Get all property paths from both objects, skipping "$schema", "data", "encoding.*.type".
  const groundTruthPaths = getPropertyPaths(groundTruth).filter(p => !isExcluded(p));
  const generatedPaths = getPropertyPaths(generatedVegaLite).filter(p => !isExcluded(p));

  // Combine all unique paths
  const allPaths = Array.from(new Set([...groundTruthPaths, ...generatedPaths]));

  // Evaluate each property
  allPaths.forEach(path => {
    const groundTruthValue = getPropertyByPath(groundTruth, path);
    const generatedValue = getPropertyByPath(generatedVegaLite, path);

    // Skip undefined or null values in both
    if (groundTruthValue === undefined && generatedValue === undefined) {
      return;
    }

    const categories = getPropertyCategories(path);


    const matchTwoValues = (path: string, value1: any, value2: any): boolean => {
      if (value1 === undefined || value2 === undefined) {
        // if one of them is undefined, check if the other is default
        const defaultStyleList: Record<string, any>[] = [
          {"mark.tooltip": null},
        ]
        const defaultStyle = defaultStyleList.find(style => path in style);
        if (defaultStyle) {
          const v = value1 === undefined ? value2 : value1;
          return JSON.stringify(defaultStyle[path]) === JSON.stringify(v);
        }
        return false;
      }
      return JSON.stringify(value1) === JSON.stringify(value2);
    }

    const matched = matchTwoValues(path, groundTruthValue, generatedValue);

    categories.forEach(category => {
      if (category === 'DataSchema' && isDataFieldSpec(path)) {
        // if the path specifies a field (like encoding.x.field), it can be matched with the value of other encoding.*.field (e.g. encoding.y.field)
        let isFieldMatched = false;
        if (generatedValue === undefined) {
          const encodingPaths = generatedPaths.filter(p => p !== path && isDataFieldSpec(p));
          const encodingValues = encodingPaths.map(p => getPropertyByPath(generatedVegaLite, p));
          isFieldMatched = encodingValues.some(v => JSON.stringify(v) === JSON.stringify(groundTruthValue));
        } else {
          const encodingPaths = groundTruthPaths.filter(p => isDataFieldSpec(p));
          const encodingValues = encodingPaths.map(p => getPropertyByPath(groundTruth, p));
          isFieldMatched = encodingValues.some(v => JSON.stringify(v) === JSON.stringify(generatedValue));
        }
        if (isFieldMatched) {
          categoryMatches[category].matched += 1;
        }
        categoryMatches[category].total += 1;
        details.push({
          property: path,
          category,
          matched: isFieldMatched,
          groundTruthValue,
          generatedValue
        });
      } else {
        categoryMatches[category].total += 1;
        if (matched) {
          categoryMatches[category].matched += 1;
        }

        details.push({
          property: path,
          category,
          matched,
          groundTruthValue,
          generatedValue
        });
      }
    })
  });

  // remove the repeated properties in details (items whose property and category are the same together)
  const pcPairs = new Set();
  details.forEach(detail => {
    const pcPair = `${detail.property}-${detail.category}`;
    if (pcPairs.has(pcPair)) {
      detail.matched = false;
    } else {
      pcPairs.add(pcPair);
    }
  });
  details.sort((a, b) => {
    if (a.category === b.category) {
      return a.property.localeCompare(b.property);
    }
    return a.category.localeCompare(b.category);
  });
  // Remove duplicates
  const uniqueDetails = Array.from(new Set(details.map(d => JSON.stringify(d)))).map(d => JSON.parse(d));
  details.length = 0;
  details.push(...uniqueDetails);
  // Sort details by category and property
  details.sort((a, b) => {
    if (a.category === b.category) {
      return a.property.localeCompare(b.property);
    }
    return a.category.localeCompare(b.category);
  });

  // Calculate accuracy, 1 if "Mark", "Encoding", and "DataSchema" match, else 0
  const markMatch = categoryMatches.Mark.matched === categoryMatches.Mark.total;
  const encodingMatch = categoryMatches.Encoding.matched === categoryMatches.Encoding.total;
  const dataSchemaMatch = categoryMatches.DataSchema.matched === categoryMatches.DataSchema.total;
  const accuracy = markMatch && encodingMatch && dataSchemaMatch ? 1 : 0;

  // Calculate similarity based on Design properties
  // Using a weighted approach where design properties count less toward overall similarity
  const designMismatchCount = categoryMatches.Design.total - categoryMatches.Design.matched;
  const similarity = Math.pow(0.98, designMismatchCount);

  return {
    accuracy,
    similarity,
    details,
    categoryMatches
  };
};

const isExcluded = (path: string): boolean => {
  if (path.startsWith('data') || path.startsWith('$schema')) {
    return true;
  }
  if (path.split('.').length === 3 && path.startsWith('encoding') && path.endsWith('.type')) {
    return true;
  }
  return false;
}

const isDataFieldSpec = (path: string): boolean => {
  return path.split('.').length === 3 && path.startsWith('encoding') && path.endsWith('.field');
}