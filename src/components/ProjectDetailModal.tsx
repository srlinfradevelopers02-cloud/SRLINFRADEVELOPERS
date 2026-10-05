import React from 'react';
import { X, MapPin, CheckCircle2, ArrowRight, Layers } from 'lucide-react';
import { ProjectItem } from '../data/projectsAndSolutions';

interface ProjectDetailModalProps {
  project: ProjectItem | null;
  onClose: () => void;
  onEnquireProject: (projectName: string) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
  onEnquireProject,
}) => {
  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
        <div className="relative transform overflow-hidden rounded-2xl bg-[#0f1217] border border-neutral-800 text-left shadow-2xl transition-all sm:my-8 w-full max-w-3xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-neutral-400 hover:text-white bg-neutral-900/80 rounded-full border border-neutral-700 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Project Image Banner */}
          <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-neutral-950">
            <img
              src={project.image}
              alt={project.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1217] via-[#0f1217]/50 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6">
              <span className="text-[11px] font-bold uppercase tracking-wider font-montserrat text-[#C5832B] block mb-1">
                {project.category}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-montserrat text-white">
                {project.name}
              </h3>
              <p className="text-xs text-neutral-300 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#C5832B]" />
                {project.location}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase font-mono tracking-widest text-[#C5832B] mb-2">
                Project Overview
              </h4>
              <p className="text-sm sm:text-base text-neutral-200 leading-relaxed bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
                {project.description}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase font-mono tracking-widest text-[#C5832B] mb-3">
                Integrated Solutions Implemented
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {project.solutionsProvided.map((sol, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-3 rounded-lg bg-neutral-950/80 border border-neutral-800 text-xs sm:text-sm text-neutral-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#C5832B] shrink-0" />
                    <span>{sol}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg border border-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
              >
                Close
              </button>

              <button
                onClick={() => {
                  onClose();
                  onEnquireProject(project.name);
                }}
                className="px-6 py-2.5 rounded-lg bg-[#C5832B] hover:bg-[#DE9B42] text-neutral-950 text-xs font-bold uppercase tracking-wider font-montserrat flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Request Similar Project Scope</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
