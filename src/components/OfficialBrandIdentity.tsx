import React, { useState } from 'react';
import { Crown, Landmark, TrendingUp, Building, PenTool, Cpu, ArrowUpRight, Boxes, Wrench, ChevronsRight, Eye } from 'lucide-react';
import { SrlLogo } from './SrlLogo';

export const OfficialBrandIdentity: React.FC = () => {
  const [logoMode, setLogoMode] = useState<'3d' | 'vector'>('3d');
  const threeFoundationalPillars = [
    {
      name: 'SUVARNA',
      sanskrit: 'Golden Value & Purity',
      icon: Crown,
      description: 'Precious structural value & architectural quality. Ensuring every material, panel, and fixture embodies enduring craftsmanship that holds its elegance for generations.',
      facet: 'Left Stepped Pillar',
    },
    {
      name: 'RAJYA',
      sanskrit: 'Command & Authority',
      icon: Landmark,
      description: 'Commanding institutional authority & governance. Engineering infrastructure and spaces worthy of public trust, state dignity, and enterprise prestige.',
      facet: 'Center-Right Tower',
    },
    {
      name: 'LAXMI',
      sanskrit: 'Prosperity & Elevation',
      icon: TrendingUp,
      description: 'Sustainable commercial growth & elevated client returns. Designing functional, automated environments that optimize operational costs and enrich human life.',
      facet: 'Right Stepped Spire',
    },
  ];

  const fourOperationalTenets = [
    {
      tenet: 'WE BUILD',
      detail: 'With certified structural strength',
      description: 'Zero-compromise engineering, robust core materials, and industrial-grade construction resilience.',
      icon: Building,
    },
    {
      tenet: 'WE DESIGN',
      detail: 'With human-centric elegance',
      description: 'Harmonious spatial planning, soothing natural textures, and modern architectural aesthetics.',
      icon: PenTool,
    },
    {
      tenet: 'WE AUTOMATE',
      detail: 'With intelligent IoT systems',
      description: 'Touchless biometric access, smart presence sensors, and automated climate intelligence.',
      icon: Cpu,
    },
    {
      tenet: 'WE ELEVATE',
      detail: 'Every space for peak performance',
      description: 'Transforming routine everyday environments into prestigious, high-efficiency living and working havens.',
      icon: ArrowUpRight,
    },
  ];

  return (
    <section id="brand-identity" className="py-24 bg-white border-b border-neutral-200 relative overflow-hidden">
      {/* Background architectural fine grid and warm light gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(#C5832B_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.06] pointer-events-none" />
      <div className="absolute -top-24 right-0 w-96 h-96 bg-[#C5832B]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <span className="text-xs font-bold tracking-[0.28em] font-montserrat text-[#C5832B] uppercase mb-3 block">
            OFFICIAL BRAND IDENTITY
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-montserrat tracking-tight text-neutral-900 mb-3 uppercase">
            SUVARNA · RAJYA · LAXMI
          </h2>
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="h-px w-12 bg-[#C5832B]/50" />
            <span className="text-sm md:text-base font-bold font-montserrat tracking-widest text-[#C5832B] uppercase">
              SRL INFRA DEVELOPERS
            </span>
            <span className="h-px w-12 bg-[#C5832B]/50" />
          </div>

          <p className="text-base sm:text-lg md:text-xl text-neutral-700 leading-relaxed font-sans max-w-3xl mx-auto text-balance">
            Our company identity embodies three foundational pillars of enduring commercial prosperity: <strong>Suvarna</strong> (precious structural value & architectural quality), <strong>Rajya</strong> (commanding institutional authority & governance), and <strong>Laxmi</strong> (sustainable commercial growth & elevated client returns).
          </p>
        </div>

        {/* Official Brandmark Centerpiece Presentation */}
        <div className="flex justify-center mb-16">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/90 shadow-xl shadow-neutral-900/5 max-w-lg w-full text-center relative group">
            <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#C47D2B] uppercase bg-[#FAF8F5] py-1 px-3.5 rounded-full border border-[#C47D2B]/20">
                OFFICIAL CERTIFIED IDENTITY
              </span>
            </div>

            <div className="p-2 bg-white rounded-2xl flex items-center justify-center min-h-[380px]">
              <img
                src="/logo.png"
                alt="SRL Infra Developers Official Logo - Suvarna Rajya Laxmi"
                className="w-full h-auto max-h-[500px] object-contain mx-auto"
              />
            </div>

            <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-sans">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C47D2B]" />
                <span className="font-semibold text-neutral-800">Suvarna · Rajya · Laxmi</span>
              </span>
              <span className="font-mono text-[11px] text-[#C47D2B] font-bold">
                WE BUILD · WE DESIGN · WE AUTOMATE · WE ELEVATE
              </span>
            </div>
          </div>
        </div>

        {/* The 3 Pillars Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {threeFoundationalPillars.map((p) => {
            const IconComp = p.icon;
            return (
              <div
                key={p.name}
                className="bg-[#FAFAFA] rounded-2xl border border-neutral-200/90 p-8 shadow-sm hover:shadow-xl hover:border-[#C5832B]/60 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-400 uppercase bg-white px-2.5 py-1 rounded border border-neutral-200">
                      {p.facet}
                    </span>
                    <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-[#C5832B] group-hover:scale-110 group-hover:border-[#C5832B] transition-transform shadow-xs">
                      <IconComp className="w-6 h-6" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-black font-montserrat text-neutral-900 mb-1 group-hover:text-[#C5832B] transition-colors">
                    {p.name}
                  </h3>
                  <span className="text-xs font-semibold text-[#C5832B] block mb-4">
                    {p.sanskrit}
                  </span>

                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-200/80 flex items-center text-xs font-semibold text-neutral-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5832B] mr-2" />
                  Inscribed inside the official architectural emblem
                </div>
              </div>
            );
          })}
        </div>

        {/* 4 Core Operational Tenets Banner */}
        <div className="bg-[#F8F9FA] rounded-3xl border border-neutral-200/90 p-8 sm:p-12 shadow-sm">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold tracking-widest font-montserrat text-[#C5832B] uppercase block mb-1">
              OPERATIONAL EXCELLENCE
            </span>
            <h3 className="text-xl sm:text-2xl font-bold font-montserrat text-neutral-900">
              Together with our four core operational tenets:
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {fourOperationalTenets.map((tenet) => {
              const IconComp = tenet.icon;
              return (
                <div
                  key={tenet.tenet}
                  className="bg-white p-6 rounded-xl border border-neutral-200 hover:border-[#C5832B]/50 transition-all duration-200 shadow-xs"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#FAFAFA] border border-neutral-200 flex items-center justify-center text-[#C5832B] mb-4">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-extrabold font-montserrat text-neutral-900 mb-0.5">
                    {tenet.tenet}
                  </h4>
                  <p className="text-xs font-bold text-[#C5832B] mb-2">
                    {tenet.detail}
                  </p>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {tenet.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* New 5th Tier: SUPPLY >> EXECUTION Workflow */}
          <div className="mt-8 pt-8 border-t border-neutral-200/90 flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
            {/* SUPPLY Pillar */}
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#C47D2B]/30 flex items-center justify-center text-[#C47D2B] shrink-0">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-mono font-bold tracking-widest text-[#C47D2B] uppercase block">
                  STAGE 01 / MATERIAL LOGISTICS
                </span>
                <h4 className="text-lg font-black font-montserrat text-neutral-900">
                  SUPPLY
                </h4>
                <p className="text-xs text-neutral-600 leading-snug">
                  Direct manufacturer supply of polygranite marble sheets, SPC flooring, fluted panels, and IoT hardware.
                </p>
              </div>
            </div>

            {/* Smart Transition Indicator */}
            <div className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#FAF8F5] border border-[#C47D2B]/30 text-[#C47D2B] shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#C47D2B] animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-wider">INTEGRATED PIPELINE</span>
              <ChevronsRight className="w-4 h-4 ml-1 text-[#C47D2B]" />
            </div>

            {/* EXECUTION Pillar */}
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#C47D2B]/30 flex items-center justify-center text-[#C47D2B] shrink-0">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-mono font-bold tracking-widest text-[#C47D2B] uppercase block">
                  STAGE 02 / TURNKEY DEPLOYMENT
                </span>
                <h4 className="text-lg font-black font-montserrat text-neutral-900">
                  EXECUTION
                </h4>
                <p className="text-xs text-neutral-600 leading-snug">
                  Millimeter-precision site fitting, smart electrical commissioning, access control integration, and testing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
