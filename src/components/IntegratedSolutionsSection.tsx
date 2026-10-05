import React, { useState } from 'react';
import { Layers, Cpu, ArrowRight, CheckCircle2 } from 'lucide-react';
import { INTEGRATED_SOLUTIONS } from '../data/projectsAndSolutions';

interface IntegratedSolutionsSectionProps {
  onEnquireSolution: (solutionName: string) => void;
}

export const IntegratedSolutionsSection: React.FC<IntegratedSolutionsSectionProps> = ({
  onEnquireSolution,
}) => {
  const [activeSolutionId, setActiveSolutionId] = useState<string>(INTEGRATED_SOLUTIONS[0].id);

  const activeSolution =
    INTEGRATED_SOLUTIONS.find((s) => s.id === activeSolutionId) || INTEGRATED_SOLUTIONS[0];

  return (
    <section className="py-24 bg-white border-t border-neutral-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <span className="text-xs font-bold tracking-[0.25em] font-montserrat text-[#C5832B] uppercase mb-3 block">
            THE SRL ADVANTAGE
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-montserrat tracking-tight text-neutral-900 mb-4 uppercase">
            DESIGN + AUTOMATION INTEGRATION
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed font-sans">
            See how physical interior materials and digital automation unite to create intelligent, world-class environments.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12">
          {INTEGRATED_SOLUTIONS.map((sol) => {
            const isSelected = activeSolutionId === sol.id;
            return (
              <button
                key={sol.id}
                onClick={() => setActiveSolutionId(sol.id)}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold font-montserrat transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#C5832B] text-white font-bold shadow-sm'
                    : 'bg-[#F8F9FA] text-neutral-700 hover:text-neutral-900 border border-neutral-200 shadow-2xs'
                }`}
              >
                {sol.title}
              </button>
            );
          })}
        </div>

        {/* Main Integrated Card */}
        <div className="bg-[#FAFAFA] rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left 5 Cols: Visual Banner */}
            <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-full">
              <img
                src={activeSolution.image}
                alt={activeSolution.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-[10px] font-mono tracking-widest text-[#DE9B42] uppercase block mb-1 font-bold">
                  SECTOR ARCHITECTURE
                </span>
                <h3 className="text-2xl font-bold font-montserrat text-white mb-1">
                  {activeSolution.title}
                </h3>
                <p className="text-xs text-neutral-200">
                  {activeSolution.subtitle}
                </p>
              </div>
            </div>

            {/* Right 7 Cols: Interior vs Automation Side-by-Side Breakdown */}
            <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  {/* Left Column: Interior Materials */}
                  <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-md bg-[#C5832B]/10 border border-[#C5832B]/30 flex items-center justify-center text-[#C5832B]">
                        <Layers className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider font-montserrat text-neutral-900">
                        INTERIOR PRODUCTS
                      </h4>
                    </div>
                    <ul className="space-y-2 text-xs text-neutral-600">
                      {activeSolution.interiorComponents.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#C5832B] font-bold">·</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right Column: Automation Systems */}
                  <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-md bg-[#C5832B]/10 border border-[#C5832B]/30 flex items-center justify-center text-[#C5832B]">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider font-montserrat text-neutral-900">
                        SMART AUTOMATION
                      </h4>
                    </div>
                    <ul className="space-y-2 text-xs text-neutral-600">
                      {activeSolution.automationComponents.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#C5832B] font-bold">·</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Unified Result Callout */}
                <div className="p-5 rounded-xl bg-white border border-[#C5832B]/50 mb-8 shadow-xs">
                  <span className="text-[11px] font-bold font-montserrat uppercase text-[#C5832B] tracking-wider block mb-1">
                    THE UNIFIED OUTCOME
                  </span>
                  <p className="text-sm font-semibold text-neutral-900 leading-relaxed">
                    "{activeSolution.unifiedOutcome}"
                  </p>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
                <span className="text-xs text-neutral-500">
                  Ready to deploy this integrated standard?
                </span>
                <button
                  onClick={() => onEnquireSolution(activeSolution.title)}
                  className="px-5 py-2.5 bg-[#C5832B] hover:bg-[#A66B1E] text-white text-xs font-bold uppercase tracking-wider font-montserrat rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Consult With Our Engineers</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
