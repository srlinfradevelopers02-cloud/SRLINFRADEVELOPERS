import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { SrlLogo } from './SrlLogo';

interface NavbarProps {
  onOpenContact: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenContact }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'HOME', href: '#home' },
    { label: 'ABOUT', href: '#about' },
    { label: 'INTERIOR PRODUCTS', href: '#interior-products' },
    { label: 'AUTOMATION', href: '#automation' },
    { label: 'PROJECTS', href: '#projects' },
    { label: 'SOLUTIONS', href: '#solutions' },
    { label: 'GALLERY', href: '#gallery' },
    { label: 'CONTACT', href: '#contact' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-sm shadow-neutral-900/5 py-3'
            : 'bg-white/85 backdrop-blur-sm py-4 sm:py-5 border-b border-neutral-200/60'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Zone 1: Official SRL Brandmark */}
            <a
              href="#home"
              className="group shrink-0 mr-8 xl:mr-10 2xl:mr-14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5832B] rounded-lg transition-transform hover:opacity-95"
              aria-label="SRL Infra Developers Home"
            >
              <SrlLogo variant="navbar" theme="light" />
            </a>

            {/* Zone 2: Navigation Links (Desktop) */}
            <nav className="hidden xl:flex flex-1 items-center justify-center gap-6 2xl:gap-8" aria-label="Main Navigation">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-xs 2xl:text-[13px] font-semibold tracking-wider text-neutral-700 hover:text-[#C5832B] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#C5832B] hover:after:w-full after:transition-all after:duration-200"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Zone 3: Actions (CTA & Staff Portal trigger) */}
            <div className="hidden sm:flex shrink-0 items-center ml-10 xl:ml-14">
              

              <button
                onClick={onOpenContact}
                className="px-4 md:px-5 py-2 text-xs md:text-sm font-bold tracking-wider font-montserrat uppercase bg-[#C5832B] hover:bg-[#A66B1E] text-white rounded transition-all duration-200 shadow-sm hover:shadow-[#C5832B]/20 flex items-center gap-2 group cursor-pointer"
              >
                <span>GET IN TOUCH</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex items-center gap-2 xl:hidden">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 text-neutral-800 hover:text-black rounded-md border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#C5832B]"
                aria-label="Open mobile menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white border-l border-neutral-200 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div>
              {/* Header with Logo and Close */}
              <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
                <SrlLogo variant="navbar" theme="light" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-neutral-500 hover:text-black rounded-lg border border-neutral-200 focus:outline-none"
                  aria-label="Close mobile menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Navigation Links */}
              <nav className="mt-6 flex flex-col space-y-2">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-semibold tracking-wider text-neutral-800 hover:text-[#C5832B] hover:bg-neutral-50 py-2.5 px-3 rounded-md transition-colors font-montserrat flex items-center justify-between group"
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#C5832B] transition-colors" />
                  </a>
                ))}
              </nav>
            </div>

            {/* Bottom Actions inside Mobile Drawer */}
            <div className="pt-6 border-t border-neutral-200 space-y-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenContact();
                }}
                className="w-full py-3 text-sm font-bold tracking-wider font-montserrat uppercase bg-[#C5832B] hover:bg-[#A66B1E] text-white rounded transition-colors text-center shadow-sm flex items-center justify-center gap-2"
              >
                <span>GET IN TOUCH</span>
                <ArrowRight className="w-4 h-4" />
              </button>

           

              <div className="pt-2 text-center text-xs text-neutral-500">
                <p>Official Contact: sales@srlinfra.in</p>
                <p className="mt-1 text-[11px] text-neutral-400">WE BUILD · WE DESIGN · WE AUTOMATE · WE ELEVATE</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
