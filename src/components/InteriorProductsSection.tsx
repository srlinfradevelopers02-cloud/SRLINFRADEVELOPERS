import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ArrowRight,
  Check,
  MapPin,
  Layers,
  ShoppingCart,
  Plus,
  Minus,
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import { useSharedCart } from './SharedCart';
import {
  INTERIOR_PRODUCTS,
  INTERIOR_CATEGORIES,
  InteriorProduct,
} from '../data/interiorProducts';

interface InteriorProductsSectionProps {
  onSelectProduct: (product: InteriorProduct) => void;
  onRequestQuoteForProduct: (productName: string) => void;
}

type DbProduct = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  stock_quantity: number;
  website_cart_limit: number;
  image_urls: string[] | null;
};

export const InteriorProductsSection: React.FC<
  InteriorProductsSectionProps
> = ({ onSelectProduct, onRequestQuoteForProduct }) => {
  const sharedCart = useSharedCart();

  const [selectedCategory, setSelectedCategory] =
    useState<string>('All Products');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] =
    useState('All Applications');
  const [successMessage, setSuccessMessage] = useState('');
  const [dbProducts, setDbProducts] = useState<DbProduct[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState('');


  useEffect(() => {
    let active = true;

    async function loadPublishedProducts() {
      setDbLoading(true);

      const { data, error } = await supabase
        .from('products')
        .select(
          'id, name, description, category, price, unit, stock_quantity, website_cart_limit, image_urls'
        )
        .eq('is_published', true)
        .order('name', { ascending: true });

      if (!active) return;

      if (error) {
        console.error('Could not load website prices/stock:', error);
        setDbError(
          'Live pricing and stock could not be loaded. Please refresh or enquire for a quote.'
        );
        setDbProducts([]);
      } else {
        setDbProducts(
          (data ?? []).map((item: any) => ({
            id: String(item.id),
            name: String(item.name ?? ''),
            description: String(item.description ?? ''),
            category: String(item.category ?? 'Other'),
            price: Number(item.price) || 0,
            unit: String(item.unit ?? 'piece'),
            stock_quantity: Math.max(
              0,
              Number(item.stock_quantity) || 0
            ),
            website_cart_limit: Math.max(
              0,
              Number(item.website_cart_limit) || 0
            ),
            image_urls: item.image_urls ?? [],
          }))
        );
      }

      setDbLoading(false);
    }

    void loadPublishedProducts();

    return () => {
      active = false;
    };
  }, []);

  const normalizeName = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]/g, '');

  const productDbMap = useMemo(() => {
    const map: Record<string, DbProduct | undefined> = {};

    for (const catalogueItem of INTERIOR_PRODUCTS) {
      const key = normalizeName(catalogueItem.name);

      const exact = dbProducts.find(
        (item) => normalizeName(item.name) === key
      );

      const matched =
        exact ??
        dbProducts.find((item) => {
          const dbKey = normalizeName(item.name);

          return (
            key.length >= 7 &&
            dbKey.length >= 7 &&
            (dbKey.includes(key) || key.includes(dbKey))
          );
        });

      map[catalogueItem.id] = matched;
    }

    return map;
  }, [dbProducts]);

  const money = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value);

  const applicationFilters = [
    'All Applications',
    'Living & Bedrooms',
    'Offices & Boardrooms',
    'Restaurants & Cafes',
    'Banquet Halls & Hospitality',
    'Ceilings & Balconies',
    'Outdoor Elevations',
    'Villas & Cabins',
  ];


  // Keep the curated catalogue, and append published Supabase interior items
  // that are not already represented in the catalogue.
  const interiorDbCategories = new Set([
    'Soffit Panels',
    'Roofing Accessories',
    'SPC Flooring',
    'PVC Panels',
    'UPVC Roofing',
    'Exterior Panels',
    'Accessories',
    'WPC Panels',
    'Hollow Roofing',
    'Partition Boards',
    'Adhesives',
    'Roofing',
    'Polygranite',
    'Stone Panels',
    'Wallpaper',
    'Bamboo Charcoal Board',
    'Bamboo Charcoal Boards',
  ]);

  const mapDbCategory = (category: string): InteriorProduct['category'] => {
    const value = category.toLowerCase();
    if (value.includes('floor')) return 'Flooring';
    if (value.includes('soffit') || value.includes('ceiling')) return 'Soffit & Ceilings';
    if (value.includes('roof') || value.includes('exterior')) return 'Roofing & Exterior';
    if (value.includes('partition') || value.includes('structural')) return 'Partitions & Structural';
    if (value.includes('adhesive') || value.includes('accessor')) return 'Adhesives & Accessories';
    if (value.includes('fluted') || value.includes('decorative') || value.includes('wpc')) return 'Fluted & Decorative';
    return 'Wall & Surface';
  };

  const combinedProducts = useMemo<InteriorProduct[]>(() => {
    const catalogueNames = INTERIOR_PRODUCTS.map((p) => normalizeName(p.name));
    const extraProducts: InteriorProduct[] = dbProducts
      .filter((db) => interiorDbCategories.has(db.category))
      .filter((db) => {
        const dbName = normalizeName(db.name);
        return !catalogueNames.some((name) =>
          name === dbName ||
          (name.length >= 7 && dbName.length >= 7 &&
            (name.includes(dbName) || dbName.includes(name)))
        );
      })
      .map((db) => ({
        id: `supabase-${db.id}`,
        name: db.name,
        category: mapDbCategory(db.category),
        tagline: db.description || `${db.category} product from SRL Infra Developers.`,
        whatIsIt: db.description || `${db.name} available from SRL Infra Developers.`,
        whyChooseIt: [],
        applications: [],
        image: db.image_urls?.find((url) => typeof url === 'string' && url.trim()) || '',
        specifications: {
          dimensions: 'Contact us for specifications',
          thickness: 'As per product',
          coverage: 'Contact us for coverage details',
          lifetime: 'As per manufacturer specifications',
          material: db.category,
          installation: 'Contact our team for installation details',
        },
        patternsCount: 0,
        highlightPatterns: [],
        matchingAccessories: [],
      }));

    return [...INTERIOR_PRODUCTS, ...extraProducts];
  }, [dbProducts]);

  const filteredProducts = useMemo(() => {
    return combinedProducts.filter((product) => {
      if (
        selectedCategory !== 'All Products' &&
        product.category !== selectedCategory
      ) return false;

      if (selectedApplication !== 'All Applications') {
        const queryApp = selectedApplication.toLowerCase();
        const apps = product.applications || [];
        const matchesApp = apps.some((app) => {
          const a = app.toLowerCase();
          if (queryApp.includes('living') && (a.includes('living') || a.includes('bedroom') || a.includes('suite'))) return true;
          if (queryApp.includes('office') && (a.includes('office') || a.includes('boardroom') || a.includes('cabin'))) return true;
          if (queryApp.includes('restaurant') && (a.includes('restaurant') || a.includes('cafe') || a.includes('dining'))) return true;
          if (queryApp.includes('banquet') && (a.includes('banquet') || a.includes('hotel') || a.includes('lobby'))) return true;
          if (queryApp.includes('ceiling') && (a.includes('ceiling') || a.includes('balcony') || a.includes('porch') || a.includes('soffit'))) return true;
          if (queryApp.includes('elevation') && (a.includes('elevation') || a.includes('facade') || a.includes('exterior') || a.includes('shopfront'))) return true;
          if (queryApp.includes('villa') && (a.includes('villa') || a.includes('cabin') || a.includes('roof'))) return true;
          return a.includes(queryApp);
        });
        if (!matchesApp) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          product.name.toLowerCase().includes(query) ||
          product.tagline.toLowerCase().includes(query) ||
          product.whatIsIt.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          (product.applications || []).some((a) => a.toLowerCase().includes(query)) ||
          (product.highlightPatterns || []).some((pattern) => pattern.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [combinedProducts, selectedCategory, selectedApplication, searchQuery]);


  return (
    <section
      id="interior-products"
      className="py-24 bg-white relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <span className="text-xs font-bold tracking-[0.25em] font-montserrat text-[#C47D2B] uppercase mb-3 block">
            DIVISION 01 · MATERIALS & ARCHITECTURAL FINISHES
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-montserrat tracking-tight text-neutral-900 mb-4 uppercase">
            INTERIOR DESIGN PRODUCTS
          </h2>

          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed font-sans">
            Comprehensive architectural product catalog featuring 16
            product lines, 200+ shade patterns, and specialized
            installation trims.
          </p>
        </div>

        {successMessage && (
          <div
            role="status"
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            <span>{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-[#FAF9F6] p-4">
          <div>
            <p className="font-semibold text-neutral-900">
              Live pricing & availability
            </p>

            <p className="text-xs text-neutral-600">
              Prices and stock are loaded from published Supabase
              products.
            </p>

            {dbLoading && (
              <p className="mt-1 text-xs text-neutral-500">
                Loading live prices and stock…
              </p>
            )}

            {dbError && (
              <p role="alert" className="mt-1 text-xs text-amber-700">
                {dbError}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={sharedCart.openCart}
            className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-bold text-white hover:bg-[#C47D2B]"
          >
            <ShoppingCart className="h-4 w-4" />
            Cart ({sharedCart.count}) · {money(sharedCart.subtotal)}
          </button>
        </div>

        {/* Existing search and filters */}
        <div className="bg-[#FAF9F6] p-5 sm:p-6 rounded-3xl border border-neutral-200/90 mb-10 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog (e.g., Polygranite, Fluted, SPC, Soffit, PU Stone, BondX)..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#C47D2B] transition-colors shadow-2xs"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="md:col-span-6 flex items-center gap-2">
              <span className="text-xs text-neutral-600 font-semibold shrink-0 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#C47D2B]" />
                Area:
              </span>

              <div className="flex-1 overflow-x-auto no-scrollbar py-1">
                <div className="flex gap-1.5 min-w-max">
                  {applicationFilters.map((app) => (
                    <button
                      key={app}
                      type="button"
                      onClick={() => setSelectedApplication(app)}
                      className={`px-3 py-1.5 text-xs rounded-xl transition-colors font-medium cursor-pointer ${
                        selectedApplication === app
                          ? 'bg-[#C47D2B] text-white font-semibold shadow-xs'
                          : 'bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200 shadow-2xs'
                      }`}
                    >
                      {app}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-neutral-200/80 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 min-w-max">
              {INTERIOR_CATEGORIES.map((category) => {
                const isSelected = selectedCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold font-montserrat uppercase tracking-wider transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70 border border-neutral-200'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8 px-1">
          <p className="text-xs text-neutral-500 font-medium">
            Showing{' '}
            <strong className="text-neutral-900">
              {filteredProducts.length}
            </strong>{' '}
            of <strong>{combinedProducts.length}</strong> architectural
            product collections
          </p>

          {(selectedCategory !== 'All Products' ||
            selectedApplication !== 'All Applications' ||
            searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All Products');
                setSelectedApplication('All Applications');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-[#C47D2B] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Product cards */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-[#FAF9F6] rounded-3xl border border-neutral-200">
            <Layers className="w-12 h-12 text-neutral-400 mx-auto mb-3" />

            <h4 className="text-lg font-bold font-montserrat text-neutral-900 mb-1">
              No matching interior products found
            </h4>

            <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-6">
              Try adjusting your search query or selecting a different
              category or application filter.
            </p>

            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All Products');
                setSelectedApplication('All Applications');
                setSearchQuery('');
              }}
              className="px-5 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl"
            >
              Show All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => {
              const dbProduct = product.id.startsWith('supabase-')
                ? dbProducts.find((item) => item.id === product.id.slice('supabase-'.length))
                : productDbMap[product.id];
              const sharedItem = dbProduct
                ? sharedCart.items.find((item) => item.id === dbProduct.id)
                : undefined;
              const quantity = sharedItem?.quantity ?? 0;
              const stockLimit = dbProduct
                ? Math.min(
                    dbProduct.stock_quantity,
                    dbProduct.website_cart_limit
                  )
                : 0;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl border border-neutral-200 shadow-sm hover:shadow-xl hover:border-[#C47D2B]/50 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    <div className="relative w-full aspect-[4/3] overflow-hidden bg-white flex items-center justify-center">
                      <img
                        src={product.image || '/products/product-placeholder.png'}
                        alt={product.name}
                        className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                        loading="eager"
                        referrerPolicy="no-referrer"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-wider font-montserrat uppercase px-2.5 py-1 bg-white/95 text-neutral-900 rounded-md backdrop-blur-xs shadow-xs">
                          {product.category}
                        </span>

                        <span className="text-[10px] font-bold tracking-wider font-montserrat uppercase px-2.5 py-1 bg-[#C47D2B] text-white rounded-md shadow-xs">
                          {product.patternsCount}+ Patterns
                        </span>
                      </div>

                      {product.featured && (
                        <div className="absolute top-3 right-3">
                          <span className="text-[10px] font-bold tracking-wider font-montserrat uppercase px-2.5 py-1 bg-neutral-900 text-white rounded shadow-xs">
                            FLAGSHIP
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold font-montserrat text-neutral-900 group-hover:text-[#C47D2B] transition-colors mb-1.5">
                        {product.name}
                      </h3>

                      <p className="text-xs text-neutral-600 leading-relaxed mb-4 line-clamp-2">
                        {product.whatIsIt}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-4 text-[11px] font-mono text-neutral-600 bg-[#FAF9F6] p-2.5 rounded-xl border border-neutral-200/80">
                        <span className="font-semibold text-neutral-900">
                          {product.specifications.dimensions}
                        </span>
                        <span className="text-neutral-300">|</span>
                        <span>{product.specifications.material}</span>
                        <span className="text-neutral-300">|</span>
                        <span>{product.specifications.thickness}</span>
                      </div>

                      <p className="text-sm text-neutral-600 leading-relaxed mb-4">
                        {product.tagline}
                      </p>

                      <div className="space-y-2 mb-4">
                        {product.highlightPatterns.slice(0, 3).map((pattern) => (
                          <div
                            key={pattern}
                            className="flex items-start gap-2 text-xs text-neutral-600"
                          >
                            <Check className="w-3.5 h-3.5 text-[#C47D2B] mt-0.5 shrink-0" />
                            <span>{pattern}</span>
                          </div>
                        ))}
                      </div>

                      {dbLoading ? (
                        <p className="rounded-xl bg-neutral-50 p-3 text-sm text-neutral-500">
                          Loading price and availability…
                        </p>
                      ) : dbProduct ? (
                        <div className="rounded-xl border border-neutral-200 bg-[#FAF9F6] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs text-neutral-500">
                                Price per {dbProduct.unit}
                              </p>
                              <p className="text-xl font-bold text-neutral-900">
                                {money(dbProduct.price)}
                              </p>
                            </div>

                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              stockLimit > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {stockLimit > 0
                                ? `${dbProduct.stock_quantity} in stock`
                                : 'Out of stock'}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {quantity > 0 ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => sharedCart.setQuantity(dbProduct.id, quantity - 1)}
                                  className="rounded-lg border bg-white p-2"
                                  aria-label={`Decrease ${product.name}`}
                                >
                                  <Minus className="h-4 w-4" />
                                </button>

                                <span className="min-w-8 text-center font-bold">
                                  {quantity}
                                </span>

                                <button
                                  type="button"
                                  disabled={quantity >= stockLimit}
                                  onClick={() => sharedCart.addItem({
                                  id: dbProduct.id,
                                  name: dbProduct.name,
                                  category: dbProduct.category || 'Interior Products',
                                  price: dbProduct.price,
                                  unit: dbProduct.unit,
                                  stock_quantity: dbProduct.stock_quantity,
                                  website_cart_limit: dbProduct.website_cart_limit,
                                })}
                                  className="rounded-lg border bg-white p-2 disabled:opacity-40"
                                  aria-label={`Increase ${product.name}`}
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                disabled={stockLimit <= 0}
                                onClick={() => sharedCart.addItem({
                                  id: dbProduct.id,
                                  name: dbProduct.name,
                                  category: dbProduct.category || 'Interior Products',
                                  price: dbProduct.price,
                                  unit: dbProduct.unit,
                                  stock_quantity: dbProduct.stock_quantity,
                                  website_cart_limit: dbProduct.website_cart_limit,
                                })}
                                className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-[#C47D2B] disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <ShoppingCart className="h-4 w-4" />
                                Add to Cart
                              </button>
                            )}

                            <span className="text-xs text-neutral-500">
                              Cart limit: {stockLimit}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-neutral-200 bg-[#FAF9F6] p-4">
                          <p className="font-semibold text-neutral-900">
                            Price on request
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            Contact our team for pricing and availability.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 pt-0 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      className="flex-1 flex items-center justify-center gap-2 border border-neutral-200 px-4 py-3 rounded-xl text-xs font-bold text-neutral-700 hover:border-[#C47D2B] hover:text-[#C47D2B] transition-colors"
                    >
                      View Details <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onRequestQuoteForProduct(product.name)}
                      className="flex-1 bg-[#C47D2B] text-white px-4 py-3 rounded-xl text-xs font-bold hover:bg-neutral-900 transition-colors cursor-pointer"
                    >
                      Enquire
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};