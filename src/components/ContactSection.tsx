import React, { useState } from 'react';

import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  Clock,
} from 'lucide-react';

import { SrlLogo } from './SrlLogo';

import { supabase } from '../lib/supabase';

interface ContactSectionProps {
  initialProjectType?: string;
  initialMessage?: string;
  onSubmissionSuccess?: (enquiry: any) => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  initialProjectType = 'Interior Products',
  initialMessage = '',
  onSubmissionSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    projectType: initialProjectType || 'Interior Products',
    message: initialMessage || '',
  });

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [referenceCode, setReferenceCode] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const projectTypeOptions = [
    'Interior Products',
    'Interior Design',
    'Automation',
    'Commercial Infrastructure',
    'Government Project',
    'Restaurant',
    'Banquet Hall',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.email.trim()
    ) {
      setErrorMessage(
        'Please fill in your name, phone number, and email address.'
      );
      return;
    }

    setSubmitting(true);

    try {
      // Generate enquiry reference number
      const generatedCode = `SRL-${Math.floor(
        100000 + Math.random() * 900000
      )}`;

      /*
       * IMPORTANT:
       * The website form uses camelCase names such as projectType.
       * Supabase table uses snake_case names such as project_type.
       *
       * We map them explicitly here.
       */
      const newEnquiry = {
        reference_code: generatedCode,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        company: formData.company.trim(),
        project_type: formData.projectType,
        message: formData.message.trim(),
      };

      // Save enquiry to SRL Website Supabase database
      const { error } = await supabase
        .from('leads')
        .insert([newEnquiry]);

      if (error) {
        console.error('Supabase enquiry error:', error);
        throw error;
      }

      // Success UI
      setReferenceCode(generatedCode);
      setSubmitted(true);

      if (onSubmissionSuccess) {
        onSubmissionSuccess({
          ...newEnquiry,
          referenceCode: generatedCode,
          projectType: formData.projectType,
        });
      }
    } catch (error) {
      console.error('Error saving enquiry to Supabase:', error);

      setErrorMessage(
        'We could not register your enquiry right now. Please try again or contact us directly.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setErrorMessage('');

    setFormData({
      name: '',
      phone: '',
      email: '',
      company: '',
      projectType: 'Interior Products',
      message: '',
    });
  };

  return (
    <section
      id="contact"
      className="py-24 bg-[#F8F9FA] border-t border-neutral-200 relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-bold tracking-[0.25em] font-montserrat text-[#C5832B] uppercase mb-3 block">
            GET IN TOUCH
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-montserrat tracking-tight text-neutral-900 mb-4 uppercase">
            LET'S BUILD SOMETHING BETTER.
          </h2>

          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed text-balance">
            Tell us about your upcoming project. Our engineering and material
            specialists will respond with exact product samples, feasibility
            analysis, and tailored automation blueprints.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* Left Column */}
          <div className="lg:col-span-5 bg-white p-8 sm:p-10 rounded-3xl border border-neutral-200 shadow-sm flex flex-col justify-between">

            <div>

              {/* Brand Logo */}
              <div className="mb-8 pb-6 border-b border-neutral-200">
                <SrlLogo
                  variant="navbar"
                  theme="light"
                  className="scale-105 origin-left"
                />

                <p className="text-xs text-neutral-600 mt-3 font-sans">
                  Suvarna Rajya Laxmi Infra Developers — Premium interior
                  materials, architectural cladding, and intelligent
                  automation.
                </p>
              </div>

              {/* Direct Information */}
              <div className="space-y-6">

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FAFAFA] border border-neutral-200 flex items-center justify-center text-[#C5832B] shrink-0 mt-0.5">
                    <Mail className="w-5 h-5" />
                  </div>

                  <div>
                    <span className="text-[11px] font-mono uppercase text-neutral-500 block mb-0.5">
                      Direct Email Enquiries
                    </span>

                    <a
                      href="mailto:sales@srlinfra.in"
                      className="text-sm font-semibold text-neutral-900 hover:text-[#C5832B] transition-colors break-all"
                    >
                      sales@srlinfra.in
                    </a>
                  </div>
                </div>

                {/* Consultation Hours */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FAFAFA] border border-neutral-200 flex items-center justify-center text-[#C5832B] shrink-0 mt-0.5">
                    <Clock className="w-5 h-5" />
                  </div>

                  <div>
                    <span className="text-[11px] font-mono uppercase text-neutral-500 block mb-0.5">
                      Consultation Hours
                    </span>

                    <p className="text-sm font-semibold text-neutral-900">
                      Monday – Saturday: 10:00 AM – 7:30 PM
                    </p>

                    <p className="text-xs text-neutral-500 mt-0.5">
                      Site audits & sample inspections scheduled on demand
                    </p>
                  </div>
                </div>

                {/* Office Location */}
                <div className="mt-10 pt-8 border-t border-neutral-200">
                  <div className="flex items-start gap-4">

                    <div className="w-10 h-10 rounded-xl bg-[#FAFAFA] border border-neutral-200 flex items-center justify-center text-[#C5832B] shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>

                    <div className="flex-1">
                      <span className="text-[11px] font-mono uppercase text-neutral-500 block mb-1">
                        Office Address
                      </span>

                      <p className="text-sm font-semibold text-neutral-900 leading-relaxed">
                        H.NO: 3, 7-809, D-Mart Road,
                        <br />
                        Near SRR Signal, Vivekananda Puri,
                        <br />
                        Karimnagar, Telangana – 505001
                      </p>

                      <a
                        href="https://www.google.com/maps/search/?api=1&query=18.4538237,79.1194009"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-3 text-xs font-bold uppercase tracking-wider text-[#C5832B] hover:text-[#A66B1E] transition-colors"
                      >
                        <MapPin className="w-4 h-4" />
                        Get Directions
                      </a>
                    </div>
                  </div>

                  {/* Google Maps */}
                  <div className="mt-6 w-full h-[300px] sm:h-[380px] rounded-2xl overflow-hidden border border-neutral-200 shadow-sm bg-neutral-100">
                    <iframe
                      src="https://www.google.com/maps?q=18.4538237,79.1194009&z=17&output=embed"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="SRL Infra Developers Office Location"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Pillars */}
            <div className="mt-10 pt-6 border-t border-neutral-200 text-xs text-neutral-500">
              <span className="font-bold text-neutral-900 block mb-1">
                SRL CORE GUARANTEE:
              </span>

              <p className="text-[11px] leading-relaxed">
                WE BUILD with structural integrity · WE DESIGN with
                architectural grace · WE AUTOMATE with effortless simplicity
                · WE ELEVATE everyday spaces.
              </p>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-neutral-200 shadow-sm">

            {submitted ? (
              <div className="py-12 text-center">

                <div className="w-16 h-16 rounded-full bg-[#C5832B]/10 border border-[#C5832B] flex items-center justify-center text-[#C5832B] mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <h3 className="text-2xl font-bold font-montserrat text-neutral-900 mb-2">
                  Enquiry Received Successfully!
                </h3>

                <p className="text-sm text-neutral-600 max-w-md mx-auto mb-4">
                  Thank you,{' '}
                  <strong className="text-neutral-900">
                    {formData.name}
                  </strong>
                  . Your enquiry has been registered under reference code:
                </p>

                <div className="inline-block px-4 py-2 bg-[#FAFAFA] rounded-lg border border-[#C5832B] font-mono text-base font-bold text-[#C5832B] mb-6">
                  {referenceCode}
                </div>

                <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-8">
                  Our project engineering team will review your specifications
                  and contact you shortly via phone or email.
                </p>

                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-[#C5832B] text-white hover:text-neutral-950 rounded-lg text-xs font-bold font-montserrat uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Submit Another Enquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Name + Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider font-montserrat text-neutral-700 block mb-2">
                      Full Name *
                    </label>

                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          name: e.target.value,
                        })
                      }
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full px-4 py-3 bg-[#FAFAFA] border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#C5832B] focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider font-montserrat text-neutral-700 block mb-2">
                      Phone Number *
                    </label>

                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: e.target.value,
                        })
                      }
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-4 py-3 bg-[#FAFAFA] border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#C5832B] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Email + Company */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider font-montserrat text-neutral-700 block mb-2">
                      Email Address *
                    </label>

                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          email: e.target.value,
                        })
                      }
                      placeholder="e.g. rajesh@company.com"
                      className="w-full px-4 py-3 bg-[#FAFAFA] border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#C5832B] focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider font-montserrat text-neutral-700 block mb-2">
                      Company / Organization (Optional)
                    </label>

                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company: e.target.value,
                        })
                      }
                      placeholder="e.g. Architectural Firm / Hotel"
                      className="w-full px-4 py-3 bg-[#FAFAFA] border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#C5832B] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Project Type */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider font-montserrat text-neutral-700 block mb-2">
                    Project Typology *
                  </label>

                  <select
                    value={formData.projectType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        projectType: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-[#FAFAFA] border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-[#C5832B] focus:bg-white transition-colors"
                  >
                    {projectTypeOptions.map((opt) => (
                      <option
                        key={opt}
                        value={opt}
                        className="bg-white text-neutral-900"
                      >
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider font-montserrat text-neutral-700 block mb-2">
                    Project Scope & Requirements
                  </label>

                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        message: e.target.value,
                      })
                    }
                    placeholder="Describe your site location, approximate square footage, desired interior finishes, or required smart automation features..."
                    className="w-full px-4 py-3 bg-[#FAFAFA] border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#C5832B] focus:bg-white transition-colors resize-none"
                  />
                </div>

                {/* Error */}
                {errorMessage && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-200">
                    {errorMessage}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[#C5832B] hover:bg-[#DE9B42] text-neutral-950 font-bold font-montserrat uppercase tracking-wider text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? (
                    <span>Registering Enquiry...</span>
                  ) : (
                    <>
                      <span>SEND ENQUIRY</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-neutral-500 text-center">
                  Your information is handled strictly for project quotations
                  and engineering consultations.
                </p>

              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};