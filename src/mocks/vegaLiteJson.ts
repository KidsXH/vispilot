export const vegaLiteJson = {
  "$schema": "https://vega.github.io/schema/vega-lite/v3.json",
  "data": {
    "url": "datasets/superstore.csv"
  },
  "mark": {
    "type": "bar",
    "tooltip": null
  },
  "encoding": {
    "column": {
      "field": "Ship Mode",
      "type": "ordinal"
    },
    "x": {
      "field": "Segment",
      "scale": {
        "rangeStep": 15
      },
      "type": "ordinal",
      "axis": {
        "title": null,
        "labels": false,
        "ticks": false
      }
    },
    "y": {
      "aggregate": "mean",
      "field": "Profit",
      "type": "quantitative",
      "axis": {
        "title": "AVG (Profit)"
      }
    },
    "color": {
      "field": "Segment",
      "type": "nominal"
    }
  }
}