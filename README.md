# VisPilot - Multimodal Visualization Authoring with LLMs

> Official repository for [Exploring Multimodal Prompt for Visualization Authoring with Large Language Models](https://doi.org/10.1109/TVCG.2026.3701510), published in *IEEE Transactions on Visualization and Computer Graphics*, 2026 [[arXiv preprint](https://arxiv.org/abs/2504.13700)].

VisPilot is a system that enables users to create visualizations using multimodal prompts, including text, sketches, and direct manipulations on existing visualizations. This repository contains the source code for the VisPilot system, which explores the potential of multimodal prompting for visualization authoring with Large Language Models (LLMs).

![](/public/teaser.png)

## Features

- Multimodal visualization authoring with text, sketches, and direct manipulation
- Data table view for exploring datasets
- Chat interface for natural language interaction
- Design panel for customizing styles
- History panel for tracking visualization changes
- Interactive interface for trying the system - [Online Demo](https://wenzhen.site/vispilot/demo)
- Corpus view for exploring the research dataset - [Corpus Page](https://wenzhen.site/vispilot/corpus)

## Demo

https://github.com/user-attachments/assets/81aad1bc-7adc-4080-b3c6-1bae64e3415c

## Project Content

- `/src/app/page.tsx`: Project website
- `/src/app/demo`: Interactive visualization authoring interface
- `/src/app/corpus`: Visualization corpus analysis tools
- `/src/prompts`: Prompts for visualization authoring and interpretation

## Getting Started

### Prerequisites

- Node.js 22 or 24 LTS
- npm or yarn
- Your own API key for an OpenAI-compatible service and access to a model that supports image input for multimodal prompting

### Installation

1. Clone the repository:

```bash
git clone https://github.com/KidsXH/vispilot.git
cd vispilot
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open the project website at `http://localhost:3000/vispilot`. The authoring interface is at `http://localhost:3000/vispilot/demo`, and the corpus viewer is at `http://localhost:3000/vispilot/corpus`.

### Configure the Model and Create a Visualization

1. Open the authoring interface. The **Chat Configuration** dialog appears on entry; you can reopen it from the Chat panel's configuration button.
2. Enter the following settings:

| Setting | Value |
| --- | --- |
| **Base URL** | An OpenAI-compatible API base URL. Do not append `/chat/completions`. |
| **Model Name** | A model ID available through your provider, such as `openai/gpt-4o`. Choose a model with image input support for sketches and visual prompts. |
| **API Key** | Your own key for the configured provider. |

3. Click **OK**, then upload a CSV file in **Data Table**. Example datasets are available in [`public/data`](public/data).
4. Enter a text prompt in Chat, or sketch and annotate on the canvas and click **Ask VisPilot**. Inspect and refine the generated visualization using the canvas and Design Panel.

The API key, base URL, and model name are stored in your browser's `localStorage`. Model requests are sent directly from the browser to the configured API endpoint. Configuration is entered in the interface; the demo does not require an `.env` file for these settings.

## Research

This project explores how LLMs interpret ambiguous or incomplete text prompts in the context of visualization authoring, and introduces visual prompts as a complementary input modality to improve user intent interpretation.

We evaluate VisPilot through a controlled user study with 15 participants and an expert evaluation. The results suggest that multimodal prompts facilitate users in communicating spatial constraints, local references, and design preferences while maintaining comparable task efficiency to text-only prompting. We further discuss when text, visual, and hybrid prompts are beneficial for visualization authoring, and summarize design implications for future human-AI authoring systems.

## Resources

- [Project Page](https://wenzhen.site/vispilot)
- [TVCG Journal Article](https://doi.org/10.1109/TVCG.2026.3701510)
- [arXiv Preprint](https://arxiv.org/abs/2504.13700)
- [Online Demo](https://wenzhen.site/vispilot/demo)
- [Corpus Viewer](https://wenzhen.site/vispilot/corpus)
- [Supplementary Materials](https://osf.io/2qrak)

## Citation

Please cite the published journal article:

```bibtex
@article{wen2026exploring,
  title   = {Exploring Multimodal Prompt for Visualization Authoring with Large Language Models},
  author  = {Zhen Wen and Luoxuan Weng and Yinghao Tang and Runjin Zhang and Yuxin Liu and Bo Pan and Minfeng Zhu and Wei Chen},
  journal = {IEEE Transactions on Visualization and Computer Graphics},
  year    = {2026},
  volume  = {32},
  number  = {9},
  pages   = {7685--7700},
  doi     = {10.1109/TVCG.2026.3701510}
}
```

## License

This work is licensed under a [Creative Commons Attribution-NonCommercial 4.0 International License](https://creativecommons.org/licenses/by-nc/4.0/).
