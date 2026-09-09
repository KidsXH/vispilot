'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 font-sans">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Exploring Multimodal Prompt for Visualization Authoring with Large
          Language Models</h1>

        <div className="mt-4 mb-6">
          <div className="grid grid-cols-2 md:flex md:justify-between gap-2 max-w-4xl mx-auto">
            {[
              {name: 'Zhen Wen', inst: '1'},
              {name: 'Luoxuan Weng', inst: '1'},
              {name: 'Yinghao Tang', inst: '1'},
              {name: 'Runjin Zhang', inst: '1'},
              {name: 'Yuxin Liu', inst: '1'},
              {name: 'Bo Pan', inst: '1'},
              {name: 'Minfeng Zhu', inst: '2'},
              {name: 'Wei Chen', inst: '1'}
            ].map((author, i) => (
              <div key={i} className="text-center">
                <p className="font-medium">
                  {author.name}
                  <sup>{author.inst}</sup>
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 text-sm text-gray-600 text-center">
            <p><sup>1</sup>State Key Lab of CAD&CG, Zhejiang University &nbsp; <sup>2</sup>Zhejiang University</p>
          </div>
        </div>


        <div className="mt-6 flex justify-center space-x-6">
          <a href="https://arxiv.org/abs/2504.13700" className="text-slate-700 group flex items-center" target="_blank"
             rel="noopener noreferrer">
            <span className="material-symbols-outlined mr-1 group-hover:no-underline"
                  style={{fontSize: '18px'}}>description</span>
            <span className="group-hover:underline">Paper</span>
          </a>
          <a href="https://github.com/KidsXH/vispilot" className="text-slate-700 group flex items-center"
             target="_blank" rel="noopener noreferrer">
            <span className="material-symbols-outlined mr-1 group-hover:no-underline"
                  style={{fontSize: '18px'}}>code</span>
            <span className="group-hover:underline">Code</span>
          </a>
          <a href="https://osf.io/2qrak" className="text-slate-700 group flex items-center" target="_blank"
             rel="noopener noreferrer">
            <span className="material-symbols-outlined mr-1 group-hover:no-underline"
                  style={{fontSize: '18px'}}>upload_file</span>
            <span className="group-hover:underline">Supplementary Materials</span>
          </a>
        </div>


        <div className="mt-6 flex justify-center space-x-4">
          <Link href="/demo" className="px-5 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition">
            Try the Demo
          </Link>
          <Link href="/corpus" className="px-5 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition">
            View Corpus
          </Link>
        </div>
      </header>


      <section className="mb-16">
        <div className="bg-slate-100 p-6 rounded-lg">
          <div className="bg-white border border-slate-300 mb-4 py-0.5">
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Image src={'/vispilot/teaser.png'} alt={'teaser'} width={1280} height={300}/>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Multimodal prompt for visualization authoring with VisPilot. (A) The user can create visualizations by
            providing sketching, text annotations or directly manipulating existing visualizations. (B) VisPilot
            interprets the multimodal input and generates visualizations.
          </p>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-4">Abstract</h2>
        <p className="text-gray-700 leading-relaxed text-justify text-pretty hyphens-auto">
          Recent advances in large language models (LLMs) have shown great potential in automating the process
          of visualization authoring through simple natural language utterances. However, instructing LLMs using
          natural language is limited in precision and expressiveness for conveying visualization intent,
          leading to misinterpretation and time-consuming iterations. To address these limitations, we conduct
          an empirical study to understand how LLMs interpret ambiguous or incomplete text prompts in the
          context of visualization authoring, and the conditions making LLMs misinterpret user intent. Informed
          by the findings, we introduce visual prompts as a complementary input modality to text prompts, which
          help clarify user intent and improve LLMs&#x27; interpretation abilities. To explore the potential of
          multimodal prompting in visualization authoring, we design VisPilot, which enables users to easily
          create visualizations using multimodal prompts, including text, sketches, and direct manipulations on
          existing visualizations. We evaluate VisPilot through a controlled user study and an expert
          evaluation. The results suggest that multimodal prompts facilitate users in communicating spatial
          constraints, local references, and design preferences while maintaining comparable task efficiency to
          text-only prompting. We further discuss when text, visual, and hybrid prompts are beneficial for
          visualization authoring, and summarize design implications for future human-AI authoring systems. All
          materials are available at
          {' '}<a href="https://osf.io/2qrak" className="text-slate-700 underline" target="_blank"
                 rel="noopener noreferrer">https://osf.io/2qrak</a>.
        </p>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-4">The VisPilot System</h2>
        <div className="bg-slate-100 p-6 rounded-lg">
          <div className="aspect-video bg-white border border-slate-300 rounded-lg mb-4">
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Image src={'/vispilot/ui-design.png'} alt={'VisPilot interface'} width={1920} height={1080}/>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            The interface of VisPilot includes four components: (A) Chat Interface, (B) Free-drawing Canvas, (C) Design
            Panel, and (D) Authoring Flow.
          </p>
        </div>
      </section>


      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-4">Multimodal Prompt Framework</h2>

        <div className="bg-slate-100 p-6 rounded-lg">
          <div className="bg-white border border-slate-300 rounded-lg mb-4 px-10 py-6">
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Image className='' src={'/vispilot/visual-prompt.png'} alt={'Illustration of prompt framework'} width={1280} height={300}/>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Our prompting framework instructs the LLM to interpret visual prompts to visualization specifications step by step.
          </p>
        </div>

        {/*<p className="text-gray-700 leading-relaxed text-justify text-pretty hyphens-auto">*/}
        {/*  Framework*/}
        {/*</p>*/}
      </section>


      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-4">Use Cases</h2>

        <h3 className="text-xl font-bold mb-4">Case 1 - Visualization Authoring</h3>
        <div className="bg-slate-100 p-6 rounded-lg mb-4">
          <div className="aspect-video bg-white border border-slate-300 rounded-lg mb-4">
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <video
                className="w-full h-full"
                controls
                poster="/vispilot/ui-design.png"
              >
                <source src="/vispilot/Vispilot-DemoVideo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            The video demonstrates the process of creating a sophisticated visualization using VisPilot (full video coming soon).
          </p>
        </div>


        <h3 className="text-xl font-bold mb-4">Case 2 - Data Exploration</h3>
        <div className="bg-slate-100 p-6 rounded-lg">
          <div className="bg-white border border-slate-300 rounded-lg mb-4">
            <div className="w-full h-full flex items-center justify-center text-gray-400 rounded-lg">
              <a href="/vispilot/case2.png" target="_blank" rel="noopener noreferrer"
                 aria-label="Open the Case 2 figure at full resolution" className="block w-full cursor-zoom-in">
                <Image className="w-full h-auto rounded-lg" src="/vispilot/case2.png"
                       alt="Domain experts analyzing Premier League player statistics with VisPilot, from scatterplots to a comparison of Milos Kerkez and the average defender"
                       width={2560} height={530}/>
              </a>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Case study with domain experts analyzing Premier League player statistics, using VisPilot to iteratively
            create visualizations from (A) to (D).{' '}
            <a href="/vispilot/case2.png" className="text-slate-700 underline" target="_blank"
               rel="noopener noreferrer">View full-size image</a>.
          </p>
        </div>
      </section>


      <section className="mb-16">
        <div>
          <h2 className="text-2xl font-bold mb-4">Research Contributions</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>
              Empirical study on LLMs&#39; interpretation of natural language prompts for visualization authoring
            </li>
            <li>
              Novel prompting framework for multimodal visualization authoring
            </li>
            <li>
              Interactive system for visualization authoring
            </li>
            <li>User study findings on multimodal visualization requests</li>
          </ul>
        </div>
      </section>


      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-4">Citation</h2>
        <div className="rounded-lg">
    <pre className="text-sm overflow-x-auto p-2 bg-neutral-50 border border-slate-300 rounded font-mono text-gray-700">
      {`@article{wen2026exploring,
  title   = {Exploring Multimodal Prompt for Visualization Authoring with Large Language Models},
  author  = {Zhen Wen and Luoxuan Weng and Yinghao Tang and Runjin Zhang and Yuxin Liu and Bo Pan and Minfeng Zhu and Wei Chen},
  journal = {IEEE Transactions on Visualization and Computer Graphics},
  year    = {2026},
  volume  = {32},
  number  = {9},
  pages   = {7685--7700},
  doi     = {10.1109/TVCG.2026.3701510}
}`}
    </pre>
        </div>
      </section>

      <footer className="border-t pt-8 text-center text-gray-600">
        <p>This project is licensed under the <a className='text-slate-700 hover:underline' href={'https://creativecommons.org/licenses/by-nc/4.0/'}>CC BY-NC 4.0 License.</a></p>
        <div className="mt-4 space-x-4">
          <a href="https://arxiv.org/pdf/2504.13700" className="text-slate-700 hover:underline">Paper PDF</a>
          <a href="https://github.com/KidsXH/vispilot" className="text-slate-700 hover:underline">GitHub</a>
          {/*<a href="#" className="text-slate-700 hover:underline">Contact</a>*/}
        </div>
      </footer>
    </div>
  )
}
