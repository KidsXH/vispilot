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