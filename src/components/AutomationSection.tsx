import React, { useState } from 'react';

import {
  Fingerprint,
  Lightbulb,
  Shield,
  Blinds,
  CheckCircle2,
  Radio,
  Cpu,
  Zap,
  Smartphone,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

import {
  AUTOMATION_CATEGORIES,
  HOW_IT_WORKS_STEPS,
} from '../data/automationProducts';

interface AutomationSectionProps {
  onRequestAutomationQuote: (solutionName: string) => void;
}

export const AutomationSection: React.FC<AutomationSectionProps> = ({
  onRequestAutomationQuote,
}) => {
  const [activeCategoryTab, setActiveCategoryTab] =
    useState<string>('smart-doors');

  // ============================================================
  // INTERACTIVE AUTOMATION SIMULATION
  // ============================================================

  const simulationScenarios = [
    {
      id: 'door',
      title: 'Biometric Executive Entry',
      icon: Fingerprint,
      sense:
        'Fingerprint scanner optical sensor detects thumb impression at entry door.',
      think:
        'Security module matches hash against authorized personnel database in 0.3s.',
      act:
        'Heavy-duty magnetic lock releases with a soft chime; welcome LED turns green.',
      control:
        'Facility app logs timestamped entry: "Authorized — Suite 402 unlocked".',
    },

    {
      id: 'lighting',
      title: 'Presence-Aware Lighting',
      icon: Lightbulb,
      sense:
        'Ceiling radar sensor detects an employee entering a dark conference room.',
      think:
        'Controller checks ambient light levels; determines natural daylight is insufficient.',
      act:
        'Recessed architectural lights softly ramp to 70% warm illumination over 1.2s.',
      control:
        'Occupants can adjust brightness or select "Presentation Mode" via the wall keypad.',
    },

    {
      id: 'curtains',
      title: 'Solar Heat & Automated Curtains',
      icon: Blinds,
      sense:
        'Exterior lux and temperature sensors detect intense afternoon solar radiation.',
      think:
        'Climate controller calculates that closing south-facing drapes will reduce HVAC load.',
      act:
        'Motorized silent drape track glides shut, blocking glare and excessive solar heat.',
      control:
        'User receives notification on smartphone with manual override option.',
    },
  ];

  const [selectedScenarioIdx, setSelectedScenarioIdx] =
    useState<number>(0);

  const [simStep, setSimStep] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const runSimulation = (scenarioIdx: number) => {
    setSelectedScenarioIdx(scenarioIdx);
    setIsSimulating(true);
    setSimStep(1);

    const timer1 = setTimeout(() => setSimStep(2), 700);
    const timer2 = setTimeout(() => setSimStep(3), 1400);

    const timer3 = setTimeout(() => {
      setSimStep(4);
      setIsSimulating(false);
    }, 2100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  const currentCategory =
    AUTOMATION_CATEGORIES.find(
      (category) => category.id === activeCategoryTab
    ) || AUTOMATION_CATEGORIES[0];

  return (
    <section
      id="automation"
      className="py-24 bg-[#FAFAFA] border-t border-neutral-200 relative overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[#C5832B]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ================================================== */}
        {/* SECTION HEADER */}
        {/* ================================================== */}

        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-bold tracking-[0.25em] font-montserrat text-[#C5832B] uppercase mb-3 block">
            DIVISION 02 · INTELLIGENT TECHNOLOGY
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-montserrat tracking-tight text-neutral-900 mb-4 uppercase">
            SMART AUTOMATION
          </h2>

          <p className="text-xl sm:text-2xl font-bold font-montserrat text-[#C5832B] mb-4">
            SMART SPACES. BETTER LIVING.
          </p>

          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed text-balance font-sans">
            Bring intelligent technology into your home, office, and commercial
            space — explained in simple, practical language with zero confusing
            jargon.
          </p>
        </div>

        {/* ================================================== */}
        {/* AUTOMATION CATEGORY TABS */}
        {/* ================================================== */}

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-14">
          {AUTOMATION_CATEGORIES.map((category) => {
            const isActive = activeCategoryTab === category.id;

            return (
              <button
                key={category.id}
                onClick={() => setActiveCategoryTab(category.id)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold font-montserrat transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#C5832B] text-white font-bold shadow-sm'
                    : 'bg-white text-neutral-700 hover:text-neutral-900 border border-neutral-200 shadow-2xs'
                }`}
              >
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>

        {/* ================================================== */}
        {/* ACTIVE CATEGORY DEEP DIVE */}
        {/* ================================================== */}

        <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-10 mb-16 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

            {/* LEFT SIDE */}
            <div className="lg:col-span-6 flex flex-col justify-between">

              {/* Hero */}
              <div className="relative w-full rounded-2xl overflow-hidden mb-6 border border-neutral-200 bg-white">

                <img
                  src={currentCategory.heroImage}
                  alt={currentCategory.name}
                  className="block w-full h-auto"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-[11px] font-mono uppercase text-[#DE9B42] block mb-1 font-bold">
                    AUTOMATION SHOWCASE
                  </span>

                  <p className="text-sm sm:text-base font-bold text-white font-montserrat">
                    {currentCategory.headline}
                  </p>
                </div>
              </div>

              {/* Real World Examples */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentCategory.realWorldExamples.map((example, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl bg-[#F8F9FA] border border-neutral-200"
                  >
                    <h5 className="text-xs font-bold text-neutral-900 font-montserrat flex items-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C5832B]" />
                      {example.title}
                    </h5>

                    <p className="text-[11px] text-neutral-600 leading-snug">
                      {example.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="lg:col-span-6">

              <span className="text-xs font-bold tracking-widest text-[#C5832B] uppercase font-montserrat block mb-2">
                HOW THIS HELPS YOU
              </span>

              <h3 className="text-2xl sm:text-3xl font-extrabold font-montserrat text-neutral-900 mb-4">
                {currentCategory.headline}
              </h3>

              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed mb-6 font-sans">
                {currentCategory.description}
              </p>

              {/* Key Features */}
              <div className="space-y-2.5 mb-8">
                {currentCategory.keyFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 text-xs sm:text-sm text-neutral-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#C5832B] shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

                <div className="text-xs text-neutral-500">
                  <span>
                    Custom engineering available for any building scale
                  </span>
                </div>

                <button
                  onClick={() =>
                    onRequestAutomationQuote(currentCategory.name)
                  }
                  className="px-5 py-2.5 bg-[#C5832B] hover:bg-[#A66B1E] text-white text-xs font-bold uppercase tracking-wider font-montserrat rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>
                    Inquire About {currentCategory.name}
                  </span>

                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* AUTOMATION PRODUCT CATALOGUE */}
        {/* ================================================== */}

        <div className="mb-20">

          <div className="max-w-3xl mx-auto text-center mb-10">

            <span className="text-xs font-bold tracking-[0.25em] font-montserrat text-[#C5832B] uppercase mb-2 block">
              PRODUCTS &amp; SOLUTIONS
            </span>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-montserrat text-neutral-900 uppercase mb-3">
              {currentCategory.name}
            </h3>

            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed font-sans">
              Explore the products and systems available within this automation
              category.
            </p>

          </div>

          {/* Product Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {currentCategory.products.map((product) => (

              <article
                key={product.name}
                className="group bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-[#C5832B]/50 transition-all duration-300"
              >

                {/* Product Image */}
                <div className="relative w-full aspect-[4/3] bg-[#F8F9FA] border-b border-neutral-200 overflow-hidden flex items-center justify-center p-3 sm:p-4">

                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="eager"
                    referrerPolicy="no-referrer"
                  />

                </div>

                {/* Product Details */}
                <div className="p-5">

                  <h4 className="text-base sm:text-lg font-bold font-montserrat text-neutral-900 mb-2">
                    {product.name}
                  </h4>

                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mb-5">
                    {product.description}
                  </p>

                  <button
                    onClick={() =>
                      onRequestAutomationQuote(product.name)
                    }
                    className="w-full px-4 py-2.5 bg-neutral-900 hover:bg-[#C5832B] text-white text-xs font-bold uppercase tracking-wider font-montserrat rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>
                      Enquire About {product.name}
                    </span>

                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                </div>
              </article>

            ))}

          </div>
        </div>

        {/* ================================================== */}
        {/* AUTOMATION HOW IT WORKS */}
        {/* ================================================== */}

        <div className="pt-6">

          <div className="max-w-3xl mx-auto text-center mb-12">

            <span className="text-xs font-bold tracking-[0.25em] font-montserrat text-[#C5832B] uppercase mb-2 block">
              AUTOMATION ARCHITECTURE
            </span>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-montserrat text-neutral-900 mb-3 uppercase">
              HOW IT WORKS: 4 SIMPLE STEPS
            </h3>

            <p className="text-xs sm:text-sm text-neutral-600 font-sans">
              No technical expertise needed. Select a scenario below to see
              intelligent automation in real-time action.
            </p>

          </div>

          {/* Scenario Selector */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">

            {simulationScenarios.map((scenario, index) => {
              const IconComp = scenario.icon;
              const isSelected = selectedScenarioIdx === index;

              return (
                <button
                  key={scenario.id}
                  onClick={() => runSimulation(index)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium font-montserrat transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 text-white font-bold shadow-xs'
                      : 'bg-white text-neutral-700 hover:text-neutral-900 border border-neutral-200'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5 text-[#C5832B]" />
                  <span>{scenario.title}</span>
                </button>
              );
            })}

            <button
              onClick={() => runSimulation(selectedScenarioIdx)}
              disabled={isSimulating}
              className="px-3.5 py-2 bg-[#C5832B] hover:bg-[#A66B1E] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Re-run Simulation"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 ${
                  isSimulating ? 'animate-spin' : ''
                }`}
              />

              <span>Simulate</span>
            </button>

          </div>

          {/* ================================================== */}
          {/* STEP CARDS */}
          {/* ================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative mb-12">

            {/* STEP 01 */}
            <div
              className={`p-6 rounded-2xl border transition-all duration-500 relative flex flex-col justify-between ${
                simStep >= 1
                  ? 'bg-white border-[#C5832B] shadow-md shadow-[#C5832B]/10'
                  : 'bg-[#F8F9FA] border-neutral-200 opacity-60'
              }`}
            >

              <div>

                <div className="flex items-center justify-between mb-4">

                  <span className="text-xs font-mono font-bold text-[#C5832B]">
                    STEP 01
                  </span>

                  <Radio
                    className={`w-5 h-5 ${
                      simStep === 1
                        ? 'text-[#C5832B] animate-pulse'
                        : 'text-neutral-400'
                    }`}
                  />

                </div>

                <h4 className="text-xl font-extrabold font-montserrat text-neutral-900 mb-1">
                  SENSE
                </h4>

                <p className="text-xs font-bold text-[#C5832B] mb-3">
                  Detecting the environment
                </p>

                <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                  Sensors detect movement, people, temperature, daylight levels,
                  or security badges.
                </p>

              </div>

              <div className="p-2.5 rounded-lg bg-[#F8F9FA] border border-neutral-200 text-[11px] text-neutral-700">

                <span className="text-[#C5832B] font-bold block mb-0.5">
                  Live Trigger:
                </span>

                {simulationScenarios[selectedScenarioIdx].sense}

              </div>

            </div>

            {/* STEP 02 */}
            <div
              className={`p-6 rounded-2xl border transition-all duration-500 relative flex flex-col justify-between ${
                simStep >= 2
                  ? 'bg-white border-[#C5832B] shadow-md shadow-[#C5832B]/10'
                  : 'bg-[#F8F9FA] border-neutral-200 opacity-60'
              }`}
            >

              <div>

                <div className="flex items-center justify-between mb-4">

                  <span className="text-xs font-mono font-bold text-[#C5832B]">
                    STEP 02
                  </span>

                  <Cpu
                    className={`w-5 h-5 ${
                      simStep === 2
                        ? 'text-[#C5832B] animate-pulse'
                        : 'text-neutral-400'
                    }`}
                  />

                </div>

                <h4 className="text-xl font-extrabold font-montserrat text-neutral-900 mb-1">
                  THINK
                </h4>

                <p className="text-xs font-bold text-[#C5832B] mb-3">
                  Processing logic &amp; rules
                </p>

                <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                  The automation controller processes the input, verifies
                  permissions, and makes decisions.
                </p>

              </div>

              <div className="p-2.5 rounded-lg bg-[#F8F9FA] border border-neutral-200 text-[11px] text-neutral-700">

                <span className="text-[#C5832B] font-bold block mb-0.5">
                  System Calculation:
                </span>

                {simulationScenarios[selectedScenarioIdx].think}

              </div>

            </div>

            {/* STEP 03 */}
            <div
              className={`p-6 rounded-2xl border transition-all duration-500 relative flex flex-col justify-between ${
                simStep >= 3
                  ? 'bg-white border-[#C5832B] shadow-md shadow-[#C5832B]/10'
                  : 'bg-[#F8F9FA] border-neutral-200 opacity-60'
              }`}
            >

              <div>

                <div className="flex items-center justify-between mb-4">

                  <span className="text-xs font-mono font-bold text-[#C5832B]">
                    STEP 03
                  </span>

                  <Zap
                    className={`w-5 h-5 ${
                      simStep === 3
                        ? 'text-[#C5832B] animate-pulse'
                        : 'text-neutral-400'
                    }`}
                  />

                </div>

                <h4 className="text-xl font-extrabold font-montserrat text-neutral-900 mb-1">
                  ACT
                </h4>

                <p className="text-xs font-bold text-[#C5832B] mb-3">
                  Instant automated response
                </p>

                <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                  The system automatically triggers locks, activates lighting,
                  or adjusts temperature.
                </p>

              </div>

              <div className="p-2.5 rounded-lg bg-[#F8F9FA] border border-neutral-200 text-[11px] text-neutral-700">

                <span className="text-[#C5832B] font-bold block mb-0.5">
                  Physical Output:
                </span>

                {simulationScenarios[selectedScenarioIdx].act}

              </div>

            </div>

            {/* STEP 04 */}
            <div
              className={`p-6 rounded-2xl border transition-all duration-500 relative flex flex-col justify-between ${
                simStep >= 4
                  ? 'bg-white border-[#C5832B] shadow-md shadow-[#C5832B]/10'
                  : 'bg-[#F8F9FA] border-neutral-200 opacity-60'
              }`}
            >

              <div>

                <div className="flex items-center justify-between mb-4">

                  <span className="text-xs font-mono font-bold text-[#C5832B]">
                    STEP 04
                  </span>

                  <Smartphone
                    className={`w-5 h-5 ${
                      simStep === 4
                        ? 'text-[#C5832B] animate-pulse'
                        : 'text-neutral-400'
                    }`}
                  />

                </div>

                <h4 className="text-xl font-extrabold font-montserrat text-neutral-900 mb-1">
                  CONTROL
                </h4>

                <p className="text-xs font-bold text-[#C5832B] mb-3">
                  User oversight &amp; app
                </p>

                <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                  Users can view live status, override settings, or inspect
                  audit logs from phone or touch screen.
                </p>

              </div>

              <div className="p-2.5 rounded-lg bg-[#F8F9FA] border border-neutral-200 text-[11px] text-neutral-700">

                <span className="text-[#C5832B] font-bold block mb-0.5">
                  Manager Oversight:
                </span>

                {simulationScenarios[selectedScenarioIdx].control}

              </div>

            </div>

          </div>

        </div>

        {/* ================================================== */}
        {/* SMART SPACE SHOWCASE */}
        {/* ================================================== */}

        <div className="pt-8">

          <div className="text-center max-w-xl mx-auto mb-10">

            <h4 className="text-xl sm:text-2xl font-bold font-montserrat uppercase text-neutral-900">
              SMART SPACE SHOWCASE
            </h4>

            <p className="text-xs sm:text-sm text-neutral-600 mt-1">
              Practical automation designed for everyday peace of mind.
            </p>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* BIOMETRIC DOOR */}
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 hover:border-[#C5832B]/60 shadow-xs hover:shadow-md transition-all">

              <Fingerprint className="w-8 h-8 text-[#C5832B] mb-3" />

              <h5 className="text-base font-bold font-montserrat text-neutral-900 mb-1">
                BIOMETRIC DOOR
              </h5>

              <p className="text-xs text-neutral-600">
                "Unlock your door with your fingerprint." Never carry keys again.
              </p>

            </div>

            {/* SMART LIGHTING */}
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 hover:border-[#C5832B]/60 shadow-xs hover:shadow-md transition-all">

              <Lightbulb className="w-8 h-8 text-[#C5832B] mb-3" />

              <h5 className="text-base font-bold font-montserrat text-neutral-900 mb-1">
                SMART LIGHTING
              </h5>

              <p className="text-xs text-neutral-600">
                "Lights that respond when you enter." Soft, automatic, and
                energy-saving.
              </p>

            </div>

            {/* AUTOMATED CURTAINS */}
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 hover:border-[#C5832B]/60 shadow-xs hover:shadow-md transition-all">

              <Blinds className="w-8 h-8 text-[#C5832B] mb-3" />

              <h5 className="text-base font-bold font-montserrat text-neutral-900 mb-1">
                AUTOMATED CURTAINS
              </h5>

              <p className="text-xs text-neutral-600">
                "Open and close curtains automatically." Welcomes morning light
                and secures evening privacy.
              </p>

            </div>

            {/* SMART SECURITY */}
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 hover:border-[#C5832B]/60 shadow-xs hover:shadow-md transition-all">

              <Shield className="w-8 h-8 text-[#C5832B] mb-3" />

              <h5 className="text-base font-bold font-montserrat text-neutral-900 mb-1">
                SMART SECURITY
              </h5>

              <p className="text-xs text-neutral-600">
                "Monitor and control access to your space." High-definition
                video and immediate alerts.
              </p>

            </div>

            {/* SENSOR AUTOMATION */}
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 hover:border-[#C5832B]/60 shadow-xs hover:shadow-md transition-all">

              <Cpu className="w-8 h-8 text-[#C5832B] mb-3" />

              <h5 className="text-base font-bold font-montserrat text-neutral-900 mb-1">
                SENSOR AUTOMATION
              </h5>

              <p className="text-xs text-neutral-600">
                "Let your environment respond automatically." Continuous comfort
                with zero manual dials.
              </p>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
};