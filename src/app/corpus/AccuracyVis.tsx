import {ProcessResult} from "@/app/llm-processing/page";
import {useMemo} from "react";

const specDims = ['dataSchema', 'mark', 'encoding', 'design'] as const;

const AccuracyVis = (props: { processResult: ProcessResult[] }) => {
  const {processResult} = props;

  const accuracyByDim = useMemo(() => {
    const dataSchema: number[] = processResult.map((result) => {
      const evaluation = result.evaluation;
      const matches = evaluation?.categoryMatches.DataSchema
      return matches.matched === matches.total ? 1 : 0
    })
    const mark: number[] = processResult.map((result) => {
      const evaluation = result.evaluation;
      const matches = evaluation?.categoryMatches.Mark
      return matches.matched === matches.total ? 1 : 0
    })
    const encoding: number[] = processResult.map((result) => {
      const evaluation = result.evaluation;
      const matches = evaluation?.categoryMatches.Encoding
      return matches.matched === matches.total ? 1 : 0
    })
    const design: number[] = processResult.map((result) => {
      const evaluation = result.evaluation;
      const matches = evaluation?.categoryMatches.Design
      return matches.matched === matches.total ? 1 : 0
    })

    return {
      dataSchema: dataSchema.reduce((a, b) => a + b, 0) / dataSchema.length,
      mark: mark.reduce((a, b) => a + b, 0) / mark.length,
      encoding: encoding.reduce((a, b) => a + b, 0) / encoding.length,
      design: design.reduce((a, b) => a + b, 0) / design.length,
    }
  }, [processResult])

  const dataSchemaAcc = useMemo(() => {
    const dataSchema = processResult.map((result) => {
      const explanation = result.explanation.DataSchema;
      const evaluation = result.evaluation;
      let implicitCount = 0;
      let explicitCount = 0;

      let implicitMatch = 0;
      let explicitMatch = 0;

      evaluation?.details.forEach(detail => {
        if (detail.category === 'DataSchema') {
          const prop = detail.property.replace(/encoding./g, '');
          const explicit = explanation.find((d: any) => d.property === prop)?.explicit || false;
          if (explicit) {
            explicitCount++;
            if (detail.matched) {
              explicitMatch++;
            }
          } else {
            implicitCount++;
            if (detail.matched) {
              implicitMatch++;
            }
          }
        }
      })

      return {
        id: result.id,
        implicitCount,
        explicitCount,
        implicitMatch,
        explicitMatch,
      }
    });

    const impTotalCount = dataSchema.reduce((a, b) => a + b.implicitCount, 0);
    const expTotalCount = dataSchema.reduce((a, b) => a + b.explicitCount, 0);

    const impTotalMatch = dataSchema.reduce((a, b) => a + b.implicitMatch, 0);
    const expTotalMatch = dataSchema.reduce((a, b) => a + b.explicitMatch, 0);

    const impAccuracy = impTotalCount === 0 ? 0 : impTotalMatch / impTotalCount;
    const expAccuracy = expTotalCount === 0 ? 0 : expTotalMatch / expTotalCount;

    return {
      implicitAccuracy: impAccuracy,
      explicitAccuracy: expAccuracy,
    }
  }, [processResult])

  const markAcc = useMemo(() => {
    const mark = processResult.map((result) => {
      const explanation = result.explanation.Mark;
      const evaluation = result.evaluation;
      let implicitCount = 0;
      let explicitCount = 0;

      let implicitMatch = 0;
      let explicitMatch = 0;

      evaluation?.details.forEach(detail => {
        if (detail.category === 'Mark') {
          const prop = detail.property;
          const explicit = explanation.find((d: any) => d.property === prop)?.explicit || false;
          if (explicit) {
            explicitCount++;
            if (detail.matched) {
              explicitMatch++;
            }
          } else {
            implicitCount++;
            if (detail.matched) {
              implicitMatch++;
            }
          }
        }
      })

      return {
        id: result.id,
        implicitCount,
        explicitCount,
        implicitMatch,
        explicitMatch,
      }
    });

    const impTotalCount = mark.reduce((a, b) => a + b.implicitCount, 0);
    const expTotalCount = mark.reduce((a, b) => a + b.explicitCount, 0);

    const impTotalMatch = mark.reduce((a, b) => a + b.implicitMatch, 0);
    const expTotalMatch = mark.reduce((a, b) => a + b.explicitMatch, 0);

    const impAccuracy = impTotalCount === 0 ? 0 : impTotalMatch / impTotalCount;
    const expAccuracy = expTotalCount === 0 ? 0 : expTotalMatch / expTotalCount;

    return {
      implicitAccuracy: impAccuracy,
      explicitAccuracy: expAccuracy,
    }
  }, [processResult])

  const encodingAcc = useMemo(() => {
    const encoding = processResult.map((result) => {
      const explanation = result.explanation.Encoding;
      const evaluation = result.evaluation;
      let implicitCount = 0;
      let explicitCount = 0;

      let implicitMatch = 0;
      let explicitMatch = 0;

      evaluation?.details.forEach(detail => {
        if (detail.category === 'Encoding') {
          const prop = detail.property;
          const explicit = explanation.find((d: any) => d.property === prop)?.explicit || false;
          if (explicit) {
            explicitCount++;
            if (detail.matched) {
              explicitMatch++;
            }
          } else {
            implicitCount++;
            if (detail.matched) {
              implicitMatch++;
            }
          }
        }
      })

      return {
        id: result.id,
        implicitCount,
        explicitCount,
        implicitMatch,
        explicitMatch,
      }
    });

    const impTotalCount = encoding.reduce((a, b) => a + b.implicitCount, 0);
    const expTotalCount = encoding.reduce((a, b) => a + b.explicitCount, 0);

    const impTotalMatch = encoding.reduce((a, b) => a + b.implicitMatch, 0);
    const expTotalMatch = encoding.reduce((a, b) => a + b.explicitMatch, 0);

    const impAccuracy = impTotalCount === 0 ? 0 : impTotalMatch / impTotalCount;
    const expAccuracy = expTotalCount === 0 ? 0 : expTotalMatch / expTotalCount;

    return {
      implicitAccuracy: impAccuracy,
      explicitAccuracy: expAccuracy,
    }
  }, [processResult])

  const designAcc = useMemo(() => {
    const design = processResult.map((result) => {
      const explanation = result.explanation.Design;
      const evaluation = result.evaluation;
      let implicitCount = 0;
      let explicitCount = 0;

      let implicitMatch = 0;
      let explicitMatch = 0;

      evaluation?.details.forEach(detail => {
        if (detail.category === 'Design') {
          const prop = detail.property;
          const explicit = explanation?.find((d: any) => d.property === prop)?.explicit || false;
          if (explicit) {
            explicitCount++;
            if (detail.matched) {
              explicitMatch++;
            }
          } else {
            implicitCount++;
            if (detail.matched) {
              implicitMatch++;
            }
          }
        }
      })

      return {
        id: result.id,
        implicitCount,
        explicitCount,
        implicitMatch,
        explicitMatch,
      }
    });

    const impTotalCount = design.reduce((a, b) => a + b.implicitCount, 0);
    const expTotalCount = design.reduce((a, b) => a + b.explicitCount, 0);

    const impTotalMatch = design.reduce((a, b) => a + b.implicitMatch, 0);
    const expTotalMatch = design.reduce((a, b) => a + b.explicitMatch, 0);

    const impAccuracy = impTotalCount === 0 ? 0 : impTotalMatch / impTotalCount;
    const expAccuracy = expTotalCount === 0 ? 0 : expTotalMatch / expTotalCount;

    return {
      implicitAccuracy: impAccuracy,
      explicitAccuracy: expAccuracy,
    }
  }, [processResult])

  console.log('ACC', accuracyByDim)

  console.log('DataSchema Accuracy', dataSchemaAcc)
  console.log('Mark Accuracy', markAcc)
  console.log('Encoding Accuracy', encodingAcc)
  console.log('Design Accuracy', designAcc)

  return <>
    <div className="flex items-center py-2 font-bold text-neutral-600">
      Misinterpretations
    </div>
  </>
}

export default AccuracyVis;