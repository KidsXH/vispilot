# VisPilot - Multimodal Visualization Authoring with LLMs

> Here is the official repository for the paper [Exploring Multimodal Prompt for Visualization Authoring with Large Language Models]() (coming soon).

VisPilot is a system that enables users to create visualizations using multimodal prompts, including text, sketches, and direct manipulations on existing visualizations. This repository contains the source code for the VisPilot system, which explores the potential of multimodal prompting for visualization authoring with Large Language Models (LLMs).

![](/public/teaser.png)

## Features

- Multimodal visualization authoring with text, sketches, and direct manipulation
- Data table view for exploring datasets
- Chat interface for natural language interaction
- Design panel for customizing styles
- History panel for tracking visualization changes
- Interactive interface for trying the system - [Online Demo](https://wenzhen.site/vispilot/)
- Corpus view for exploring the research dataset - [Corpus Page](https://wenzhen.site/vispilot/)  (in development)

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

## Resources

- [Page](https://wenzhen.site/vispilot)
- [Paper (Coming soon)](undefined)
- [Supplementary Materials](https://osf.io/2qrak)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
