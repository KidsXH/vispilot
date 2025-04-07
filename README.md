# VisPilot

VisPilot is a system that enables users to create visualizations using multimodal prompts, including text, sketches, and direct manipulations on existing visualizations. This repository contains the source code for the VisPilot system, which explores the potential of multimodal prompting for visualization authoring with Large Language Models (LLMs).

## Features

- Multimodal visualization authoring with text, sketches, and direct manipulation
- Interactive design panel for refining visualization parameters
- Data table view for exploring datasets
- Chat interface for natural language interaction
- History panel for tracking visualization changes
- Demo interface for trying the system
- Corpus view for exploring the research dataset

## Project Structure

- `/src/app`: Main application routes and pages
    - `/corpus`: Visualization corpus analysis tools
    - `/demo`: Interactive demo interface
- `/components`: React components for the UI
- `/public`: Static assets including images

## Getting Started

### Prerequisites

- Node.js (18.x or later)
- npm or yarn

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

4. Open your browser and navigate to `http://localhost:3000/vispilot`

## Research

This project explores how LLMs interpret ambiguous or incomplete text prompts in the context of visualization authoring, and introduces visual prompts as a complementary input modality to improve user intent interpretation. Our research highlights the importance of multimodal prompting in enhancing human-AI collaboration for visualization tasks.

### Citation

```bibtex
@article{wen2025exploring,
  title={Exploring Multimodal Prompt for Visualization Authoring with Large Language Models},
  author={Wen, Zhen and Weng, Luoxuan and Tang, Yinghao and Zhang, Runjin and Pan, Bo and Zhu, Minfeng and Chen, Wei},
  journal={arXiv preprint},
  year={2025}
}
```

## Resources

- [Paper (Coming soon)](undefined)
- [Code](https://github.com/KidsXH/vispilot)
- [Supplementary Materials](https://osf.io/2qrak)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
