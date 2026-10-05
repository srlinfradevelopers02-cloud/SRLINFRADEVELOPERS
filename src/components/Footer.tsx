import React from 'react';
import { ArrowUp } from 'lucide-react';

import {
  FaWhatsapp,
  FaInstagram,
  FaYoutube,
  FaLinkedinIn,
  FaFacebookF,
} from 'react-icons/fa';

import { FaXTwitter } from 'react-icons/fa6';

interface FooterProps {
  onOpenAdmin: () => void;
}

/* X / Twitter icon */
const XIcon = ({ className = '' }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817-5.963 6.817H1.684l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
};

/* Social media links */
const socialLinks = [
  {
    name: 'WhatsApp',
    href: 'https://wa.me/919618414664',
    icon: FaWhatsapp,
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/srl.infra.developers',
    icon: FaInstagram,
  },
  {
    name: 'YouTube',
    href: 'https://www.youtube.com/@SRLINFRADEVELOPERS',
    icon: FaYoutube,
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/company/YOUR_COMPANY',
    icon: FaLinkedinIn,
  },
  {
    name: 'X',
    href: 'https://x.com/SRLINFRA',
    icon: FaXTwitter,
  },
   {
    name: 'Facebook Messenger',
    href: 'https://www.facebook.com/SRLInfraDevelopers',
    icon: FaFacebookF,
  },
];

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <footer className="bg-white border-t border-neutral-200 text-neutral-600 pt-20 pb-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* =====================================================
            TOP: SRL BRAND
        ====================================================== */}
        <div className="flex flex-col items-center justify-center pb-16 border-b border-neutral-200 text-center">

          <div className="w-full max-w-xl mx-auto">
            <img
              src="/logo.png"
              alt="SRL Infra Developers"
              className="w-full max-w-md mx-auto h-auto object-contain"
            />
          </div>

          <p className="text-xs sm:text-sm text-neutral-600 max-w-xl mx-auto mt-4 leading-relaxed font-sans">
            A premium infrastructure, interior solutions, and smart automation
            company. Engineering majestic spaces with effortless technology.
          </p>

        </div>

        {/* =====================================================
            NAVIGATION GRID
        ====================================================== */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-16 border-b border-neutral-200 text-xs">

          {/* =================================================
              COL 1: INTERIOR PRODUCTS
          ================================================= */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider font-montserrat text-neutral-900 mb-4">
              Interior Products
            </h4>

            <ul className="space-y-2">

              <li>
                <a
                  href="#interior-products"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  Polygranite Sheets
                </a>
              </li>

              <li>
                <a
                  href="#interior-products"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  WPC Fluted Panels
                </a>
              </li>

              <li>
                <a
                  href="#interior-products"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  SPC Luxury Flooring
                </a>
              </li>

              <li>
                <a
                  href="#interior-products"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  PU 3D Stone Panels
                </a>
              </li>

              <li>
                <a
                  href="#interior-products"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  Bamboo Charcoal Boards
                </a>
              </li>

              <li>
                <a
                  href="#interior-products"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  Stone Coated Roofing
                </a>
              </li>

              <li>
                <a
                  href="#interior-products"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  Aluminium Trims
                </a>
              </li>

            </ul>
          </div>

          {/* =================================================
              COL 2: SMART AUTOMATION
          ================================================= */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider font-montserrat text-neutral-900 mb-4">
              Smart Automation
            </h4>

            <ul className="space-y-2">

              <li>
                <a
                  href="#automation"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  Biometric Smart Doors
                </a>
              </li>

              <li>
                <a
                  href="#automation"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  Presence-Aware Lighting
                </a>
              </li>

              <li>
                <a
                  href="#automation"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  CCTV & Access Control
                </a>
              </li>

              <li>
                <a
                  href="#automation"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  Smart Elevators
                </a>
              </li>

              <li>
                <a
                  href="#automation"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  Motorized Curtains
                </a>
              </li>

              <li>
                <a
                  href="#automation"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  Air Quality & Climate
                </a>
              </li>

              <li>
                <a
                  href="#automation"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  Commercial Automation
                </a>
              </li>

            </ul>
          </div>

          {/* =================================================
              COL 3: SPACES & SECTORS
          ================================================= */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider font-montserrat text-neutral-900 mb-4">
              Spaces & Sectors
            </h4>

            <ul className="space-y-2">

              <li>
                <a
                  href="#solutions"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  Luxury Residences
                </a>
              </li>

              <li>
                <a
                  href="#solutions"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  Corporate Offices
                </a>
              </li>

              <li>
                <a
                  href="#solutions"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  Restaurants & Lounges
                </a>
              </li>

              <li>
                <a
                  href="#solutions"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  Grand Banquet Halls
                </a>
              </li>

              <li>
                <a
                  href="#solutions"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  Government Complexes
                </a>
              </li>

              <li>
                <a
                  href="#solutions"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  Commercial Buildings
                </a>
              </li>

              <li>
                <a
                  href="#solutions"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  Retail Showrooms
                </a>
              </li>

            </ul>
          </div>

          {/* =================================================
              COL 4: COMPANY
          ================================================= */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider font-montserrat text-neutral-900 mb-4">
              Company
            </h4>

            <ul className="space-y-2">

              <li>
                <a
                  href="#home"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  Home
                </a>
              </li>

              <li>
                <a
                  href="#brand-identity"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  Brand Identity
                </a>
              </li>

              <li>
                <a
                  href="#about"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  About SRL Infra
                </a>
              </li>

              <li>
                <a
                  href="#contact"
                  className="hover:text-[#C5832B] transition-colors"
                >
                  Consultation
                </a>
              </li>

              <li>
                <button
                  onClick={onOpenAdmin}
                  className="hover:text-[#C5832B] transition-colors text-left cursor-pointer"
                >
                  Staff Portal
                </button>
              </li>

            </ul>
          </div>

          {/* =================================================
              COL 5: DIRECT CONTACT
          ================================================= */}
          <div className="col-span-2 md:col-span-1">

            <h4 className="text-xs font-bold uppercase tracking-wider font-montserrat text-neutral-900 mb-4">
              Direct Contact
            </h4>

            <div className="space-y-3">

              <p className="text-xs text-neutral-700">
                Official Email:

                <a
                  href="mailto:sales@srlinfra.in"
                  className="block text-[#C5832B] font-semibold mt-0.5 hover:underline break-all"
                >
                sales@srlinfra.in 
                </a>
              </p>

              <p className="text-xs text-neutral-500">
                Hours: Mon – Sat 9:00 AM – 7:30 PM
              </p>

              <p className="text-xs text-neutral-500">
                Nationwide product supply and on-site project automation
                execution.
              </p>

            </div>

          </div>

        </div>

        {/* =====================================================
            SOCIAL MEDIA
        ====================================================== */}
        <div className="py-10 border-b border-neutral-200">

          <div className="flex flex-col items-center text-center">

            <h4 className="text-xs font-bold uppercase tracking-[0.18em] font-montserrat text-neutral-900 mb-5">
              Connect With SRL Infra Developers
            </h4>

            <div className="flex items-center justify-center gap-3">

              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit SRL Infra Developers on ${social.name}`}
                    title={social.name}
                    className="group flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 transition-all duration-300 hover:border-[#C5832B] hover:bg-[#C5832B] hover:text-white hover:-translate-y-1"
                  >
                    <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  </a>
                );
              })}

            </div>

          </div>

        </div>

        {/* =====================================================
            BOTTOM BAR
        ====================================================== */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">

          <div>

            <p>
              © {new Date().getFullYear()}{' '}
              <strong className="text-neutral-900 font-semibold">
                SRL INFRA DEVELOPERS
              </strong>
              . All rights reserved.
            </p>

            <p className="text-[11px] text-neutral-500 mt-1 font-mono">
              SUVARNA · RAJYA · LAXMI | WE BUILD · WE DESIGN · WE AUTOMATE · WE
              ELEVATE
            </p>

          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FAFAFA] border border-neutral-200 text-neutral-700 hover:text-neutral-900 hover:border-[#C5832B] transition-colors cursor-pointer"
            aria-label="Back to top"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5 text-[#C5832B]" />
          </button>

        </div>

      </div>
    </footer>
  );
};