import React, { useEffect, useMemo, useState } from 'react';

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
  Plus,
  Minus,
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import { useSharedCart } from './SharedCart';

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
  const [activeProductCategory, setActiveProductCategory] =
    useState<string>('all');

  type DbProduct = {
    id: string;
    name: string;
    category: string;
    description: string;
    image_urls: string[];
    price: number;
    unit: string;
    stock_quantity: number;
    website_cart_limit: number;
  };

  const [dbProducts, setDbProducts] = useState<DbProduct[]>([]);
  const sharedCart = useSharedCart();

  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select(
          'id,name,category,description,image_urls,price,unit,stock_quantity,website_cart_limit'
        )
        .eq('is_published', true)
        .in('category', [
          'Smart Doors & Access',
          'Smart Lighting & Controls',
          'Smart Security & Surveillance',
          'Smart Environment & Comfort',
          'Smart Entertainment',
        ]);

      if (!active) return;

      if (error) {
        console.error(
          'Automation product pricing could not load:',
          error
        );
      }

      setDbProducts(
        (data ?? []).map((p: any) => ({
          id: String(p.id),
          name: String(p.name ?? ''),
          category: String(p.category ?? ''),
          description: String(p.description ?? ''),
          image_urls: Array.isArray(p.image_urls)
            ? p.image_urls.filter((url: unknown) => typeof url === 'string' && url.trim())
            : typeof p.image_urls === 'string' && p.image_urls.trim()
              ? [p.image_urls]
              : [],
          price: Math.max(0, Number(p.price) || 0),
          unit: String(p.unit || 'piece'),
          stock_quantity: Math.max(
            0,
            Number(p.stock_quantity) || 0
          ),
          website_cart_limit: Math.max(
            0,
            Number(p.website_cart_limit) || 0
          ),
        }))
      );

      setProductsLoading(false);
    };

    void loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const normaliseProductName = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]/g, '');

  const getDbProduct = (name: string) => {
    const wanted = normaliseProductName(name);

    return (
      dbProducts.find(
        (p) => normaliseProductName(p.name) === wanted
      ) ??
      dbProducts.find(
        (p) =>
          normaliseProductName(p.name).includes(wanted) ||
          wanted.includes(normaliseProductName(p.name))
      )
    );
  };

  const money = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value);

  const addToCart = (product: DbProduct) => {
    sharedCart.addItem({
      id: product.id,
      name: product.name,
      category: product.category || 'Automation',
      price: product.price,
      unit: product.unit,
      stock_quantity: product.stock_quantity,
      website_cart_limit: product.website_cart_limit,
    });
  };

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
  const [isSimulating, setIsSimulating] =
    useState<boolean>(false);

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

  // Product categories come from Supabase, so newly added Admin categories
  // automatically appear here without editing automationProducts.ts.
  const productCategories = useMemo(
    () => Array.from(new Set(dbProducts.map((p) => p.category.trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b)),
    [dbProducts]
  );

  const visibleProducts = useMemo(
    () => dbProducts.filter((product) =>
      activeProductCategory === 'all' || product.category === activeProductCategory
    ),
    [dbProducts, activeProductCategory]
  );

  const getProductImage = (product: DbProduct) => {
    if (product.image_urls.length > 0) return product.image_urls[0];
    const legacy = AUTOMATION_CATEGORIES.flatMap((category) => category.products)
      .find((item) => normaliseProductName(item.name) === normaliseProductName(product.name));
    return legacy?.image || '';
  };

  return (
    <section
      id="automation"
      className="py-24 bg-[#FAFAFA] border-t border-neutral-200 relative overflow-hidden"
    >
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[#C5832B]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* SECTION HEADER */}
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

        {/* AUTOMATION PRODUCT CATEGORY TABS — powered by Supabase */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-14">
          <button
            key="all"
            type="button"
            onClick={() => setActiveProductCategory('all')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold font-montserrat transition-all cursor-pointer ${
              activeProductCategory === 'all'
                ? 'bg-[#C5832B] text-white font-bold shadow-sm'
                : 'bg-white text-neutral-700 hover:text-neutral-900 border border-neutral-200 shadow-2xs'
            }`}
          >All Products ({dbProducts.length})</button>
          {productCategories.map((category) => {
            const count = dbProducts.filter((product) => product.category === category).length;
            const isActive = activeProductCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveProductCategory(category)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold font-montserrat transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#C5832B] text-white font-bold shadow-sm'
                    : 'bg-white text-neutral-700 hover:text-neutral-900 border border-neutral-200 shadow-2xs'
                }`}
              >
                <span>{category} ({count})</span>
              </button>
            );
          })}
        </div>

        {/* ACTIVE CATEGORY DEEP DIVE */}
        <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-10 mb-16 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 flex flex-col justify-between">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentCategory.realWorldExamples.map(
                  (example, index) => (
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
                  )
                )}
              </div>
            </div>

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

              <div className="space-y-2.5 mb-8">
                {currentCategory.keyFeatures.map(
                  (feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 text-xs sm:text-sm text-neutral-700"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#C5832B] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  )
                )}
              </div>

              <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-xs text-neutral-500">
                  <span>
                    Custom engineering available for any building scale
                  </span>
                </div>

                <button
                  type="button"
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

        {/* AUTOMATION PRODUCT CATALOGUE */}
        <div className="mb-20">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <span className="text-xs font-bold tracking-[0.25em] font-montserrat text-[#C5832B] uppercase mb-2 block">
              PRODUCTS &amp; SOLUTIONS
            </span>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-montserrat text-neutral-900 uppercase mb-3">
              {activeProductCategory === 'all' ? 'All Smart Automation Products' : activeProductCategory}
            </h3>

            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed font-sans">
              Live product catalogue synced from SRL Infra Developers inventory. Select a category to filter products.
            </p>
          </div>

          {/* Product Cards — live records from public.products */}
          {productsLoading ? (
            <div className="py-16 text-center text-neutral-500">Loading automation products…</div>
          ) : visibleProducts.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-neutral-300 bg-white">
              <p className="font-semibold text-neutral-800">No products found in this category.</p>
              <p className="text-sm text-neutral-500 mt-2">Publish products in Supabase or choose another category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleProducts.map((product) => {
                const limit = Math.min(product.stock_quantity, product.website_cart_limit);
                const quantity = sharedCart.items.find((item) => item.id === product.id)?.quantity ?? 0;
                const image = getProductImage(product);
                return (
                  <article key={product.id} className="group bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-[#C5832B]/50 transition-all duration-300">
                    <div className="relative w-full aspect-[4/3] bg-[#F8F9FA] border-b border-neutral-200 overflow-hidden flex items-center justify-center p-3 sm:p-4">
                      {image ? (
                        <img src={image} alt={product.name} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.03]" loading="eager" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                      ) : (
                        <div className="text-center px-5"><Smartphone className="w-10 h-10 mx-auto text-neutral-300 mb-2" /><span className="text-xs text-neutral-400">Product image coming soon</span></div>
                      )}
                      <span className="absolute top-3 left-3 rounded-full bg-white/95 border border-neutral-200 px-3 py-1 text-[10px] font-bold text-neutral-700 shadow-sm">{product.category || 'Automation'}</span>
                    </div>
                    <div className="p-5">
                      <h4 className="text-base sm:text-lg font-bold font-montserrat text-neutral-900 mb-2">{product.name}</h4>
                      <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mb-5">{product.description || 'Contact SRL Infra Developers for product specifications and installation details.'}</p>
                      <div className="mb-4 rounded-xl bg-[#FAFAFA] border border-neutral-200 p-3">
                        <div className="text-sm font-bold text-neutral-900">{product.price > 0 ? money(product.price) : 'Price on request'}</div>
                        <div className="text-[11px] text-neutral-500 mt-1">Unit: {product.unit} · Stock: {product.stock_quantity}</div>
                        {product.price > 0 && <div className="text-[10px] text-neutral-500 mt-1">Displayed price is managed by SRL Infra Admin.</div>}
                      </div>
                      {limit > 0 ? (
                        <div className="flex items-center gap-2 mb-3">
                          <button type="button" aria-label={`Decrease ${product.name} quantity`} onClick={() => sharedCart.setQuantity(product.id, quantity - 1)} className="h-10 w-10 rounded-lg border border-neutral-300 flex items-center justify-center hover:border-[#C5832B]"><Minus className="w-4 h-4" /></button>
                          <span className="min-w-8 text-center font-bold">{quantity}</span>
                          <button type="button" aria-label={`Increase ${product.name} quantity`} onClick={() => addToCart(product)} disabled={quantity >= limit} className="h-10 w-10 rounded-lg border border-neutral-300 flex items-center justify-center hover:border-[#C5832B] disabled:opacity-40"><Plus className="w-4 h-4" /></button>
                          <button type="button" onClick={() => addToCart(product)} disabled={quantity >= limit} className="flex-1 px-3 py-2.5 bg-[#C5832B] hover:bg-[#A66B1E] text-white text-xs font-bold uppercase tracking-wide rounded-lg disabled:opacity-40">Add to Cart</button>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-700 mb-3">Cart unavailable until Admin sets stock and website cart limit.</p>
                      )}
                      <button type="button" onClick={() => onRequestAutomationQuote(product.name)} className="w-full px-4 py-2.5 bg-neutral-900 hover:bg-[#C5832B] text-white text-xs font-bold uppercase tracking-wider font-montserrat rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"><span>Enquire About {product.name}</span><ArrowRight className="w-3.5 h-3.5" /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
                {/* Cart and checkout are shared globally with Interior Products and Elevators. */}
        <div className="mb-20 flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-montserrat text-lg font-bold text-neutral-900">Common Website Cart</h3>
            <p className="mt-1 text-sm text-neutral-500">Automation products share one cart with Interior Products and Elevators.</p>
          </div>
          <button
            type="button"
            onClick={sharedCart.openCart}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#C5832B] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#A66B1E]"
          >
            View Common Cart ({sharedCart.count}) · {money(sharedCart.subtotal)}
          </button>
        </div>

        {/* ================================================== */}
        {/* HOW IT WORKS */}
        {/* ================================================== */}

        <div className="mb-20">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-xs font-bold tracking-[0.25em] font-montserrat text-[#C5832B] uppercase mb-3 block">
              SIMPLE PROCESS
            </span>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-montserrat text-neutral-900 uppercase mb-4">
              HOW IT WORKS
            </h3>

            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
              From understanding your needs to installing your smart systems,
              every step is designed to be straightforward.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
             {[
                {
                  title: 'Consultation',
                  description:
                    'We understand your space, requirements, budget and automation goals.',
                },
                {
                  title: 'System Design',
                  description:
                    'Our team plans suitable devices, controls and automation features.',
                },
                {
                  title: 'Installation',
                  description:
                    'Our team installs and configures the selected automation systems.',
                },
                {
                  title: 'Testing & Support',
                  description:
                    'We test the system and explain how to use and control it.',
                },
              ].map((step, index) => (
                 <div
                    key={index}
                    className="relative rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#C5832B]/10 text-[#C5832B] flex items-center justify-center font-extrabold text-lg mb-5">
                      {index + 1}
                    </div>

                    <h4 className="text-base font-bold font-montserrat text-neutral-900 mb-3">
                      {step.title}
                    </h4>

                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>   
          </div>
        </div>

        {/* ================================================== */}
        {/* INTERACTIVE SMART SPACE SHOWCASE */}
        {/* ================================================== */}

        <div className="rounded-3xl bg-neutral-950 text-white p-6 sm:p-10 lg:p-14 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#C5832B]/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10">
            <div className="max-w-3xl mb-10">
              <span className="text-xs font-bold tracking-[0.25em] font-montserrat text-[#DE9B42] uppercase mb-3 block">
                EXPERIENCE THE LOGIC
              </span>

              <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-montserrat uppercase mb-4">
                INSIDE A SMART SPACE
              </h3>

              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                See how sensors, controllers and connected devices work together
                to make a building more comfortable, secure and efficient.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* SCENARIO SELECTOR */}
              <div className="lg:col-span-4 space-y-3">
                {simulationScenarios.map((scenario, index) => {
                  const ScenarioIcon = scenario.icon;
                  const selected = selectedScenarioIdx === index;

                  return (
                    <button
                      key={scenario.id}
                      type="button"
                      onClick={() => {
                        setSelectedScenarioIdx(index);
                        setSimStep(0);
                        setIsSimulating(false);
                      }}
                      className={`w-full text-left rounded-xl p-4 border transition-all ${
                        selected
                          ? 'bg-[#C5832B]/15 border-[#C5832B] text-white'
                          : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            selected
                              ? 'bg-[#C5832B] text-white'
                              : 'bg-white/10 text-neutral-300'
                          }`}
                        >
                          <ScenarioIcon className="w-5 h-5" />
                        </div>

                        <div>
                          <p className="text-sm font-bold font-montserrat">
                            {scenario.title}
                          </p>

                          <p className="text-xs text-neutral-400 mt-1">
                            Scenario {index + 1}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setSimStep(0);
                    setIsSimulating(true);

                    const selectedScenario = selectedScenarioIdx;

                    window.setTimeout(() => {
                      setSelectedScenarioIdx(selectedScenario);
                      setSimStep(1);
                    }, 300);

                    window.setTimeout(() => setSimStep(2), 900);
                    window.setTimeout(() => setSimStep(3), 1500);
                    window.setTimeout(() => {
                      setSimStep(4);
                      setIsSimulating(false);
                    }, 2100);
                  }}
                  className="w-full mt-3 px-5 py-3 rounded-lg bg-[#C5832B] hover:bg-[#A66B1E] text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  {isSimulating ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      Simulating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Run Simulation
                    </>
                  )}
                </button>
              </div>

              {/* SIMULATION DETAILS */}
              <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div>
                    <p className="text-xs text-[#DE9B42] font-bold tracking-widest uppercase mb-2">
                      SYSTEM WORKFLOW
                    </p>

                    <h4 className="text-lg sm:text-xl font-bold font-montserrat">
                      {simulationScenarios[selectedScenarioIdx].title}
                    </h4>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        simStep === 4
                          ? 'bg-green-400'
                          : isSimulating
                            ? 'bg-[#DE9B42] animate-pulse'
                            : 'bg-neutral-500'
                      }`}
                    />
                    {simStep === 4
                      ? 'Complete'
                      : isSimulating
                        ? 'Running'
                        : 'Ready'}
                  </div>
                </div>

                {[
                  {
                    number: 1,
                    title: 'SENSE',
                    icon: Radio,
                    description:
                      simulationScenarios[selectedScenarioIdx].sense,
                  },
                  {
                    number: 2,
                    title: 'THINK',
                    icon: Cpu,
                    description:
                      simulationScenarios[selectedScenarioIdx].think,
                  },
                  {
                    number: 3,
                    title: 'ACT',
                    icon: Zap,
                    description:
                      simulationScenarios[selectedScenarioIdx].act,
                  },
                  {
                    number: 4,
                    title: 'CONTROL',
                    icon: Smartphone,
                    description:
                      simulationScenarios[selectedScenarioIdx].control,
                  },
                ].map((step) => {
                  const StepIcon = step.icon;
                  const completed = simStep >= step.number;
                  const active = simStep === step.number && isSimulating;

                  return (
                    <div
                      key={step.number}
                      className={`flex gap-4 p-4 rounded-xl mb-3 border transition-all duration-300 ${
                        completed
                          ? 'bg-[#C5832B]/10 border-[#C5832B]/40'
                          : 'bg-white/[0.02] border-white/5'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${
                          completed
                            ? 'bg-[#C5832B] text-white'
                            : 'bg-white/10 text-neutral-400'
                        } ${active ? 'animate-pulse' : ''}`}
                      >
                        {completed ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <StepIcon className="w-5 h-5" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[10px] text-[#DE9B42] font-bold tracking-widest">
                            STEP {step.number}
                          </span>

                          <span className="text-xs font-bold tracking-widest">
                            {step.title}
                          </span>
                        </div>

                        <p
                          className={`text-xs sm:text-sm leading-relaxed ${
                            completed
                              ? 'text-neutral-200'
                              : 'text-neutral-400'
                          }`}
                        >
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}

                <div className="mt-5 pt-5 border-t border-white/10 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#DE9B42] shrink-0" />

                  <p className="text-xs text-neutral-400 leading-relaxed">
                    This is an illustrative workflow simulation. Actual device
                    response, security rules and integration depend on the
                    selected equipment and installation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FINAL CALL TO ACTION */}
        <div className="mt-16 text-center">
          <p className="text-sm sm:text-base text-neutral-600 mb-5">
            Looking for a tailored automation solution for your building?
          </p>

          <button
            type="button"
            onClick={() =>
              onRequestAutomationQuote('Complete Smart Automation Solution')
            }
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-neutral-900 hover:bg-[#C5832B] text-white font-bold text-sm uppercase tracking-wide transition-colors"
          >
            Discuss Your Project
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default AutomationSection;