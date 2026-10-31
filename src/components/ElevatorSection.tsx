
import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Settings2,
  Package,
  ShoppingCart,
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import { useSharedCart } from './SharedCart';

interface ElevatorSectionProps {
  onRequestQuote: (elevatorName: string) => void;
}

interface ElevatorType {
  name: string;
  category: string;
  description: string;
  image: string;
  features: string[];
}

interface InventoryProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  image_urls: string[];
  price: number;
  unit: string;
  stock_quantity: number;
  website_cart_limit?: number;
}

const ELEVATOR_TYPES: ElevatorType[] = [
  {
    name: 'Passenger Lift — Center Opening',
    category: 'Passenger Lifts',
    description:
      'Passenger elevator with automatic center-opening doors, designed for smooth and convenient vertical transportation.',
    image: '/automation/passenger-lift-center.png',
    features: [
      'Automatic center-opening doors',
      'Smooth and quiet operation',
      'Residential and commercial applications',
    ],
  },
  {
    name: 'Passenger Lift — Telescopic Opening',
    category: 'Passenger Lifts',
    description:
      'Passenger elevator with automatic telescopic-opening doors, suitable for modern residential and commercial spaces.',
    image: '/automation/passenger-lift-telescopic.png',
    features: [
      'Automatic telescopic doors',
      'Space-efficient entrance',
      'Residential and commercial applications',
    ],
  },
  {
    name: 'Hospital Lift — Center Opening',
    category: 'Hospital Lifts',
    description:
      'Hospital elevator with automatic center-opening doors and a spacious configuration for healthcare environments.',
    image: '/automation/hospital-lift-center.png',
    features: [
      'Automatic center-opening doors',
      'Spacious cabin configuration',
      'Healthcare applications',
    ],
  },
  {
    name: 'Hospital Lift — Telescopic Opening',
    category: 'Hospital Lifts',
    description:
      'Hospital elevator with automatic telescopic-opening doors designed for reliable movement within healthcare facilities.',
    image: '/automation/hospital-lift-telescopic.png',
    features: [
      'Automatic telescopic doors',
      'Wide and accessible entrance',
      'Healthcare applications',
    ],
  },
  {
    name: 'Product Lift',
    category: 'Specialized Lifts',
    description:
      'Heavy-duty vertical transportation solutions for warehouses, commercial buildings, and industrial applications.',
    image: '/automation/goods-lift.png',
    features: [
      'Heavy-load capability',
      'Industrial construction',
      'Material transportation',
    ],
  },
  {
    name: 'Home Lift',
    category: 'Residential Lifts',
    description:
      'Compact luxury home elevators designed to integrate into modern residential spaces.',
    image: '/automation/home-lift.png',
    features: [
      'Space-efficient design',
      'Luxury interiors',
      'Residential integration',
    ],
  },
  {
    name: 'Hydraulic Lift',
    category: 'Specialized Lifts',
    description:
      'Hydraulic elevator systems designed for reliable and powerful vertical movement.',
    image: '/automation/hydraulic-lift.png',
    features: [
      'Powerful lifting system',
      'Reliable operation',
      'Flexible installation',
    ],
  },
  {
    name: 'Capsule Lift',
    category: 'Architectural Lifts',
    description:
      'Architectural capsule elevators combining vertical mobility with a distinctive visual experience.',
    image: '/automation/capsule-lift.png',
    features: [
      'Panoramic design',
      'Architectural appearance',
      'Premium cabin experience',
    ],
  },
  {
    name: 'Scissor Lift',
    category: 'Specialized Lifts',
    description:
      'Vertical lifting solutions designed for controlled access and specialized applications.',
    image: '/automation/scissor-lift.png',
    features: [
      'Stable lifting platform',
      'Specialized applications',
      'Robust construction',
    ],
  },
  {
    name: 'Structure Lift',
    category: 'Specialized Lifts',
    description:
      'Structural elevator solutions engineered for buildings requiring customized vertical access systems.',
    image: '/automation/structure-lift.png',
    features: [
      'Custom configurations',
      'Structural integration',
      'Commercial applications',
    ],
  },
  {
    name: 'Automobile Lift',
    category: 'Automobile Lifts',
    description:
      'Vehicle lifting solutions designed for automobile showrooms, parking systems, workshops, and commercial facilities.',
    image: '/automation/automobile-lift.png',
    features: [
      'Vehicle handling',
      'Heavy-duty construction',
      'Parking applications',
    ],
  },
];

