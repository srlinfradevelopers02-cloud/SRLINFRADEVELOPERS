import React from 'react';
import { Home, Building2, Utensils, Award, Landmark, Briefcase, ShoppingBag, BedDouble, ArrowRight, Check } from 'lucide-react';
import { SPACE_SOLUTIONS } from '../data/projectsAndSolutions';

interface SolutionsSectionProps {
  onSelectSpaceSolution: (spaceTitle: string) => void;
}

export const SolutionsSection: React.FC<SolutionsSectionProps> = ({ onSelectSpaceSolution }) => {
  const getIcon = (categoryKey: string) => {
    switch (categoryKey) {
      case 'Residential':
        return Home;
      case 'Corporate':
        return Briefcase;
      case 'Restaurants':
        return Utensils;
      case 'Banquet Halls':
        return Award;
      case 'Government':
        return Landmark;
      case 'Commercial':
        return Building2;
      case 'Retail':
        return ShoppingBag;
      case 'Hospitality':
        return BedDouble;
      default:
        return Building2;
    }
  };

  return (
    <section id="solutions" className="py-24 bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-bold tracking-[0.25em] font-montserrat text-[#C5832B] uppercase mb-3 block">
            TAILORED ARCHITECTURAL FIT
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-montserrat tracking-tight text-neutral-900 mb-4 uppercase">
            SOLUTIONS FOR EVERY SPACE
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed font-sans">
            Every building serves a unique human purpose. We engineer materials and automation tailored precisely to each typology.
          </p>
        </div>

        {/* 8 Space Solutions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SPACE_SOLUTIONS.map((space) => {
            const IconComp = getIcon(space.categoryKey);
            return (
              <div
                key={space.title}
                className="bg-[#FAFAFA] rounded-2xl border border-neutral-200/90 p-6 flex flex-col justify-between hover:border-[#C5832B]/60 transition-all duration-300 group shadow-xs hover:shadow-lg"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-[#C5832B] group-hover:scale-110 group-hover:border-[#C5832B] transition-transform mb-5 shadow-2xs">
                    <IconComp className="w-6 h-6" />
                  </div>

                  <h3 className="text-lg font-bold font-montserrat text-neutral-900 group-hover:text-[#C5832B] transition-colors mb-2">
                    {space.title}
                  </h3>

                  <p className="text-xs text-neutral-600 mb-4 leading-relaxed font-sans">
                    {space.description}
                  </p>

                  <div className="p-3 bg-white rounded-xl border border-neutral-200 mb-4 text-xs text-neutral-700 leading-snug shadow-2xs">
                    <span className="text-[#C5832B] font-bold block mb-1">How We Help:</span>
                    {space.howWeHelp}
                  </div>

                  {/* Highlights */}
                  <div className="space-y-1.5 pt-2">
                    {space.interiorHighlights.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-neutral-700">
                        <Check className="w-3 h-3 text-[#C5832B] shrink-0" />
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-neutral-200">
                  <button
                    onClick={() => onSelectSpaceSolution(space.title)}
                    className="w-full py-2 bg-white hover:bg-[#C5832B] text-neutral-800 hover:text-white text-xs font-bold font-montserrat uppercase rounded-lg border border-neutral-200 hover:border-[#C5832B] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>Request Proposal</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
