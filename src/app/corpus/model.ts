'use client'

import {UtteranceSample} from "@/types";
import {SpecCategory} from "@/app/corpus/page";

const categories = ['Explicit', 'Implicit', 'None']

export const testUtteranceSample = async (sample: UtteranceSample) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const dataSchema = 'Explicit' as SpecCategory
  const task = categories[Math.floor(Math.random() * categories.length)] as SpecCategory
  const mark = categories[Math.floor(Math.random() * categories.length)] as SpecCategory
  const encoding = categories[Math.floor(Math.random() * categories.length)] as SpecCategory
  const design = 'None' as SpecCategory

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