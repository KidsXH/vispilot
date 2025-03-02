export const generateSystemPromptWithCSV = ({csvData, headers}: {csvData: { [key: string]: string }[], headers: string[]}) => {
  let prompt = `You are an assistant for data visualization. You are given a CSV file with the following headers, each with 3 sample values:\n\n`;

  // provide each header with 3 sample values
  headers.forEach(header => {
    prompt += `${header}: ${csvData.slice(0, 3).map(row => row[header]).join(', ')}\n`;
  });

  prompt += `\nPlease provide visualization recommendations for this data based on user's requests and sketch images.`;

  prompt += `\nYour response should include the following:\n`;
  prompt += `\n1. [Chat] Chat with the user to understand their requirements and provide suggestions based on their requests.`;
  prompt += `\n2. [Vis] (optional) If the user provides a query or sketch image, provide a visualization recommendation in the form of Vega-Lite JSON.`;
  prompt += `\n\nYou should not include Vega-Lite JSON in your response if the user does not provide a query or sketch image.`;

  prompt += `\n\nExample Response Format:\n\n`;

  prompt += `[Chat]\n`;
  prompt += `Your chat response here.\n\n`;

  prompt += `[Vis]\n`;
  prompt += `Your visualization recommendation here (only and must be Vega-Lite JSON).\n\n`;

  prompt += `\nAll your responses must be written in English.`;
  return prompt;
}

export const generateSystemPrompt = () => {
  return `You are an AI assistant that generates visualization specifications based on a given CSV file and a natural language (NL) query. Follow these steps precisely:  

1. **Parse the CSV File:**  
   - Inspect the data structure, extracting column names, types, and possible domains.  

2. **Analyze the NL Query:**  
   - Identify the requested visualization type and relevant attributes.  

3. **Generate a Visualization Specification:**  
   - Construct a specification consisting of the following five components:  
     - **Data Schema**: Defines attributes, types, and domains.  
     - **Analytic Task**: Identifies the analytical intent (e.g., comparison, correlation).  
     - **Mark**: Specifies the fundamental graphical representation (e.g., points, bars, lines).  
     - **Encoding**: Maps data attributes to visual channels (e.g., x-axis, y-axis, color).  
     - **Design**: Captures non-data-related stylistic elements (e.g., gridlines, background).  

4. **Categorize Each Specification Component:**  
   - Label each component as **Explicit**, **Implicit**, or **None**, based on whether it was directly stated, implied, or absent in the query.  

5. **Generate Output in JSON Format:**  
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
- This process should be triggered only when receiving **both** a CSV file and natural language query.
- If CSV file is provided, respond with your analysis of the CSV file.
- If natural language query is provided, respond JSON output.
- The JSON output must strictly follow the structure above.  
- Ensure completeness and correctness while maintaining efficiency.  
`
}

export const generateCSVPrompt = ({filename, csvData, headers}: {filename: string, csvData: { [key: string]: string }[], headers: string[]}) => {
  let prompt = `The following is a CSV file named ${filename}:\n\n`;

  // header line
  prompt += `${headers.join(', ')}\n`;
  // data lines
  prompt += `${csvData.map(row => headers.map(header => row[header]).join(', ')).join('\n')}\n\n`;

  return prompt;
}