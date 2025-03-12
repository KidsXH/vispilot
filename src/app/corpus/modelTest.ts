'use client'

import {CSVData, Message, UtteranceSample} from "@/types";
import {SpecCategory} from "@/app/corpus/page";
import {sendRequest} from "@/model";

const categories = ['Explicit', 'Implicit', 'None']

export const testUtteranceSampleTest = async (sample: UtteranceSample, dataset: {filename: string, csvData: CSVData}) => {
  const specCats = await generateSpecs(sample.utteranceSet, dataset);

  const dataSchema = specCats.dataSchema as SpecCategory
  const task = specCats.task as SpecCategory
  const mark = specCats.mark as SpecCategory
  const encoding = specCats.encoding as SpecCategory
  const design = specCats.design as SpecCategory

  const explicitCount = [dataSchema, task, mark, encoding, design].filter((category) => category === 'Explicit').length;
  const implicitCount = [dataSchema, task, mark, encoding, design].filter((category) => category === 'Implicit').length;
  const noneCount = 5 - explicitCount - implicitCount;
  const accuracy = 0.2 + Math.random() * ((explicitCount * 2 + implicitCount) / 10);
  const inferenceLevel = (noneCount * 20 + implicitCount * 5) / 100;

  // return {
  //   ...sample,
  //   dataSchema,
  //   task,
  //   mark,
  //   encoding,
  //   design,
  //   accuracy,
  //   inferenceLevel,
  //   tested: 'yes',
  // } as UtteranceSample;
}

const generateSpecs = async (utterance: string, dataset: {filename: string, csvData: CSVData}) => {
  const systemPrompt = generateSystemPrompt();
  const csvPrompt = generateCSVPrompt(dataset);
  const queryPrompt = `The following is a natural language query:\n\n${utterance}\n\n`;

  const messages: Message[] = [
    {
      id: 0,
      role: 'user',
      content: [
        {type: 'text', text: systemPrompt + csvPrompt + queryPrompt}
      ],
      sender: 'user'
    },
  ]

  const responseMessage = await requestOpenAI(messages);
  console.log('response', responseMessage);
  return responseMessage;
}

export const generateSystemPrompt = () => {
  return `You are an AI assistant that generates visualization specifications based on a given CSV file and a natural language (NL) query. Follow these steps precisely:  

1. **Parse the CSV File:**  
   - Inspect the data structure, extracting column names, types, and possible domains.  

2. **Generate a Visualization Specification based on NL Query:**  
   - Construct a specification consisting of the following five components:  
     - **Data Schema**: Defines attributes, types, and domains.  
     - **Analytic Task**: Identifies the analytical intent (e.g., comparison, correlation).  
     - **Mark**: Specifies the fundamental graphical representation (e.g., points, bars, lines).  
     - **Encoding**: Maps data attributes to visual channels (e.g., x-axis, y-axis, color).  
     - **Design**: Captures non-data-related stylistic elements (e.g., gridlines, background).  

3. **Categorize Each Specification Component:**  
   - Label each component as **Explicit**, **Implicit**, or **None**, based on whether it was directly stated, implied, or absent in the query.  

4. **Generate Output in JSON Format:**  
   - Return the visualization specification and categorization in a structured JSON format.  

### **JSON Output Format:**  

\`\`\`json
{
  "visualization_specification": {
    "data_schema": [
      {"attribute": "MPG", "type": "quantitative", "domain": [0, 100]},
      {"attribute": "Displacement", "type": "quantitative", "domain": [0, 500]},
      {"attribute": "Origin", "type": "categorical", "domain": ["USA", "Europe", "Japan"]}
    ],
    "analytic_task": ["correlation", "comparison"],
    "mark": "point",
    "encoding": {
      "x": "Displacement",
      "y": "MPG",
      "color": "Origin"
    },
    "design": {
      "gridlines": true,
      "axis_labels": ["MPG", "Displacement"],
      "legend": true,
      "background": "white"
    }
  },
  "categorization": {
    "data_schema": "Explicit",
    "analytic_task": "Implicit",
    "mark": "Explicit",
    "encoding": "Explicit",
    "design": "None"
  }
}
\`\`\`

### **Execution Requirements:**  
- This process should be triggered **intermediately** when receiving a CSV file and natural language query.
- The JSON output must strictly follow the structure above.  
- Ensure completeness and correctness while maintaining efficiency.  

`
}

const generateCSVPrompt = ({filename, csvData}: {filename: string, csvData: { [key: string]: string }[]}) => {
  let prompt = `The following is a CSV file named ${filename}:\n\n`;

  const headers = Object.keys(csvData[0]);
  // header line
  prompt += `${headers.join(', ')}\n`;

  const maxRows = 5;
  // data lines
  prompt += `${csvData.slice(0, maxRows).map(row => headers.map(header => row[header]).join(', ')).join('\n')}\n\n`;

  return prompt;
}

const requestOpenAI = async (messages: Message[])=> {
  const api = `${process.env.NEXT_PUBLIC_OPENAI_API_BASE_URL}/chat/completions`;
  const key = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  const payload = {
    model: 'gpt-4o',
    messages: messages.map((message) => {
      return {
        role: message.role,
        content: message.content[0].text
      }
    }),
  }

  console.log('sending request to', api, payload);
  const response = await fetch(api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify(payload)
  });

  const responseJson = await response.json();
  const content = responseJson.choices[0].message.content;
  return parseResponseContent(content);
}

const parseResponseContent = (content: string) => {
  // the content is starting with ```json and ending with ```
  if (!content.startsWith('```json') || !content.endsWith('```')) {
    return {
      dataSchema: '',
      task: '',
      mark: '',
      encoding: '',
      design: ''
    }
  }

  const jsonString = content.slice(7, -3);
  const json = JSON.parse(jsonString);

  const dataSchema = json.categorization['dataSchema'] || json.categorization['data_schema'] || ''
  const task = json.categorization['analyticTask'] || json.categorization['analytic_task'] || ''
  const mark = json.categorization['mark'] || ''
  const encoding = json.categorization['encoding'] || ''
  const design = json.categorization['design'] || ''

  return {
    dataSchema,
    task,
    mark,
    encoding,
    design
  }
}