import React, { useState } from 'react';

import { Routes, Route } from 'react-router-dom';

// =========================================================
// CRM PAGES
// =========================================================

import Login from './pages/portal/login';
import Dashboard from './pages/portal/Dashboard';
import Leads from './pages/portal/Leads';
import Clients from './pages/portal/Clients';
import Quotations from './pages/portal/Quotations';
import Invoices from './pages/portal/Invoices';
import Projects from './pages/portal/Projects';
import Tasks from './pages/portal/Tasks';
import Staff from './pages/portal/Staff';

// =========================================================
// PUBLIC WEBSITE COMPONENTS
// =========================================================

import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { OfficialBrandIdentity } from './components/OfficialBrandIdentity';
import { BusinessIntro } from './components/BusinessIntro';
import { InteriorProductsSection } from './components/InteriorProductsSection';
import { AutomationSection } from './components/AutomationSection';
import { ElevatorSection } from './components/ElevatorSection';
import { SolutionsSection } from './components/SolutionsSection';
import { WhyChooseUs } from './components/WhyChooseUs';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { AdminEnquiryModal } from './components/AdminEnquiryModal';

// =========================================================
// DATA TYPES
// =========================================================

import { InteriorProduct } from './data/interiorProducts';
import { ProjectItem } from './data/projectsAndSolutions';

// =========================================================
// PUBLIC SRL INFRA WEBSITE
// =========================================================

