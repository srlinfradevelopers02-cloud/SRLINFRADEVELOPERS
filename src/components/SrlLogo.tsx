import React from 'react';

interface SrlLogoProps {
  variant?: 'full' | 'navbar' | 'emblem' | 'stacked';
  theme?: 'dark' | 'light';
  className?: string;
}

export const SrlLogo: React.FC<SrlLogoProps> = ({
  variant = 'full',
  theme = 'light',
  className = '',
}) => {
  const isDark = theme === 'dark';
  const secondaryTextColor = isDark
    ? 'text-neutral-400'
    : 'text-neutral-600';

  /*
   * NAVBAR
   * Official emblem + exact supplied wordmark image.
   */
  if (variant === 'navbar') {
    return (
      <div
        className={`flex items-center gap-3 select-none ${className}`}
      >
        {/* Official SRL Logo */}
        <div className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 overflow-hidden relative flex items-center justify-center">
          <img
            src="/logo.png"
            alt="SRL Infra Developers Official Logo"
            className="w-full h-full object-contain scale-[1.35] origin-top"
          />
        </div>

        {/* Exact Official Wordmark */}
        <div className="flex items-center">
          <img
            src="/srl-wordmark.png"
            alt="SRL Infra Developers"
            className="w-[145px] sm:w-[165px] md:w-[180px] h-auto object-contain"
          />
        </div>
      </div>
    );
  }

  /*
   * EMBLEM
   */
  if (variant === 'emblem') {
    return (
      <div
        className={`inline-block select-none ${className}`}
      >
        <img
          src="/logo.png"
          alt="SRL Infra Developers Official Emblem"
          className="w-auto h-28 sm:h-36 md:h-44 object-contain mx-auto filter drop-shadow-sm rounded-xl"
        />
      </div>
    );
  }
  /*
 * STRATEGIC PARTNERS
 */
return (
  <section className={`w-full py-12 sm:py-16 ${className}`}>
    <div className="max-w-6xl mx-auto px-4 sm:px-6">

      {/* Single Heading */}
      <div className="text-center mb-8 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-neutral-900">
          Our Collaborative &amp; Strategic Partners
        </h2>

        <div className="mx-auto mt-4 h-[2px] w-16 bg-[#C5832B]" />
      </div>

      {/* Collaboration Image */}
      <div className="flex justify-center">
        <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-neutral-200/90 w-full max-w-4xl">
          <img
            src="/srlcollab.png"
            alt="SRL Infra Developers Collaborative and Strategic Partners"
            className="w-full h-auto object-contain rounded-lg"
          />
        </div>
      </div>

    </div>
  </section>
  );
};