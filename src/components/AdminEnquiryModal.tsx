import React, { useState, useEffect } from 'react';
import { X, Lock, CheckCircle2, Search, Filter, ShieldCheck, Mail, Phone, Calendar, ArrowRight } from 'lucide-react';
import { SrlLogo } from './SrlLogo';

interface AdminEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface EnquiryRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  company?: string;
  projectType: string;
  message: string;
  status: 'NEW' | 'CONTACTED' | 'NEGOTIATING' | 'DEAL CLOSED' | 'COMPLETED';
  createdAt: string;
}

export const AdminEnquiryModal: React.FC<AdminEnquiryModalProps> = ({ isOpen, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Initial seed demo enquiries if none exist in localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('srl_enquiries');
      if (stored) {
        setEnquiries(JSON.parse(stored));
      } else {
        const seedEnquiries: EnquiryRecord[] = [
          {
            id: 'SRL-847291',
            name: 'Ananya Sharma',
            phone: '+91 98450 12345',
            email: 'ananya.arch@studio7.com',
            company: 'Studio 7 Architecture',
            projectType: 'Restaurant',
            message: 'Looking for acoustic WPC fluted panels and smart mood lighting dimming for an upscale dining lounge in Banjara Hills.',
            status: 'NEW',
            createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          },
          {
            id: 'SRL-629143',
            name: 'Vikramaditya Rao',
            phone: '+91 97000 88219',
            email: 'v.rao@grandpavilion.in',
            company: 'Grand Pavilion Banquets',
            projectType: 'Banquet Hall',
            message: 'Need 12,000 sq ft heavy traffic SPC flooring and motorized stage curtains with DMX scene control.',
            status: 'CONTACTED',
            createdAt: new Date(Date.now() - 3600000 * 26).toISOString(),
          },
          {
            id: 'SRL-512098',
            name: 'Pradeep Mehra',
            phone: '+91 98110 54321',
            email: 'pmehra@civicworks.gov.in',
            company: 'District Administration',
            projectType: 'Government Project',
            message: 'Feasibility query for biometric attendance turnstiles and fire-retardant wall paneling for official secretariat.',
            status: 'NEGOTIATING',
            createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
          },
        ];
        localStorage.setItem('srl_enquiries', JSON.stringify(seedEnquiries));
        setEnquiries(seedEnquiries);
      }
    } catch (e) {
      console.error(e);
    }
  }, [isOpen]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default staff access PIN: 'srl2026' or 'admin'
    if (passcode.toLowerCase() === 'srl2026' || passcode.toLowerCase() === 'admin' || passcode === '1234') {
      setIsAuthenticated(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Invalid staff passcode. (Hint: Use default "srl2026")');
    }
  };

  const handleStatusChange = (
    id: string,
    newStatus: EnquiryRecord['status']
  ) => {
    const updated = enquiries.map((item) =>
      item.id === id ? { ...item, status: newStatus } : item
    );
    setEnquiries(updated);
    try {
      localStorage.setItem('srl_enquiries', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEnquiries = enquiries.filter((item) => {
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.projectType.toLowerCase().includes(q) ||
        (item.company && item.company.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getStatusColor = (status: EnquiryRecord['status']) => {
    switch (status) {
      case 'NEW':
        return 'text-amber-400 bg-amber-950/60 border-amber-800';
      case 'CONTACTED':
        return 'text-sky-400 bg-sky-950/60 border-sky-800';
      case 'NEGOTIATING':
        return 'text-purple-400 bg-purple-950/60 border-purple-800';
      case 'DEAL CLOSED':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
      case 'COMPLETED':
        return 'text-neutral-400 bg-neutral-900 border-neutral-700';
      default:
        return 'text-neutral-300 bg-neutral-800 border-neutral-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
        <div className="relative transform overflow-hidden rounded-2xl bg-[#0d1015] border border-neutral-800 text-left shadow-2xl transition-all sm:my-8 w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-6 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#C5832B]/10 border border-[#C5832B]/30 flex items-center justify-center text-[#C5832B]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-montserrat text-white flex items-center gap-2">
                  <span>SRL INFRA DEVELOPERS · STAFF CONSOLE</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-[#C5832B]">INTERNAL</span>
                </h3>
                <p className="text-xs text-neutral-400">Lead management & customer enquiry desk</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-lg border border-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {!isAuthenticated ? (
              /* Authentication Form */
              <div className="max-w-sm mx-auto py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[#C5832B] mx-auto mb-4">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold font-montserrat text-white mb-1">
                  Staff Authentication
                </h4>
                <p className="text-xs text-neutral-400 mb-6">
                  Please enter the staff security passcode to view customer leads and quotation requests.
                </p>

                <form onSubmit={handleLogin} className="space-y-4 text-left">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Staff Passcode
                    </label>
                    <input
                      type="password"
                      autoFocus
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Enter passcode (e.g. srl2026)"
                      className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#C5832B]"
                    />
                  </div>

                  {errorMsg && (
                    <p className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#C5832B] hover:bg-[#DE9B42] text-neutral-950 text-xs font-bold uppercase tracking-wider font-montserrat rounded-xl transition-colors cursor-pointer"
                  >
                    Authenticate
                  </button>
                  <p className="text-[11px] text-neutral-500 text-center">
                    Authorized team members only. Default demo pin: <code className="text-[#C5832B]">srl2026</code>
                  </p>
                </form>
              </div>
            ) : (
              /* Enquiries Dashboard */
              <div>
                {/* Search & Status Filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-800">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, ref, email..."
                      className="w-full pl-9 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-[#C5832B]"
                    />
                  </div>

                  {/* Filter Status */}
                  <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                    {['ALL', 'NEW', 'CONTACTED', 'NEGOTIATING', 'DEAL CLOSED', 'COMPLETED'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setFilterStatus(st)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          filterStatus === st
                            ? 'bg-[#C5832B] text-neutral-950 font-bold'
                            : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Enquiries List */}
                <div className="space-y-4">
                  {filteredEnquiries.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500 text-xs">
                      No customer enquiries found matching the selected filter.
                    </div>
                  ) : (
                    filteredEnquiries.map((enq) => (
                      <div
                        key={enq.id}
                        className="p-4 sm:p-5 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-[#C5832B]">
                              {enq.id}
                            </span>
                            <h4 className="text-sm font-bold text-white font-montserrat">
                              {enq.name}
                            </h4>
                            {enq.company && (
                              <span className="text-xs text-neutral-400">· {enq.company}</span>
                            )}
                          </div>

                          {/* Status Dropdown */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-neutral-500">Stage:</span>
                            <select
                              value={enq.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  enq.id,
                                  e.target.value as EnquiryRecord['status']
                                )
                              }
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${getStatusColor(
                                enq.status
                              )} focus:outline-none`}
                            >
                              <option value="NEW" className="bg-neutral-900 text-white">NEW</option>
                              <option value="CONTACTED" className="bg-neutral-900 text-white">CONTACTED</option>
                              <option value="NEGOTIATING" className="bg-neutral-900 text-white">NEGOTIATING</option>
                              <option value="DEAL CLOSED" className="bg-neutral-900 text-white">DEAL CLOSED</option>
                              <option value="COMPLETED" className="bg-neutral-900 text-white">COMPLETED</option>
                            </select>
                          </div>
                        </div>

                        {/* Contact info row */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-300 mb-3">
                          <span className="flex items-center gap-1.5 text-neutral-400">
                            <Phone className="w-3.5 h-3.5 text-[#C5832B]" />
                            <a href={`tel:${enq.phone}`} className="hover:text-white">
                              {enq.phone}
                            </a>
                          </span>
                          <span className="flex items-center gap-1.5 text-neutral-400">
                            <Mail className="w-3.5 h-3.5 text-[#C5832B]" />
                            <a href={`mailto:${enq.email}`} className="hover:text-white">
                              {enq.email}
                            </a>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-neutral-900 text-[10px] text-[#C5832B] border border-neutral-800">
                            {enq.projectType}
                          </span>
                          <span className="text-[11px] text-neutral-500 ml-auto">
                            {new Date(enq.createdAt).toLocaleDateString()} at{' '}
                            {new Date(enq.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Message body */}
                        <p className="text-xs text-neutral-300 bg-neutral-900/60 p-3 rounded-lg border border-neutral-800/80 leading-relaxed">
                          "{enq.message || 'No additional remarks provided.'}"
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
            <span>SRL Infra Developers CRM Engine</span>
            {isAuthenticated && (
              <button
                onClick={() => setIsAuthenticated(false)}
                className="text-neutral-400 hover:text-white text-xs underline"
              >
                Lock Session
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
