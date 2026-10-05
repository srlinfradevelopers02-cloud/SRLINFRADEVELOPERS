import React from 'react';
import { X, CheckCircle2, MapPin, Wrench, ShieldCheck, ArrowRight, Layers, Palette, Sparkles, Box } from 'lucide-react';
import { InteriorProduct } from '../data/interiorProducts';

interface ProductDetailModalProps {
  product: InteriorProduct | null;
  onClose: () => void;
  onRequestQuote: (productName: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onRequestQuote,
}) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
        <div className="relative transform overflow-hidden rounded-3xl bg-white border border-neutral-200 text-left shadow-2xl transition-all sm:my-8 w-full max-w-4xl">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2.5 text-neutral-500 hover:text-neutral-900 bg-white/90 hover:bg-white rounded-full border border-neutral-200 shadow-sm transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Hero Banner / Image */}
          <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-neutral-100">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />

            <div className="absolute bottom-5 left-6 right-6 sm:left-8 sm:right-8">
              <span className="text-[11px] font-bold uppercase tracking-widest font-montserrat text-[#C47D2B] bg-white/90 px-3 py-1 rounded-full border border-neutral-200 shadow-2xs inline-block mb-2">
                {product.category}
              </span>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black font-montserrat text-neutral-900 leading-tight">
                {product.name}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-700 mt-1 max-w-2xl font-sans">
                {product.tagline}
              </p>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-6 sm:p-8 space-y-8 max-h-[calc(85vh-200px)] overflow-y-auto">
            {/* 1. What is it? (Simple human language) */}
            <div>
              <h4 className="text-xs font-bold uppercase font-mono tracking-widest text-[#C47D2B] mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C47D2B]" />
                PRODUCT OVERVIEW & VALUE
              </h4>
              <p className="text-sm sm:text-base text-neutral-700 leading-relaxed bg-[#FAF9F6] p-4 sm:p-5 rounded-2xl border border-neutral-200/90 font-sans">
                {product.whatIsIt}
              </p>
            </div>

            {/* 2. Technical Specifications Table (from PDF Catalog) */}
            <div>
              <h4 className="text-xs font-bold uppercase font-mono tracking-widest text-neutral-800 mb-3 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-[#C47D2B]" />
                OFFICIAL TECHNICAL SPECIFICATIONS (FROM CATALOG)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#FAF8F5] p-5 rounded-2xl border border-neutral-200">
                <div className="p-3 bg-white rounded-xl border border-neutral-200/70">
                  <span className="text-[11px] font-mono text-neutral-500 block uppercase">Dimensions</span>
                  <span className="text-xs sm:text-sm font-bold text-neutral-900 font-montserrat mt-0.5 block">
                    {product.specifications.dimensions}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-neutral-200/70">
                  <span className="text-[11px] font-mono text-neutral-500 block uppercase">Thickness</span>
                  <span className="text-xs sm:text-sm font-bold text-neutral-900 font-montserrat mt-0.5 block">
                    {product.specifications.thickness}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-neutral-200/70">
                  <span className="text-[11px] font-mono text-neutral-500 block uppercase">Coverage Area</span>
                  <span className="text-xs sm:text-sm font-bold text-neutral-900 font-montserrat mt-0.5 block">
                    {product.specifications.coverage}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-neutral-200/70">
                  <span className="text-[11px] font-mono text-neutral-500 block uppercase">Expected Lifespan</span>
                  <span className="text-xs sm:text-sm font-bold text-[#C47D2B] font-montserrat mt-0.5 block">
                    {product.specifications.lifetime}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-neutral-200/70 sm:col-span-2">
                  <span className="text-[11px] font-mono text-neutral-500 block uppercase">Material Composition</span>
                  <span className="text-xs font-semibold text-neutral-800 mt-0.5 block">
                    {product.specifications.material}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-neutral-200/70 col-span-2 sm:col-span-3">
                  <span className="text-[11px] font-mono text-neutral-500 block uppercase">Installation Method</span>
                  <span className="text-xs font-medium text-neutral-700 mt-0.5 block">
                    {product.specifications.installation}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Catalog Shade Patterns & Models */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase font-mono tracking-widest text-neutral-800 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#C47D2B]" />
                  CURATED PATTERNS & SHADES ({product.patternsCount}+ Available)
                </h4>
                <span className="text-[11px] font-bold text-[#C47D2B] font-mono">
                  {product.patternsCount} Variants
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.highlightPatterns.map((pattern, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 text-xs text-neutral-800 bg-white border border-neutral-200/90 rounded-xl shadow-2xs font-medium flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C47D2B]" />
                    {pattern}
                  </span>
                ))}
              </div>
            </div>

            {/* 4. Matching Accessories & Profiles */}
            <div>
              <h4 className="text-xs font-bold uppercase font-mono tracking-widest text-neutral-800 mb-3 flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-[#C47D2B]" />
                MATCHING CORNER TRIMS & ACCESSORIES
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.matchingAccessories.map((acc, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-700 flex items-center gap-2 shadow-2xs"
                  >
                    <Layers className="w-4 h-4 text-[#C47D2B] shrink-0" />
                    <span className="font-medium">{acc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Why Choose It? (Visual Benefits) */}
            <div>
              <h4 className="text-xs font-bold uppercase font-mono tracking-widest text-[#C47D2B] mb-3">
                KEY ARCHITECTURAL ADVANTAGES
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.whyChooseIt.map((benefit, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FAF9F6] border border-neutral-200/80 text-xs sm:text-sm text-neutral-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#C47D2B] shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Ideal Applications */}
            <div>
              <h4 className="text-xs font-bold uppercase font-mono tracking-widest text-neutral-800 mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C47D2B]" />
                IDEAL APPLICATIONS
              </h4>
              <div className="flex flex-wrap gap-2">
                {product.applications.map((app, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 text-xs text-neutral-700 bg-neutral-100/80 border border-neutral-200 rounded-lg"
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-6 sm:p-8 bg-[#FAF9F6] border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <ShieldCheck className="w-4 h-4 text-[#C47D2B]" />
              <span>Certified SRL Infra quality guarantee & on-site installation support</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onClose();
                  onRequestQuote(product.name);
                }}
                className="w-1/2 sm:w-auto px-6 py-2.5 rounded-xl bg-[#C47D2B] hover:bg-[#DE9B42] text-white text-xs font-bold uppercase tracking-wider font-montserrat flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <span>Request Material Quote</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
