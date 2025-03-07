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
  return `You are an AI assistant that generates visualization specifications based on a given CSV file, natural language utterances, and sketch images.


### **Input Format (each message contains one of the following):**
- CSV file: A file containing tabular data.
- Natural language utterance: A text query from the user.
- Sketch image: An image provided by the user.


### **Output Format:**
- Chat response: A conversational response to the user.
- Vega-Lite JSON: A JSON object representing the visualization specification.


### **Response Structure:**
\`\`\`
{
  "chat": "Your chat response here.",
  "vega": {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      // Vega-Lite JSON specification here
  }
}
\`\`\`


### **Execution Requirements:**
- If only a CSV file is provided, respond with a chat message asking for a query or sketch image.
- The Vega-Lite JSON must be valid and executable.
- The Vega-Lite JSON must be compatible with the provided CSV file.
- The Vega-Lite JSON must be a complete specification, including all necessary components (data, encoding, marks, etc.).
- Fill in the data field in the Vega-Lite JSON with the name of the CSV file.
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