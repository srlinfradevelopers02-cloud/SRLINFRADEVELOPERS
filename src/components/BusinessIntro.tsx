import React from 'react';
import { PenTool, Building, Cpu, Sparkles, Check, ArrowRight } from 'lucide-react';
import { SrlLogo } from './SrlLogo';

export const BusinessIntro: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'DESIGN',
      tagline: 'Plan your space.',
      description: 'We listen to your requirements, analyze layout and foot-traffic flow, and curate harmonious interior materials, textures, and lighting schemes tailored to your building.',
      icon: PenTool,
    },
    {
      num: '02',
      title: 'BUILD',
      tagline: 'Create the physical environment.',
      description: 'We supply and execute high-precision architectural elements: polygranite marble sheets, acoustic fluted panels, heavy-duty SPC flooring, and weatherproof cladding.',
      icon: Building,
    },
    {
      num: '03',
      title: 'AUTOMATE',
      tagline: 'Add intelligent technology.',
      description: 'We install non-intrusive smart technology: biometric door access, automated presence-sensing lighting, motorized curtains, and building surveillance systems.',
      icon: Cpu,
    },
    {
      num: '04',
      title: 'ELEVATE',
      tagline: 'A smarter, more comfortable and premium space.',
      description: 'You step into a finished environment that looks majestic, operates with effortless touchless simplicity, and significantly cuts ongoing operational and energy costs.',
      icon: Sparkles,
    },
  ];

  return (
    <section id="about" className="py-24 bg-[#F8F9FA] border-y border-neutral-200 relative overflow-hidden">
      {/* Subtle ambient gold glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C5832B]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
          <span className="text-xs font-bold tracking-[0.25em] font-montserrat text-[#C5832B] uppercase mb-3 block">
            ABOUT SRL INFRA DEVELOPERS
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-montserrat tracking-tight text-neutral-900 mb-6 uppercase">
            ONE COMPANY. COMPLETE SOLUTIONS.
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-neutral-700 leading-relaxed text-balance">
            SRL INFRA DEVELOPERS brings design, interior products, infrastructure solutions, and smart automation together under one roof.
          </p>
        </div>

        {/* 2-Column Showcase: Official Brand Emblem + Philosophy */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20 bg-white p-6 sm:p-10 rounded-2xl border border-neutral-200 shadow-sm">
          {/* Left: Official SRL Logo Brand Card */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-[#FAFAFA] rounded-xl border border-neutral-200/90 shadow-xs">
            <span className="text-[10px] tracking-widest font-mono text-[#C5832B] uppercase mb-4">Official Brand Mark</span>
            <SrlLogo variant="full" theme="light" className="w-full max-w-sm" />
            <p className="text-xs text-neutral-600 mt-4 text-center max-w-xs font-medium">
              Suvarna · Rajya · Laxmi — Founded on architectural integrity, craftsmanship, and intelligent technology.
            </p>
          </div>

          {/* Right: Plain Language Explanation */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <h3 className="text-2xl font-bold font-montserrat text-neutral-900 mb-4">
              We bridge the gap between architectural elegance and modern technology.
            </h3>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed mb-6">
              Traditionally, clients have to hire separate contractors for interior decor, flooring, masonry, and electrical automation. That results in mismatched aesthetics, delayed timelines, and finger-pointing when something doesn’t work.
            </p>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed mb-8">
              At <strong className="text-neutral-900 font-semibold">SRL INFRA DEVELOPERS</strong>, we solve this completely. Whether you are building an executive residence, a luxury restaurant, a convention banquet hall, or a multi-floor government complex, our integrated approach ensures materials and technology function as one seamless system.
            </p>

            {/* Checklist of Direct Client Advantages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-800">
                <Check className="w-4 h-4 text-[#C5832B] shrink-0 mt-0.5" />
                <span>Single point of responsibility</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-800">
                <Check className="w-4 h-4 text-[#C5832B] shrink-0 mt-0.5" />
                <span>Direct manufacturer-grade materials</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-800">
                <Check className="w-4 h-4 text-[#C5832B] shrink-0 mt-0.5" />
                <span>Zero technical jargon for clients</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-800">
                <Check className="w-4 h-4 text-[#C5832B] shrink-0 mt-0.5" />
                <span>Rapid installation & minimal maintenance</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Steps Timeline */}
        <div className="pt-4">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h3 className="text-xl sm:text-2xl font-bold font-montserrat uppercase text-neutral-900">
              The 4-Phase Delivery Framework
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 mt-2">
              From the initial blueprint to intelligent handover.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {steps.map((step, idx) => {
              const IconComp = step.icon;
              return (
                <div
                  key={step.num}
                  className="bg-white p-6 sm:p-7 rounded-xl border border-neutral-200 hover:border-[#C5832B]/60 shadow-xs hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-2xl font-extrabold text-[#C5832B] tracking-tight">
                        {step.num}
                      </span>
                      <div className="w-10 h-10 rounded-lg bg-[#FAFAFA] border border-neutral-200 flex items-center justify-center text-[#C5832B] group-hover:scale-110 group-hover:border-[#C5832B] transition-transform">
                        <IconComp className="w-5 h-5" />
                      </div>
                    </div>

                    <h4 className="text-lg font-bold font-montserrat text-neutral-900 group-hover:text-[#C5832B] transition-colors mb-1">
                      {step.title}
                    </h4>
                    <p className="text-xs font-bold text-[#C5832B] mb-3">
                      {step.tagline}
                    </p>
                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center text-[11px] font-semibold text-neutral-500 group-hover:text-neutral-900 transition-colors">
                    <span>Explore Phase {step.num}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 text-[#C5832B] transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
