import React from 'react';
import { Check, Shield, Layers, Cpu, Wrench, Users, Sliders, PhoneCall, Sparkles } from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const points = [
    {
      title: 'Design + Products + Automation',
      description: 'Physical materials and digital controls are conceived together from day one, guaranteeing harmonious performance.',
      icon: Layers,
    },
    {
      title: 'Complete Solutions',
      description: 'From initial space planning and material specification to hardware installation and smart commissioning.',
      icon: Shield,
    },
    {
      title: 'Premium Materials',
      description: 'Direct manufacturer-grade polygranite sheets, acoustic fluted panels, and waterproof SPC stone flooring.',
      icon: Sparkles,
    },
    {
      title: 'Modern Technology',
      description: 'Reliable, tested automation systems: biometric access, radar presence sensing, and motorized climate management.',
      icon: Cpu,
    },
    {
      title: 'Professional Execution',
      description: 'Trained technical personnel who respect your site, follow millimeter tolerances, and finish on agreed schedules.',
      icon: Wrench,
    },
    {
      title: 'Customer-Focused Approach',
      description: 'We speak clear human language without overloading you with confusing technical acronyms or jargon.',
      icon: Users,
    },
    {
      title: 'Custom Solutions',
      description: 'Every layout is tailored to your building requirements, traffic volume, aesthetic preferences, and budget.',
      icon: Sliders,
    },
    {
      title: 'One Point of Contact',
      description: 'Single dedicated project liaison handling all queries, deliveries, installation, and after-sales support.',
      icon: PhoneCall,
    },
  ];

  return (
    <section className="py-24 bg-white border-t border-neutral-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-bold tracking-[0.25em] font-montserrat text-[#C5832B] uppercase mb-3 block">
            TRUST & VALUE COMMITMENT
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-montserrat tracking-tight text-neutral-900 mb-4 uppercase">
            WHY CHOOSE SRL INFRA?
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed font-sans">
            Straightforward advantages built on material excellence, technological reliability, and transparent communication.
          </p>
        </div>

        {/* 8 Clean Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {points.map((pt, idx) => {
            const IconComp = pt.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#FAFAFA] border border-neutral-200/90 hover:border-[#C5832B]/60 transition-all duration-300 group shadow-xs hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-[#C5832B] group-hover:border-[#C5832B] group-hover:scale-110 transition-transform mb-4 shadow-2xs">
                  <IconComp className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-[#C5832B] shrink-0" />
                  <h3 className="text-sm font-bold font-montserrat text-neutral-900 group-hover:text-[#C5832B] transition-colors">
                    {pt.title}
                  </h3>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                  {pt.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
