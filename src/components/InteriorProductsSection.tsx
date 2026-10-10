import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowRight, Check, Sparkles, MapPin, Layers, Palette, Wrench, ShieldCheck, Download } from 'lucide-react';
import { INTERIOR_PRODUCTS, INTERIOR_CATEGORIES, InteriorProduct } from '../data/interiorProducts';

interface InteriorProductsSectionProps {
  onSelectProduct: (product: InteriorProduct) => void;
  onRequestQuoteForProduct: (productName: string) => void;
}

export const InteriorProductsSection: React.FC<InteriorProductsSectionProps> = ({
  onSelectProduct,
  onRequestQuoteForProduct,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Products');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedApplication, setSelectedApplication] = useState<string>('All Applications');

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

  const filteredProducts = useMemo(() => {
    return INTERIOR_PRODUCTS.filter((product) => {
      // Category filter
      if (selectedCategory !== 'All Products' && product.category !== selectedCategory) {
        return false;
      }

      // Application filter
      if (selectedApplication !== 'All Applications') {
        const queryApp = selectedApplication.toLowerCase();
        const matchesApp = product.applications.some((app) => {
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

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesTagline = product.tagline.toLowerCase().includes(query);
        const matchesWhat = product.whatIsIt.toLowerCase().includes(query);
        const matchesCategory = product.category.toLowerCase().includes(query);
        const matchesApps = product.applications.some((a) => a.toLowerCase().includes(query));
        const matchesPatterns = product.highlightPatterns.some((p) => p.toLowerCase().includes(query));
        return matchesName || matchesTagline || matchesWhat || matchesCategory || matchesApps || matchesPatterns;
      }

      return true;
    });
  }, [selectedCategory, selectedApplication, searchQuery]);

  return (
    <section id="interior-products" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <span className="text-xs font-bold tracking-[0.25em] font-montserrat text-[#C47D2B] uppercase mb-3 block">
            DIVISION 01 · MATERIALS & ARCHITECTURAL FINISHES
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-montserrat tracking-tight text-neutral-900 mb-4 uppercase">
            INTERIOR DESIGN PRODUCTS
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed font-sans">
            Comprehensive architectural product catalog featuring 16 product lines, 200+ shade patterns, and specialized installation trims.
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-[#FAF9F6] p-5 sm:p-6 rounded-3xl border border-neutral-200/90 mb-10 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
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
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Application Dropdown Filter */}
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

          {/* Category Filter Tabs */}
          <div className="mt-5 pt-4 border-t border-neutral-200/80 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 min-w-max">
              {INTERIOR_CATEGORIES.map((category) => {
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
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

        {/* Results Count Bar */}
        <div className="flex items-center justify-between mb-8 px-1">
          <p className="text-xs text-neutral-500 font-medium">
            Showing <strong className="text-neutral-900">{filteredProducts.length}</strong> of{' '}
            <strong>{INTERIOR_PRODUCTS.length}</strong> architectural product collections
          </p>
          {(selectedCategory !== 'All Products' || selectedApplication !== 'All Applications' || searchQuery) && (
            <button
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

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-[#FAF9F6] rounded-3xl border border-neutral-200">
            <Layers className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
            <h4 className="text-lg font-bold font-montserrat text-neutral-900 mb-1">
              No matching interior products found
            </h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-6">
              Try adjusting your search query or selecting a different category or application filter.
            </p>
            <button
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
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-3xl border border-neutral-200 shadow-sm hover:shadow-xl hover:border-[#C47D2B]/50 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Product Image Preview */}
                 <div className="relative w-full aspect-[4/3] overflow-hidden bg-white flex items-center justify-center">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                        loading="eager"
                        referrerPolicy="no-referrer"
                      />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                    {/* Category & Pattern Count Badge */}
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

                  {/* Body Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold font-montserrat text-neutral-900 group-hover:text-[#C47D2B] transition-colors mb-1.5">
                      {product.name}
                    </h3>

                    <p className="text-xs text-neutral-600 leading-relaxed mb-4 line-clamp-2">
                      {product.whatIsIt}
                    </p>

                    {/* Specifications Pill Bar */}
                    <div className="flex flex-wrap gap-1.5 mb-4 text-[11px] font-mono text-neutral-600 bg-[#FAF9F6] p-2.5 rounded-xl border border-neutral-200/80">
                      <span className="font-semibold text-neutral-900">{product.specifications.dimensions}</span>
                      <span className="text-neutral-300">•</span>
                      <span>Thick: {product.specifications.thickness}</span>
                      <span className="text-neutral-300">•</span>
                      <span className="text-[#C47D2B] font-bold">{product.specifications.lifetime}</span>
                    </div>

                    {/* Simple Key Benefits (3 top bullet points) */}
                    <div className="space-y-1.5 mb-5 pt-1">
                      {product.whyChooseIt.slice(0, 3).map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-neutral-700">
                          <Check className="w-3.5 h-3.5 text-[#C47D2B] shrink-0" />
                          <span className="truncate">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* Applications Preview */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {product.applications.slice(0, 3).map((app, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] text-neutral-600 bg-[#FAF8F5] px-2 py-0.5 rounded border border-neutral-200"
                        >
                          {app}
                        </span>
                      ))}
                      {product.applications.length > 3 && (
                        <span className="text-[10px] text-neutral-400 px-1 py-0.5">
                          +{product.applications.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-6 pt-0 border-t border-neutral-100 flex items-center justify-between gap-3 mt-4">
                  <button
                    onClick={() => onSelectProduct(product)}
                    className="text-xs font-bold font-montserrat text-neutral-900 hover:text-[#C47D2B] flex items-center gap-1.5 transition-colors py-2 cursor-pointer"
                  >
                    <span>SPECIFICATIONS & SHADES</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C47D2B]" />
                  </button>

                  <button
                    onClick={() => onRequestQuoteForProduct(product.name)}
                    className="px-3.5 py-1.5 bg-[#FAF8F5] hover:bg-[#C47D2B] text-neutral-800 hover:text-white rounded-xl text-xs font-semibold border border-neutral-200 hover:border-[#C47D2B] transition-colors cursor-pointer"
                  >
                    Enquire
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Category Quick Reference Box from PDF */}
        <div className="mt-16 bg-[#FAF9F6] p-6 sm:p-8 rounded-3xl border border-neutral-200 max-w-5xl mx-auto shadow-xs">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#C47D2B] uppercase block mb-1">
              FULL ARCHITECTURAL INVENTORY
            </span>
            <h4 className="text-lg font-bold font-montserrat text-neutral-900">
              16 Comprehensive Material Product Lines Available For Immediate Supply
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-2xs">
              <span className="font-bold text-[#C47D2B] block mb-1 uppercase font-montserrat">Wall & Surface</span>
              <p className="text-neutral-600 leading-relaxed">
                Polygranite Sheets (3mm & 1.2mm, 51 patterns), Stone Panels (3mm, 10 patterns), PU 3D Stone Panels (30mm & 50mm), Bamboo Charcoal Boards (8mm), 210 GSM Wallpapers (57 patterns), PVC Wall Panels.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-2xs">
              <span className="font-bold text-[#C47D2B] block mb-1 uppercase font-montserrat">Fluted, Ceilings & Soffit</span>
              <p className="text-neutral-600 leading-relaxed">
                WPC Interior Fluted (Models 1–6, 8mm to 28mm), WPC Exterior Facades (26mm), Soffit Panels (12ft), Soffit Fluted Panels (9.5ft), Soffit Exterior Interlocking Planks.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-2xs">
              <span className="font-bold text-[#C47D2B] block mb-1 uppercase font-montserrat">Flooring, Partitions & Roofs</span>
              <p className="text-neutral-600 leading-relaxed">
                SPC Flooring (6.5mm with 1.5mm IXPE pad), PVC Partitions (26mm brick-wall replacement), Stone Coated Steel Roofing (40-70 yrs life), UPVC Corrugated Roofing, BondX & Structural Adhesives.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
