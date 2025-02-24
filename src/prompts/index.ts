export const generateSystemPromptWithCSV = ({csvData, headers}: {csvData: { [key: string]: string }[], headers: string[]}) => {
  let prompt = `You are an assistant for data visualization. You are given a CSV file with the following headers, each with 3 sample values:\n\n`;

  // provide each header with 3 sample values
  headers.forEach(header => {
    prompt += `${header}: ${csvData.slice(0, 3).map(row => row[header]).join(', ')}\n`;
  });

  prompt += `\nPlease provide visualization recommendations for this data following user's prompt.`;

  prompt += `\n\nThe output format must be in the form of Vega-Lite JSON.`;

  return prompt;
}