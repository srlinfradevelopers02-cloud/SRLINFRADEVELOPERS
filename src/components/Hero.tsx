import React, { useEffect, useRef } from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { SrlLogo } from './SrlLogo';

interface HeroProps {
  onExploreSolutions: () => void;
  onTalkToTeam: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreSolutions,
  onTalkToTeam,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    const startVideo = async () => {
      try {
        await video.play();
        console.log('SRL Hero video is playing');
      } catch (error) {
        console.error('SRL Hero video autoplay failed:', error);
      }
    };

    startVideo();
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center pt-24 pb-16"
    >
      {/* =========================================================
          VIDEO BACKGROUND
          ========================================================= */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">

        <video
          ref={videoRef}
          src="/hero-video.mp4"
          className="absolute inset-0 z-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 z-10 bg-black/30 pointer-events-none" />

        {/* Bottom cinematic gradient */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none" />

        {/* Gold atmosphere */}
        <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(197,131,43,0.12),transparent_65%)] pointer-events-none" />
      </div>

      {/* =========================================================
          HERO CONTENT
          ========================================================= */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12 md:py-16">

        {/* SRL Emblem */}
        <div className="flex justify-center mb-6">
          <SrlLogo
            variant="emblem"
            theme="light"
            className="h-20 sm:h-24 md:h-28 drop-shadow-2xl"
          />
        </div>

        {/* Company Name */}
        <div className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full border border-white/30 bg-black/35 backdrop-blur-md shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#C5832B] animate-pulse" />

          <span className="text-xs md:text-sm font-bold tracking-widest uppercase font-montserrat text-white">
            SRL INFRA DEVELOPERS
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight font-montserrat uppercase text-white max-w-5xl mx-auto leading-[1.12] mb-6 drop-shadow-2xl">

          <span className="inline-block hover:text-[#C5832B] transition-colors">
            WE BUILD.
          </span>{' '}

          <span className="inline-block hover:text-[#C5832B] transition-colors">
            WE DESIGN.
          </span>{' '}

          <br className="hidden sm:inline" />

          <span className="inline-block text-[#C5832B] drop-shadow-lg">
            WE AUTOMATE.
          </span>{' '}

          <span className="inline-block hover:text-[#C5832B] transition-colors">
            WE ELEVATE.
          </span>
        </h1>

        {/* Supporting Text */}
        <p className="text-base sm:text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-10 drop-shadow-xl">
          Creating premium spaces through interior solutions,
          infrastructure, and intelligent automation.
        </p>

        {/* Core Divisions */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-white/90 font-semibold mb-12">

          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C5832B]" />
            INTERIOR PRODUCTS
          </span>

          <span className="text-white/40 hidden sm:inline">
            |
          </span>

          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C5832B]" />
            INFRASTRUCTURE
          </span>

          <span className="text-white/40 hidden sm:inline">
            |
          </span>

          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C5832B]" />
            SMART AUTOMATION
          </span>

        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">

          <button
            onClick={onExploreSolutions}
            className="w-full sm:w-auto px-8 py-4 bg-[#C5832B] hover:bg-[#A66B1E] text-white font-bold font-montserrat uppercase tracking-wider text-sm rounded transition-all duration-200 shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>EXPLORE OUR SOLUTIONS</span>

            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={onTalkToTeam}
            className="w-full sm:w-auto px-8 py-4 bg-white/95 hover:bg-white text-neutral-900 font-semibold font-montserrat uppercase tracking-wider text-sm rounded border border-white/50 transition-all duration-200 shadow-xl cursor-pointer backdrop-blur-sm"
          >
            TALK TO OUR TEAM
          </button>

        </div>

        {/* Four Pillars */}
        <div className="mt-16 sm:mt-20 pt-8 border-t border-white/25 max-w-4xl mx-auto">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-left">

            <div className="p-4 rounded-xl border border-white/20 bg-black/35 backdrop-blur-md shadow-lg">
              <span className="text-[11px] font-mono text-[#C5832B] font-bold tracking-wider block mb-1">
                01 / BUILD
              </span>
              <h4 className="text-sm font-bold font-montserrat text-white">
                Physical Quality
              </h4>
              <p className="text-xs text-white/75 mt-1 leading-snug">
                Precision materials that withstand decades of use.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-white/20 bg-black/35 backdrop-blur-md shadow-lg">
              <span className="text-[11px] font-mono text-[#C5832B] font-bold tracking-wider block mb-1">
                02 / DESIGN
              </span>
              <h4 className="text-sm font-bold font-montserrat text-white">
                Aesthetic Depth
              </h4>
              <p className="text-xs text-white/75 mt-1 leading-snug">
                Fluted panels and marble textures for instant luxury.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-white/20 bg-black/35 backdrop-blur-md shadow-lg">
              <span className="text-[11px] font-mono text-[#C5832B] font-bold tracking-wider block mb-1">
                03 / AUTOMATE
              </span>
              <h4 className="text-sm font-bold font-montserrat text-white">
                Smart Technology
              </h4>
              <p className="text-xs text-white/75 mt-1 leading-snug">
                Touchless biometric doors and sensor-driven lighting.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-white/20 bg-black/35 backdrop-blur-md shadow-lg">
              <span className="text-[11px] font-mono text-[#C5832B] font-bold tracking-wider block mb-1">
                04 / ELEVATE
              </span>
              <h4 className="text-sm font-bold font-montserrat text-white">
                Modern Comfort
              </h4>
              <p className="text-xs text-white/75 mt-1 leading-snug">
                Effortless living and working environments.
              </p>
            </div>

          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-10 flex justify-center">
          <a
            href="#brand-identity"
            className="text-white/70 hover:text-[#C5832B] transition-colors p-2 animate-bounce"
            aria-label="Scroll to Official Brand Identity"
          >
            <ArrowDown className="w-5 h-5" />
          </a>
        </div>

      </div>
    </section>
  );
};