const normalizeName = (value: string): string =>
  value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[—–-]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(elevators?|lifts?)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const findMatchingProduct = (
  elevator: ElevatorType,
  products: InventoryProduct[]
): InventoryProduct | undefined => {
  const target = normalizeName(elevator.name);

  if (!target) return undefined;

  // 1. Exact name match
  const exactMatch = products.find(
    (product) => normalizeName(product.name) === target
  );

  if (exactMatch) return exactMatch;

  // 2. Match based on meaningful words
  const targetWords = target
    .split(' ')
    .filter((word) => word.length > 2);

  let bestProduct: InventoryProduct | undefined;
  let bestScore = 0;

  for (const product of products) {
    const candidate = normalizeName(product.name);

    if (!candidate) continue;

    // Prefer names that contain one another.
    if (
      candidate.includes(target) ||
      target.includes(candidate)
    ) {
      const score =
        Math.min(candidate.length, target.length) /
        Math.max(candidate.length, target.length);

      if (score > bestScore) {
        bestProduct = product;
        bestScore = score;
      }

      continue;
    }

    const candidateWords = new Set(
      candidate.split(' ').filter((word) => word.length > 2)
    );

    const sharedWords = targetWords.filter((word) =>
      candidateWords.has(word)
    );

    // Avoid matching products on just one generic word.
    if (sharedWords.length < 2) continue;

    const score =
      sharedWords.length / Math.max(targetWords.length, 1);

    if (score >= 0.6 && score > bestScore) {
      bestProduct = product;
      bestScore = score;
    }
  }

  return bestProduct;
};

