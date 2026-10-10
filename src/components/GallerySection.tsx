import React, { useState, useMemo } from 'react';
import { ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { GALLERY_PHOTOS, GalleryPhoto } from '../data/projectsAndSolutions';

export const GallerySection: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [activePhoto, setActivePhoto] = useState<GalleryPhoto | null>(null);

  const categories = [
    'All',
    'Interior Products',
    'Smart Automation',
    'Completed Projects',
    'Architectural Spaces',
  ];

  const filteredPhotos = useMemo(() => {
    if (selectedFilter === 'All') return GALLERY_PHOTOS;
    return GALLERY_PHOTOS.filter((p) => p.category === selectedFilter);
  }, [selectedFilter]);

  const handleNextPhoto = () => {
    if (!activePhoto) return;
    const currentIndex = filteredPhotos.findIndex((p) => p.id === activePhoto.id);
    const nextIndex = (currentIndex + 1) % filteredPhotos.length;
    setActivePhoto(filteredPhotos[nextIndex]);
  };

  const handlePrevPhoto = () => {
    if (!activePhoto) return;
    const currentIndex = filteredPhotos.findIndex((p) => p.id === activePhoto.id);
    const prevIndex = (currentIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
    setActivePhoto(filteredPhotos[prevIndex]);
  };

  return (
    <section id="gallery" className="py-24 bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <span className="text-xs font-bold tracking-[0.25em] font-montserrat text-[#C5832B] uppercase mb-3 block">
            VISUAL EXCELLENCE
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-montserrat tracking-tight text-neutral-900 mb-4 uppercase">
            GALLERY
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed font-sans">
            A curated showcase of real-world materials, smart hardware details, and elevated spaces.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => {
            const isSelected = selectedFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold font-montserrat transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#C5832B] text-white font-bold shadow-xs'
                    : 'bg-[#F8F9FA] text-neutral-700 hover:text-neutral-900 border border-neutral-200 shadow-2xs'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setActivePhoto(photo)}
              className="group relative w-full rounded-2xl overflow-hidden bg-white border border-neutral-200 hover:border-[#C5832B]/60 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl"
            >
              <img
                src={photo.image}
                alt={photo.title}
                className="block w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
                loading = "eager"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-75 group-hover:opacity-90 transition-opacity" />

              {/* Hover Zoom Icon */}
              <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs border border-neutral-200 flex items-center justify-center text-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                <ZoomIn className="w-4 h-4 text-[#C5832B]" />
              </div>

              {/* Caption Card */}
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[10px] font-mono tracking-widest text-[#DE9B42] uppercase block mb-1 font-bold">
                  {photo.category}
                </span>
                <h3 className="text-base font-bold font-montserrat text-white group-hover:text-[#DE9B42] transition-colors mb-1">
                  {photo.title}
                </h3>
                <p className="text-xs text-neutral-200 line-clamp-2">
                  {photo.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          {/* Close button */}
          <button
            onClick={() => setActivePhoto(null)}
            className="absolute top-6 right-6 p-2.5 rounded-full bg-neutral-900 border border-neutral-700 text-white hover:bg-neutral-800 transition-colors z-10"
            aria-label="Close Lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Prev Photo Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevPhoto();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-neutral-900/80 border border-neutral-700 text-white hover:bg-neutral-800 transition-colors hidden sm:flex items-center justify-center"
            aria-label="Previous Photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Next Photo Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNextPhoto();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-neutral-900/80 border border-neutral-700 text-white hover:bg-neutral-800 transition-colors hidden sm:flex items-center justify-center"
            aria-label="Next Photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Main Lightbox Content */}
          <div className="max-w-4xl w-full bg-[#0f1217] rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl flex flex-col">
            <div className="relative max-h-[70vh] bg-black flex items-center justify-center">
              <img
                src={activePhoto.image}
                alt={activePhoto.title}
                className="max-h-[70vh] w-auto object-contain mx-auto"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-6 bg-neutral-950 border-t border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#C5832B] uppercase block">
                  {activePhoto.category}
                </span>
                <h3 className="text-lg font-bold font-montserrat text-white">
                  {activePhoto.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {activePhoto.caption}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setActivePhoto(null)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
