import React, { useState, useMemo } from 'react';
import { MapPin, ArrowRight, Layers, Eye } from 'lucide-react';
import { PROJECTS_LIST, ProjectItem } from '../data/projectsAndSolutions';

interface ProjectsSectionProps {
  onOpenProjectDetail: (project: ProjectItem) => void;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ onOpenProjectDetail }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Projects');

  const categories = [
    'All Projects',
    'Residential',
    'Commercial',
    'Restaurants',
    'Banquet Halls',
    'Government Offices',
    'Corporate',
    'Retail',
  ];

  const filteredProjects = useMemo(() => {
    if (selectedCategory === 'All Projects') return PROJECTS_LIST;
    return PROJECTS_LIST.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <section id="projects" className="py-24 bg-[#FAFAFA] border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <span className="text-xs font-bold tracking-[0.25em] font-montserrat text-[#C5832B] uppercase mb-3 block">
            PORTFOLIO SHOWCASE
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-montserrat tracking-tight text-neutral-900 mb-4 uppercase">
            OUR PROJECTS
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed font-sans">
            Delivering excellence across high-profile civic, corporate, hospitality, and luxury private developments.
          </p>
        </div>

        {/* Category Filter Pills / Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-montserrat transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#C5832B] text-white font-bold shadow-xs'
                    : 'bg-white text-neutral-700 hover:text-neutral-900 border border-neutral-200 shadow-2xs'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className="bg-white rounded-2xl border border-neutral-200/90 overflow-hidden hover:border-[#C5832B]/60 transition-all duration-300 flex flex-col justify-between group shadow-sm hover:shadow-xl"
            >
              <div>
                {/* Image */}
                <div className="relative h-60 overflow-hidden bg-neutral-100">
                  <img
                    src={proj.image}
                    alt={proj.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-bold tracking-wider font-montserrat uppercase px-2.5 py-1 bg-white/90 backdrop-blur-xs text-[#C5832B] rounded shadow-xs border border-neutral-200">
                      {proj.category}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-white font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#DE9B42]" />
                    <span>{proj.location}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-6">
                  <h3 className="text-lg font-bold font-montserrat text-neutral-900 group-hover:text-[#C5832B] transition-colors mb-2">
                    {proj.name}
                  </h3>

                  <p className="text-xs text-neutral-600 leading-relaxed mb-4 font-sans">
                    {proj.description}
                  </p>

                  {/* Solutions Provided */}
                  <div className="pt-3 border-t border-neutral-100">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block mb-2 font-bold">
                      Delivered Solutions:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {proj.solutionsProvided.map((sol, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] text-neutral-700 bg-[#F8F9FA] px-2.5 py-1 rounded border border-neutral-200 font-medium"
                        >
                          {sol}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 pt-0 mt-2">
                <button
                  onClick={() => onOpenProjectDetail(proj)}
                  className="w-full py-2.5 bg-[#F8F9FA] hover:bg-[#C5832B] text-neutral-800 hover:text-white rounded-lg text-xs font-bold font-montserrat uppercase tracking-wider border border-neutral-200 hover:border-[#C5832B] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Case Overview</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
