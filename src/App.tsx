import React, {
  useEffect,
  useState,
} from 'react';

import {
  Navigate,
  Routes,
  Route,
} from 'react-router-dom';

import { supabase } from './lib/supabase';

import Login from './pages/portal/login';
import Dashboard from './pages/portal/Dashboard';
import Leads from './pages/portal/Leads';
import Clients from './pages/portal/Clients';
import Quotations from './pages/portal/Quotations';
import Invoices from './pages/portal/Invoices';
import Projects from './pages/portal/Projects';
import Tasks from './pages/portal/Tasks';
import Inventory from './pages/portal/Inventory';
import ProjectMaterials from './pages/portal/ProjectMaterials';
import Purchasing from './pages/portal/Purchasing';
import Staff from './pages/portal/Staff';

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

import { InteriorProduct } from './data/interiorProducts';
import { ProjectItem } from './data/projectsAndSolutions';

function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const {
        data,
        error,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error(
          'Session check failed:',
          error
        );

        setAuthenticated(false);
      } else {
        setAuthenticated(
          Boolean(data.session?.user)
        );
      }

      setChecking(false);
    };

    checkSession();

    const {
      data: listener,
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        setAuthenticated(
          Boolean(session?.user)
        );

        setChecking(false);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="rounded-xl bg-white px-8 py-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/portal/login"
        replace
      />
    );
  }

  return <>{children}</>;
}

function PublicWebsite() {
  const [selectedProduct, setSelectedProduct] =
    useState<InteriorProduct | null>(null);

  const [selectedProject, setSelectedProject] =
    useState<ProjectItem | null>(null);

  const [isAdminModalOpen, setIsAdminModalOpen] =
    useState(false);

  const [contactProjectType, setContactProjectType] =
    useState('Interior Products');

  const [contactInitialMessage, setContactInitialMessage] =
    useState('');

  const scrollToSection = (
    sectionId: string
  ) => {
    const element =
      document.getElementById(sectionId);

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
      });
    }
  };

  const handleRequestQuoteForProduct = (
    productName: string
  ) => {
    setContactProjectType(
      'Interior Products'
    );

    setContactInitialMessage(
      `I would like to request product pricing, samples, and technical specifications for ${productName}.`
    );

    scrollToSection('contact');
  };

  const handleRequestAutomationQuote = (
    solutionName: string
  ) => {
    setContactProjectType(
      'Automation'
    );

    setContactInitialMessage(
      `I am interested in consulting with SRL Infra Developers regarding ${solutionName} for my property.`
    );

    scrollToSection('contact');
  };

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

  const handleEnquireProjectScope = (
    projectName: string
  ) => {
    setContactProjectType(
      'Commercial Infrastructure'
    );

    setContactInitialMessage(
      `We have an upcoming project with requirements similar to "${projectName}". Please share feasibility and execution parameters.`
    );

    scrollToSection('contact');
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-neutral-900 flex flex-col font-sans selection:bg-[#C5832B] selection:text-white">

      <Navbar
        onOpenContact={() =>
          scrollToSection('contact')
        }
      />

      <main className="flex-1">

        <Hero
          onExploreSolutions={() =>
            scrollToSection(
              'interior-products'
            )
          }
          onTalkToTeam={() =>
            scrollToSection('contact')
          }
        />

        <OfficialBrandIdentity />

        <BusinessIntro />

        <InteriorProductsSection
          onSelectProduct={(product) =>
            setSelectedProduct(product)
          }
          onRequestQuoteForProduct={
            handleRequestQuoteForProduct
          }
        />

        <AutomationSection
          onRequestAutomationQuote={
            handleRequestAutomationQuote
          }
        />

        <ElevatorSection
          onRequestQuote={(elevatorName) =>
            handleRequestAutomationQuote(
              elevatorName
            )
          }
        />

        <SolutionsSection
          onSelectSpaceSolution={
            handleSelectSpaceSolution
          }
        />

        <WhyChooseUs />

        <ContactSection
          key={`${contactProjectType}-${contactInitialMessage}`}
          initialProjectType={
            contactProjectType
          }
          initialMessage={
            contactInitialMessage
          }
        />

      </main>

      <Footer
        onOpenAdmin={() =>
          setIsAdminModalOpen(true)
        }
      />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() =>
          setSelectedProduct(null)
        }
        onRequestQuote={
          handleRequestQuoteForProduct
        }
      />

      <ProjectDetailModal
        project={selectedProject}
        onClose={() =>
          setSelectedProject(null)
        }
        onEnquireProject={
          handleEnquireProjectScope
        }
      />

      <AdminEnquiryModal
        isOpen={isAdminModalOpen}
        onClose={() =>
          setIsAdminModalOpen(false)
        }
      />

    </div>
  );
}

function ProtectedCRM({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>

      <Route
        path="/"
        element={<PublicWebsite />}
      />

      <Route
        path="/portal/login"
        element={<Login />}
      />

      <Route
        path="/portal"
        element={
          <ProtectedCRM>
            <Dashboard />
          </ProtectedCRM>
        }
      />

      <Route
        path="/portal/leads"
        element={
          <ProtectedCRM>
            <Leads />
          </ProtectedCRM>
        }
      />

      <Route
        path="/portal/clients"
        element={
          <ProtectedCRM>
            <Clients />
          </ProtectedCRM>
        }
      />

      <Route
        path="/portal/quotations"
        element={
          <ProtectedCRM>
            <Quotations />
          </ProtectedCRM>
        }
      />

      <Route
        path="/portal/invoices"
        element={
          <ProtectedCRM>
            <Invoices />
          </ProtectedCRM>
        }
      />

      <Route
        path="/portal/projects"
        element={
          <ProtectedCRM>
            <Projects />
          </ProtectedCRM>
        }
      />

      <Route
        path="/portal/tasks"
        element={
          <ProtectedCRM>
            <Tasks />
          </ProtectedCRM>
        }
      />
      <Route
        path="/portal/inventory"
        element={
          <ProtectedCRM>
            <Inventory />
          </ProtectedCRM>
        }
      />
      <Route
        path="/portal/project-materials"
        element={
          <ProtectedCRM>
            <ProjectMaterials />
          </ProtectedCRM>
        }
      />
      <Route
        path="/portal/purchasing"
        element={
          <ProtectedCRM>
            <Purchasing />
          </ProtectedCRM>
        }
      />
      

      <Route
        path="/portal/staff"
        element={
          <ProtectedCRM>
            <Staff />
          </ProtectedCRM>
        }
      />

      <Route
        path="*"
        element={<PublicWebsite />}
      />

    </Routes>
  );
}