export const ElevatorSection: React.FC<ElevatorSectionProps> = ({
  onRequestQuote,
}) => {
  const { items: sharedCartItems, addItem: addSharedCartItem, setQuantity: setSharedCartQuantity } = useSharedCart();
  const [inventoryProducts, setInventoryProducts] = useState<
    InventoryProduct[]
  >([]);

  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      setProductsLoading(true);

      try {
        const { data, error } = await supabase
          .from('products')
          .select(
            'id,name,category,description,image_urls,price,unit,stock_quantity,website_cart_limit'
          )
          .eq('is_published', true);

        if (error) {
          throw error;
        }

        if (!active) return;

        const products: InventoryProduct[] = (data ?? []).map(
          (product: any) => {
            let imageUrls: string[] = [];

            if (Array.isArray(product.image_urls)) {
              imageUrls = product.image_urls.filter(
                (url: unknown): url is string =>
                  typeof url === 'string' &&
                  url.trim().length > 0
              );
            } else if (
              typeof product.image_urls === 'string' &&
              product.image_urls.trim()
            ) {
              imageUrls = [product.image_urls];
            }

            return {
              id: String(product.id),
              name: String(product.name ?? ''),
              category: String(product.category ?? ''),
              description: String(product.description ?? ''),
              image_urls: imageUrls,
              price: Math.max(0, Number(product.price) || 0),
              unit: String(product.unit || 'piece'),
              stock_quantity: Math.max(
                0,
                Number(product.stock_quantity) || 0
              ),
              website_cart_limit: Math.max(0, Number(product.website_cart_limit) || 0),
            };
          }
        );

        setInventoryProducts(products);
      } catch (error) {
        console.error(
          'Could not load elevator inventory products:',
          error
        );

        if (active) {
          setInventoryProducts([]);
        }
      } finally {
        if (active) {
          setProductsLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section
      id="elevators"
      className="relative overflow-hidden bg-[#111111] py-24 sm:py-28"
    >
      <div className="pointer-events-none absolute -top-40 right-[-120px] h-[500px] w-[500px] rounded-full bg-[#C5832B]/10 blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* SECTION HEADER */}
        <div className="mx-auto mb-16 max-w-4xl text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-[#C5832B]" />

            <span className="font-montserrat text-xs font-bold uppercase tracking-[0.25em] text-[#C5832B]">
              DIVISION 03 · VERTICAL MOBILITY
            </span>

            <span className="h-px w-10 bg-[#C5832B]" />
          </div>

          <h2 className="font-montserrat text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Elevators &{' '}
            <span className="text-[#C5832B]">
              Vertical Access
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-neutral-400 sm:text-lg">
            Premium elevator and vertical mobility solutions for
            residential, commercial, healthcare, industrial, and
            architectural spaces.
          </p>
        </div>

        {/* HERO */}
        <div className="mb-20 overflow-hidden rounded-3xl border border-white/10 bg-[#181818] shadow-2xl">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative aspect-video w-full overflow-hidden bg-[#111111]">
              <img
                src="/automation/smartelevator.png"
                alt="Smart Elevators and Vertical Access"
                className="absolute inset-0 h-full w-full object-contain"
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/50" />
            </div>

            <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-14">
              <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#C5832B]/30 bg-[#C5832B]/10">
                <Building2 className="h-7 w-7 text-[#C5832B]" />
              </div>

              <h3 className="font-montserrat text-3xl font-bold text-white sm:text-4xl">
                Intelligent Vertical Mobility
              </h3>

              <p className="mt-5 leading-8 text-neutral-400">
                Explore passenger lifts, hospital lifts, residential
                lifts, automobile lifts, and specialized vertical
                transportation systems designed for modern buildings.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#C5832B]" />

                  <div>
                    <p className="font-semibold text-white">
                      Safety Focused
                    </p>

                    <p className="mt-1 text-sm text-neutral-500">
                      Designed around reliable operation and controlled
                      access.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Settings2 className="mt-1 h-5 w-5 shrink-0 text-[#C5832B]" />

                  <div>
                    <p className="font-semibold text-white">
                      Customized Solutions
                    </p>

                    <p className="mt-1 text-sm text-neutral-500">
                      Solutions matched to building requirements.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PRODUCTS HEADER */}
        <div className="mb-10">
          <span className="font-montserrat text-xs font-bold uppercase tracking-[0.2em] text-[#C5832B]">
            OUR ELEVATOR RANGE
          </span>

          <h3 className="mt-3 font-montserrat text-2xl font-bold text-white sm:text-3xl">
            Vertical Solutions for Every Space
          </h3>

          <p className="mt-3 text-sm text-neutral-400">
            {productsLoading
              ? 'Loading elevator availability...'
              : 'Explore elevator solutions and enquire about your requirements.'}
          </p>
        </div>

        {/* ELEVATOR PRODUCT CARDS */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ELEVATOR_TYPES.map((elevator) => {
            const inventoryProduct = findMatchingProduct(
              elevator,
              inventoryProducts
            );

            const inventoryImage =
              inventoryProduct?.image_urls?.[0];

            const displayedImage =
              inventoryImage || elevator.image;

            return (
              <article
                key={`${elevator.category}-${elevator.name}`}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#181818] transition-all duration-300 hover:-translate-y-1 hover:border-[#C5832B]/40"
              >
                {/* IMAGE */}
                <div className="relative h-64 overflow-hidden bg-white">
                  <img
                    src={displayedImage}
                    alt={elevator.name}
                    loading="lazy"
                    onError={(event) => {
                      const img = event.currentTarget;

                      if (
                        inventoryImage &&
                        img.src !==
                          new URL(
                            elevator.image,
                            window.location.origin
                          ).href
                      ) {
                        img.src = elevator.image;
                      }
                    }}
                    className="h-full w-full object-contain p-5 transition-transform duration-500 group-hover:scale-105"
                  />

                  <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/70 px-3 py-1.5 backdrop-blur-md">
                    <span className="font-montserrat text-[10px] font-bold uppercase tracking-wider text-[#C5832B]">
                      {elevator.category}
                    </span>
                  </div>
                </div>

                {/* PRODUCT DETAILS */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="font-montserrat text-xl font-bold text-white">
                      {elevator.name}
                    </h4>

                    <ArrowUpRight className="h-5 w-5 shrink-0 text-[#C5832B]" />
                  </div>

                  <p className="mt-3 text-sm leading-6 text-neutral-400">
                    {elevator.description}
                  </p>

                  {/* INVENTORY AVAILABILITY */}
                  {inventoryProduct && (
                    <div className="mt-5 rounded-xl border border-[#C5832B]/20 bg-[#C5832B]/5 p-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-[#C5832B]" />
                        <span className="text-neutral-300">Stock available:</span>
                        <span
                          className={
                            inventoryProduct.stock_quantity > 0
                              ? 'font-semibold text-green-400'
                              : 'font-semibold text-red-400'
                          }
                        >
                          {inventoryProduct.stock_quantity > 0
                            ? inventoryProduct.stock_quantity
                            : 'Out of stock'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* SHARED CART: only available when a real published inventory product matches */}
                  {inventoryProduct && (
                    <div className="mt-4 flex items-center gap-2">
                      {(() => {
                        const sharedQuantity =
                          sharedCartItems.find((item) => item.id === inventoryProduct.id)?.quantity ?? 0;
                        const cartLimit = Math.min(
                          inventoryProduct.stock_quantity,
                          Math.max(0, Number(inventoryProduct.website_cart_limit ?? inventoryProduct.stock_quantity) || 0)
                        );
                        return (
                          <>
                            <button
                              type="button"
                              aria-label={`Decrease ${inventoryProduct.name} quantity`}
                              disabled={sharedQuantity <= 0}
                              onClick={() => setSharedCartQuantity(inventoryProduct.id, sharedQuantity - 1)}
                              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white disabled:opacity-40"
                            >
                              −
                            </button>
                            <span className="min-w-6 text-center font-semibold text-white">{sharedQuantity}</span>
                            <button
                              type="button"
                              aria-label={`Add ${inventoryProduct.name} to shared cart`}
                              disabled={cartLimit < 1 || sharedQuantity >= cartLimit}
                              onClick={() => addSharedCartItem({
                                id: inventoryProduct.id,
                                name: inventoryProduct.name,
                                category: inventoryProduct.category || 'Elevators',
                                price: inventoryProduct.price,
                                unit: inventoryProduct.unit,
                                stock_quantity: inventoryProduct.stock_quantity,
                                website_cart_limit: cartLimit,
                              })}
                              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#C5832B] px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-white disabled:opacity-40"
                            >
                              <ShoppingCart className="h-4 w-4" />
                              Add to Shared Cart
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* FEATURES */}
                  <div className="mt-5 space-y-2.5">
                    {elevator.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-2.5 text-sm text-neutral-300"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#C5832B]" />

                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* ENQUIRY */}
                  <button
                    onClick={() => onRequestQuote(elevator.name)}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-3 font-montserrat text-xs font-bold tracking-wider text-white transition-all hover:border-[#C5832B]/50 hover:bg-[#C5832B]/10 hover:text-[#C5832B]"
                  >
                    ENQUIRE
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* BOTTOM CTA */}
        <div className="mt-16 rounded-2xl border border-[#C5832B]/20 bg-[#C5832B]/5 p-8 text-center sm:p-10">
          <p className="font-montserrat text-xs font-bold uppercase tracking-[0.2em] text-[#C5832B]">
            COMPLETE VERTICAL MOBILITY
          </p>

          <h3 className="mt-3 font-montserrat text-2xl font-bold text-white sm:text-3xl">
            From concept to installation
          </h3>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-neutral-400">
            Tell us about your building and elevator requirements.
            Our team can help identify the appropriate vertical
            mobility solution for your project.
          </p>

          <button
            onClick={() => onRequestQuote('Elevator Project')}
            className="mt-6 rounded-full bg-white px-7 py-3.5 font-montserrat text-sm font-bold text-[#111111] transition-all hover:bg-[#C5832B] hover:text-white"
          >
            START AN ELEVATOR PROJECT
          </button>
        </div>
      </div>
    </section>
  );
};