function PublicWebsite() {
  // =======================================================
  // PRODUCT / PROJECT MODALS
  // =======================================================

  const [selectedProduct, setSelectedProduct] =
    useState<InteriorProduct | null>(null);

  const [selectedProject, setSelectedProject] =
    useState<ProjectItem | null>(null);

  const [isAdminModalOpen, setIsAdminModalOpen] =
    useState<boolean>(false);

  // =======================================================
  // CONTACT FORM PRE-FILL STATE
  // =======================================================

  const [contactProjectType, setContactProjectType] =
    useState<string>('Interior Products');

  const [contactInitialMessage, setContactInitialMessage] =
    useState<string>('');

  // =======================================================
  // SCROLL TO SECTION
  // =======================================================

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
      });
    }
  };

  // =======================================================
  // INTERIOR PRODUCT ENQUIRY
  // =======================================================

  const handleRequestQuoteForProduct = (
    productName: string
  ) => {
    setContactProjectType('Interior Products');

    setContactInitialMessage(
      `I would like to request product pricing, samples, and technical specifications for ${productName}.`
    );

    scrollToSection('contact');
  };

  // =======================================================
  // AUTOMATION ENQUIRY
  // =======================================================

  const handleRequestAutomationQuote = (
    solutionName: string
  ) => {
    setContactProjectType('Automation');

    setContactInitialMessage(
      `I am interested in consulting with SRL Infra Developers regarding ${solutionName} for my property.`
    );

    scrollToSection('contact');
  };

  // =======================================================
  // SPACE / SOLUTION ENQUIRY
  // =======================================================

  const handleSelectSpaceSolution = (
    spaceTitle: string
  ) => {
    setContactProjectType(
      spaceTitle.includes('Restaurant')
        ? 'Restaurant'
        : spaceTitle.includes('Banquet')
        ? 'Banquet Hall'
        : spaceTitle.includes('Government')
        ? 'Government Project'
        : 'Interior Design'
    );

    setContactInitialMessage(
      `I am planning a ${spaceTitle} project and would like to explore turnkey interior materials and smart automation solutions.`
    );

    scrollToSection('contact');
  };

  // =======================================================
  // PROJECT ENQUIRY
  // =======================================================

  const handleEnquireProjectScope = (
    projectName: string
  ) => {
    setContactProjectType('Commercial Infrastructure');

    setContactInitialMessage(
      `We have an upcoming project with requirements similar to "${projectName}". Please share feasibility and execution parameters.`
    );

    scrollToSection('contact');
  };

  // =======================================================
  // PUBLIC WEBSITE UI
  // =======================================================

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-neutral-900 flex flex-col font-sans selection:bg-[#C5832B] selection:text-white">

      {/* ===================================================
          NAVBAR
          =================================================== */}

      <Navbar
        onOpenContact={() =>
          scrollToSection('contact')
        }
      />

      {/* ===================================================
          MAIN WEBSITE CONTENT
          =================================================== */}

      <main className="flex-1">

        {/* =================================================
            HERO
            ================================================= */}

        <Hero
          onExploreSolutions={() =>
            scrollToSection('interior-products')
          }
          onTalkToTeam={() =>
            scrollToSection('contact')
          }
        />

        {/* =================================================
            OFFICIAL BRAND IDENTITY
            ================================================= */}

        <OfficialBrandIdentity />

        {/* =================================================
            BUSINESS INTRODUCTION
            ================================================= */}

        <BusinessIntro />

        {/* =================================================
            DIVISION 01
            INTERIOR DESIGN PRODUCTS
            ================================================= */}

        <InteriorProductsSection
          onSelectProduct={(product) =>
            setSelectedProduct(product)
          }
          onRequestQuoteForProduct={
            handleRequestQuoteForProduct
          }
        />

        {/* =================================================
            DIVISION 02
            SMART AUTOMATION
            ================================================= */}

        <AutomationSection
          onRequestAutomationQuote={
            handleRequestAutomationQuote
          }
        />

        {/* =================================================
            ELEVATORS
            ================================================= */}

        <ElevatorSection
          onRequestQuote={(elevatorName) =>
            handleRequestAutomationQuote(
              elevatorName
            )
          }
        />

        {/* =================================================
            SOLUTIONS FOR EVERY SPACE
            ================================================= */}

        <SolutionsSection
          onSelectSpaceSolution={
            handleSelectSpaceSolution
          }
        />

        {/* =================================================
            WHY CHOOSE US
            ================================================= */}

        <WhyChooseUs />

        {/* =================================================
            CONTACT
            ================================================= */}

        <ContactSection
          key={`${contactProjectType}-${contactInitialMessage}`}
          initialProjectType={contactProjectType}
          initialMessage={contactInitialMessage}
        />

      </main>

      {/* ===================================================
          FOOTER
          =================================================== */}

      <Footer
        onOpenAdmin={() =>
          setIsAdminModalOpen(true)
        }
      />

      {/* ===================================================
          PRODUCT DETAIL MODAL
          =================================================== */}

      <ProductDetailModal
        product={selectedProduct}
        onClose={() =>
          setSelectedProduct(null)
        }
        onRequestQuote={
          handleRequestQuoteForProduct
        }
      />

      {/* ===================================================
          PROJECT DETAIL MODAL
          =================================================== */}

      <ProjectDetailModal
        project={selectedProject}
        onClose={() =>
          setSelectedProject(null)
        }
        onEnquireProject={
          handleEnquireProjectScope
        }
      />

      {/* ===================================================
          ADMIN ENQUIRY MODAL
          =================================================== */}

      <AdminEnquiryModal
        isOpen={isAdminModalOpen}
        onClose={() =>
          setIsAdminModalOpen(false)
        }
      />

    </div>
  );
}

// =========================================================
// APPLICATION ROUTES
// =========================================================

export default function App() {
  return (
    <Routes>

      {/* =================================================
          PUBLIC WEBSITE
          ================================================= */}

      <Route
        path="/"
        element={<PublicWebsite />}
      />

      {/* =================================================
          CRM LOGIN
          ================================================= */}

      <Route
        path="/portal/login"
        element={<Login />}
      />

      {/* =================================================
          CRM DASHBOARD
          ================================================= */}

      <Route
        path="/portal"
        element={<Dashboard />}
      />

      {/* =================================================
          CRM LEADS
          ================================================= */}

      <Route
        path="/portal/leads"
        element={<Leads />}
      />
      <Route path="/portal/clients" element={<Clients />} />
      <Route path="/portal/quotations" element={<Quotations />} />
      <Route path="/portal/invoices" element={<Invoices />} />
      <Route path="/portal/projects" element={<Projects />} />
      <Route path="/portal/tasks" element={<Tasks />} />
      <Route path="/portal/staff" element={<Staff />} />

      {/* =================================================
          FALLBACK
          ================================================= */}

      <Route
        path="*"
        element={<PublicWebsite />}
      />

    </Routes>
  );
}