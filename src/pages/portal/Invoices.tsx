import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import { supabase } from '../../lib/supabase';

type Staff = {
  id: string;
  user_id: string | null;
  staff_code: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
  is_active: boolean;
};

type Lead = {
  id: number;
  name: string;
  phone: string;
  email: string;
  company: string | null;
  project_type: string | null;
  message: string | null;
};

type Quotation = {
  id: number;
  lead_id: number;
  quotation_number: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
  valid_until: string | null;
  payment_terms: string | null;
  notes: string | null;
  terms_conditions: string | null;
  cgst: number | null;
  sgst: number | null;
  igst: number | null;
};

type QuotationItem = {
  id: number;
  quotation_id: number;
  description: string;
  quantity: number;
  unit: string | null;
  rate: number;
  tax_rate: number | null;
  amount: number;
};

type Invoice = {
  id: number;
  quotation_id: number | null;
  lead_id: number | null;
  invoice_number: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
  invoice_date: string | null;
  due_date: string | null;
  payment_terms: string | null;
  notes: string | null;
  terms_conditions: string | null;
  paid_amount: number | null;
  payment_status: string;
  cgst: number | null;
  sgst: number | null;
  igst: number | null;
};

type InvoiceItem = {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit: string | null;
  rate: number;
  tax_rate: number | null;
  amount: number;
};

const COMPANY = {
  name: 'SRL INFRA DEVELOPERS',
  address: [
    'H.NO: 3, 7-809, D-Mart Road,',
    'Near SRR Signal, Vivekananda Puri,',
    'Karimnagar, Telangana – 505001',
  ],
  phone: '7416964666',
  phone2: '8783546061',
  website: 'www.srlinfra.in',
};

const formatCurrency = (value: number = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value?: string | null) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const todayISO = () =>
  new Date().toISOString().slice(0, 10);

const addDays = (
  dateString: string,
  days: number
) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const getErrorMessage = (error: any) => {
  console.error('Supabase error:', error);

  return (
    error?.message ||
    error?.details ||
    error?.hint ||
    'Unknown database error.'
  );
};

export default function Invoices() {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const [invoices, setInvoices] =
    useState<Invoice[]>([]);

  const [quotations, setQuotations] =
    useState<Quotation[]>([]);

  const [quotationItems, setQuotationItems] =
    useState<QuotationItem[]>([]);

  const [invoiceItems, setInvoiceItems] =
    useState<InvoiceItem[]>([]);

  const [leads, setLeads] =
    useState<Lead[]>([]);

  const [currentStaff, setCurrentStaff] =
    useState<Staff | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [showDetails, setShowDetails] =
    useState(false);

  const [selectedInvoice, setSelectedInvoice] =
    useState<Invoice | null>(null);

  const [selectedQuotation, setSelectedQuotation] =
    useState<Quotation | null>(null);

  const [selectedLead, setSelectedLead] =
    useState<Lead | null>(null);

  const [paidAmountInput, setPaidAmountInput] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('ALL');

  const [paymentFilter, setPaymentFilter] =
    useState('ALL');

  const autoConversionStarted =
    useRef(false);

  const isAdmin =
    currentStaff?.role?.toUpperCase() ===
    'ADMIN';

  const loadCurrentStaff =
    useCallback(async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error(
          'Please login first.'
        );
      }

      const { data, error } =
        await supabase
          .from('staff')
          .select(`
            id,
            user_id,
            staff_code,
            full_name,
            email,
            role,
            department,
            is_active
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          'Active staff record not found for this account.'
        );
      }

      setCurrentStaff(data as Staff);

      return data as Staff;
    }, []);

  const loadData = useCallback(
    async () => {
      try {
        setLoading(true);

        const [
          staff,
          invoiceResult,
          quotationResult,
          quotationItemResult,
          leadResult,
        ] = await Promise.all([
          loadCurrentStaff(),

          supabase
            .from('invoices')
            .select('*')
            .order('created_at', {
              ascending: false,
            }),

          supabase
            .from('quotations')
            .select('*')
            .order('created_at', {
              ascending: false,
            }),

          supabase
            .from('quotation_items')
            .select('*')
            .order('id', {
              ascending: true,
            }),

          supabase
            .from('leads')
            .select(`
              id,
              name,
              phone,
              email,
              company,
              project_type,
              message
            `)
            .order('created_at', {
              ascending: false,
            }),
        ]);

        if (invoiceResult.error) {
          throw invoiceResult.error;
        }

        if (quotationResult.error) {
          throw quotationResult.error;
        }

        if (quotationItemResult.error) {
          throw quotationItemResult.error;
        }

        if (leadResult.error) {
          throw leadResult.error;
        }

        if (
          staff.role?.toUpperCase() !==
          'ADMIN'
        ) {
          throw new Error(
            'Only Admin can access invoices.'
          );
        }

        setInvoices(
          (invoiceResult.data ||
            []) as Invoice[]
        );

        setQuotations(
          (quotationResult.data ||
            []) as Quotation[]
        );

        setQuotationItems(
          (quotationItemResult.data ||
            []) as QuotationItem[]
        );

        setLeads(
          (leadResult.data ||
            []) as Lead[]
        );
      } catch (error: any) {
        console.error(
          'Failed to load invoice data:',
          error
        );

        alert(
          `Unable to load invoice data.\n\n${getErrorMessage(
            error
          )}`
        );
      } finally {
        setLoading(false);
      }
    },
    [loadCurrentStaff]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getLead = useCallback(
    (leadId?: number | null) =>
      leads.find(
        (lead) =>
          lead.id === leadId
      ),
    [leads]
  );

  const getQuotation = useCallback(
    (quotationId?: number | null) =>
      quotations.find(
        (quotation) =>
          quotation.id ===
          quotationId
      ),
    [quotations]
  );

  const getQuotationItems =
    useCallback(
      (quotationId: number) =>
        quotationItems.filter(
          (item) =>
            item.quotation_id ===
            quotationId
        ),
      [quotationItems]
    );

  const getInvoiceItems =
    useCallback(
      (invoiceId: number) =>
        invoiceItems.filter(
          (item) =>
            item.invoice_id ===
            invoiceId
        ),
      [invoiceItems]
    );

  const filteredInvoices = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return invoices.filter(
      (invoice) => {
        const lead = getLead(
          invoice.lead_id
        );

        const searchText = [
          invoice.invoice_number,
          lead?.name,
          lead?.company,
          lead?.phone,
          lead?.email,
          lead?.project_type,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        const matchesSearch =
          !query ||
          searchText.includes(query);

        const matchesStatus =
          statusFilter === 'ALL' ||
          invoice.status ===
            statusFilter;

        const matchesPayment =
          paymentFilter === 'ALL' ||
          invoice.payment_status ===
            paymentFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPayment
        );
      }
    );
  }, [
    invoices,
    search,
    statusFilter,
    paymentFilter,
    getLead,
  ]);

  const stats = useMemo(() => {
    const total =
      invoices.length;

    const totalValue =
      invoices.reduce(
        (sum, invoice) =>
          sum +
          Number(
            invoice.total_amount || 0
          ),
        0
      );

    const paid =
      invoices.reduce(
        (sum, invoice) =>
          sum +
          Number(
            invoice.paid_amount || 0
          ),
        0
      );

    const outstanding =
      Math.max(
        totalValue - paid,
        0
      );

    const sent =
      invoices.filter(
        (invoice) =>
          invoice.status === 'SENT'
      ).length;

    const overdue =
      invoices.filter(
        (invoice) =>
          invoice.payment_status ===
          'OVERDUE'
      ).length;

    return {
      total,
      totalValue,
      paid,
      outstanding,
      sent,
      overdue,
    };
  }, [invoices]);

  const generateInvoiceNumber =
    useCallback(() => {
      const year =
        new Date().getFullYear();

      const numbers =
        invoices
          .map((invoice) => {
            const match =
              invoice.invoice_number?.match(
                /INV-\d{4}-(\d+)/
              );

            return match
              ? Number(match[1])
              : 0;
          })
          .filter(
            (number) =>
              !Number.isNaN(number)
          );

      const next =
        numbers.length
          ? Math.max(...numbers) + 1
          : 1;

      return `INV-${year}-${String(
        next
      ).padStart(4, '0')}`;
    }, [invoices]);

  const loadInvoiceItems = async (
    invoiceId: number
  ) => {
    const { data, error } =
      await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('id', {
          ascending: true,
        });

    if (error) {
      console.error(
        'Invoice items error:',
        error
      );

      setInvoiceItems([]);

      return [];
    }

    const items =
      (data || []) as InvoiceItem[];

    setInvoiceItems(items);

    return items;
  };

  const openInvoice = async (
    invoice: Invoice
  ) => {
    setSelectedInvoice(invoice);

    setSelectedQuotation(
      getQuotation(
        invoice.quotation_id
      ) || null
    );

    setSelectedLead(
      getLead(
        invoice.lead_id
      ) || null
    );

    setPaidAmountInput(
      String(
        invoice.paid_amount || 0
      )
    );

    await loadInvoiceItems(
      invoice.id
    );

    setShowDetails(true);
  };

  const createInvoiceFromQuotation =
    useCallback(
      async (
        quotation: Quotation
      ) => {
        if (!isAdmin) {
          alert(
            'Only Admin can create invoices.'
          );
          return;
        }

        if (
          quotation.status !==
          'APPROVED'
        ) {
          alert(
            'Only APPROVED quotations can be converted into invoices.'
          );
          return;
        }

        if (!currentStaff) {
          alert(
            'Admin staff information is missing.'
          );
          return;
        }

        try {
          setCreating(true);

          const existing =
            invoices.find(
              (invoice) =>
                invoice.quotation_id ===
                quotation.id
            );

          if (existing) {
            alert(
              `Invoice already exists for ${quotation.quotation_number}.\n\nInvoice: ${existing.invoice_number}`
            );

            await openInvoice(
              existing
            );

            return;
          }

          const lead =
            getLead(
              quotation.lead_id
            );

          if (!lead) {
            throw new Error(
              'Lead linked to this quotation was not found.'
            );
          }

          const invoiceNumber =
            generateInvoiceNumber();

          const invoiceDate =
            todayISO();

          const dueDate =
            addDays(
              invoiceDate,
              15
            );

          const quotationTax =
            Number(
              quotation.tax_amount || 0
            );

          const cgst =
            Number(
              quotation.cgst || 0
            );

          const sgst =
            Number(
              quotation.sgst || 0
            );

          const igst =
            Number(
              quotation.igst || 0
            );

          const finalTax =
            quotationTax ||
            cgst +
              sgst +
              igst;

          const invoicePayload = {
            quotation_id:
              quotation.id,

            lead_id:
              quotation.lead_id,

            invoice_number:
              invoiceNumber,

            subtotal:
              Number(
                quotation.subtotal || 0
              ),

            tax_amount:
              finalTax,

            total_amount:
              Number(
                quotation.total_amount ||
                  0
              ),

            status:
              'DRAFT',

            created_by:
              currentStaff.id,

            invoice_date:
              invoiceDate,

            due_date:
              dueDate,

            payment_terms:
              quotation.payment_terms ||
              '15 days',

            notes:
              quotation.notes ||
              null,

            terms_conditions:
              quotation.terms_conditions ||
              null,

            paid_amount: 0,

            payment_status:
              'UNPAID',

            cgst,

            sgst,

            igst,
          };

          console.log(
            'Creating invoice:',
            invoicePayload
          );

          const {
            data: invoice,
            error: invoiceError,
          } =
            await supabase
              .from('invoices')
              .insert(
                invoicePayload
              )
              .select('*')
              .single();

          if (invoiceError) {
            throw invoiceError;
          }

          if (!invoice) {
            throw new Error(
              'Invoice was not returned after creation.'
            );
          }

          const items =
            getQuotationItems(
              quotation.id
            );

          if (items.length > 0) {
            const invoiceItemPayload =
              items.map(
                (item) => ({
                  invoice_id:
                    invoice.id,

                  description:
                    item.description,

                  quantity:
                    Number(
                      item.quantity || 0
                    ),

                  unit:
                    item.unit || null,

                  rate:
                    Number(
                      item.rate || 0
                    ),

                  tax_rate:
                    Number(
                      item.tax_rate || 0
                    ),

                  amount:
                    Number(
                      item.amount || 0
                    ),
                })
              );

            const {
              error: itemError,
            } =
              await supabase
                .from('invoice_items')
                .insert(
                  invoiceItemPayload
                );

            if (itemError) {
              await supabase
                .from('invoices')
                .delete()
                .eq(
                  'id',
                  invoice.id
                );

              throw new Error(
                `Invoice was created but invoice items failed: ${itemError.message}`
              );
            }
          }

          await loadData();

          const createdInvoice =
            invoice as Invoice;

          await openInvoice(
            createdInvoice
          );

          alert(
            `Invoice ${invoiceNumber} created successfully.`
          );
        } catch (error: any) {
          console.error(
            'Invoice creation failed:',
            error
          );

          alert(
            `Invoice creation failed.\n\n${getErrorMessage(
              error
            )}`
          );
        } finally {
          setCreating(false);
        }
      },
      [
        isAdmin,
        currentStaff,
        invoices,
        getLead,
        generateInvoiceNumber,
        getQuotationItems,
        loadData,
      ]
    );

  useEffect(() => {
    const quotationId =
      searchParams.get(
        'quotation'
      );

    if (
      !quotationId ||
      loading ||
      creating ||
      autoConversionStarted.current
    ) {
      return;
    }

    const quotation =
      quotations.find(
        (item) =>
          String(item.id) ===
          quotationId
      );

    if (!quotation) {
      return;
    }

    autoConversionStarted.current =
      true;

    createInvoiceFromQuotation(
      quotation
    );

    navigate(
      '/portal/invoices',
      {
        replace: true,
      }
    );
  }, [
    searchParams,
    quotations,
    loading,
    creating,
    createInvoiceFromQuotation,
    navigate,
  ]);

  const updateInvoiceStatus =
    async (
      invoice: Invoice,
      status: string
    ) => {
      if (!isAdmin) return;

      const {
        data,
        error,
      } = await supabase
        .from('invoices')
        .update({
          status,
          updated_at:
            new Date().toISOString(),
        })
        .eq('id', invoice.id)
        .select('*')
        .single();

      if (error) {
        alert(
          `Unable to update invoice status.\n\n${getErrorMessage(
            error
          )}`
        );
        return;
      }

      setInvoices(
        (previous) =>
          previous.map(
            (item) =>
              item.id === invoice.id
                ? (data as Invoice)
                : item
          )
      );

      setSelectedInvoice(
        data as Invoice
      );
    };

  const updatePayment = async () => {
    if (!selectedInvoice) {
      return;
    }

    if (!isAdmin) {
      return;
    }

    const paidAmount =
      Number(
        paidAmountInput || 0
      );

    const total =
      Number(
        selectedInvoice.total_amount ||
          0
      );

    if (
      Number.isNaN(
        paidAmount
      )
    ) {
      alert(
        'Please enter a valid payment amount.'
      );
      return;
    }

    if (paidAmount < 0) {
      alert(
        'Paid amount cannot be negative.'
      );
      return;
    }

    if (paidAmount > total) {
      alert(
        `Paid amount cannot exceed ${formatCurrency(
          total
        )}.`
      );
      return;
    }

    let paymentStatus =
      'UNPAID';

    if (paidAmount >= total) {
      paymentStatus = 'PAID';
    } else if (
      paidAmount > 0
    ) {
      paymentStatus =
        'PARTIALLY PAID';
    } else {
      const due =
        selectedInvoice.due_date
          ? new Date(
              selectedInvoice.due_date
            )
          : null;

      if (
        due &&
        due < new Date() &&
        total > 0
      ) {
        paymentStatus =
          'OVERDUE';
      }
    }

    const {
      data,
      error,
    } = await supabase
      .from('invoices')
      .update({
        paid_amount:
          paidAmount,

        payment_status:
          paymentStatus,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        selectedInvoice.id
      )
      .select('*')
      .single();

    if (error) {
      alert(
        `Unable to update payment.\n\n${getErrorMessage(
          error
        )}`
      );
      return;
    }

    setInvoices(
      (previous) =>
        previous.map(
          (item) =>
            item.id ===
            selectedInvoice.id
              ? (data as Invoice)
              : item
        )
    );

    setSelectedInvoice(
      data as Invoice
    );

    setPaidAmountInput(
      String(
        data.paid_amount || 0
      )
    );

    alert(
      'Payment information updated.'
    );
  };

  const printInvoice = () => {
    if (!selectedInvoice) {
      return;
    }

    const invoice =
      selectedInvoice;

    const lead =
      selectedLead ||
      getLead(
        invoice.lead_id
      );

    const quotation =
      selectedQuotation ||
      getQuotation(
        invoice.quotation_id
      );

    const items =
      getInvoiceItems(
        invoice.id
      );

    const subtotal =
      Number(
        invoice.subtotal || 0
      );

    const tax =
      Number(
        invoice.tax_amount || 0
      );

    const total =
      Number(
        invoice.total_amount || 0
      );

    const paid =
      Number(
        invoice.paid_amount || 0
      );

    const balance =
      Math.max(
        total - paid,
        0
      );

    const itemRows =
      items.length
        ? items
            .map(
              (item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${escapeHtml(
                    item.description
                  )}</td>
                  <td>${escapeHtml(
                    item.quantity
                  )}</td>
                  <td>${escapeHtml(
                    item.unit || '—'
                  )}</td>
                  <td class="number">
                    ${escapeHtml(
                      formatCurrency(
                        item.rate
                      )
                    )}
                  </td>
                  <td class="number">
                    ${escapeHtml(
                      formatCurrency(
                        item.amount
                      )
                    )}
                  </td>
                </tr>
              `
            )
            .join('')
        : `
          <tr>
            <td colspan="6" class="empty">
              No invoice items
            </td>
          </tr>
        `;

    let gstRows = '';

    if (
      Number(invoice.cgst || 0) >
        0 ||
      Number(invoice.sgst || 0) >
        0
    ) {
      gstRows += `
        <div class="summary-row">
          <span>CGST</span>
          <strong>
            ${escapeHtml(
              formatCurrency(
                invoice.cgst || 0
              )
            )}
          </strong>
        </div>

        <div class="summary-row">
          <span>SGST</span>
          <strong>
            ${escapeHtml(
              formatCurrency(
                invoice.sgst || 0
              )
            )}
          </strong>
        </div>
      `;
    }

    if (
      Number(invoice.igst || 0) >
      0
    ) {
      gstRows += `
        <div class="summary-row">
          <span>IGST</span>
          <strong>
            ${escapeHtml(
              formatCurrency(
                invoice.igst || 0
              )
            )}
          </strong>
        </div>
      `;
    }

    if (!gstRows) {
      gstRows = `
        <div class="summary-row">
          <span>Tax / GST</span>
          <strong>
            ${escapeHtml(
              formatCurrency(tax)
            )}
          </strong>
        </div>
      `;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<title>
${escapeHtml(
  invoice.invoice_number
)}
</title>

<style>

@page {
  size: A4;
  margin: 12mm;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  color: #222;
  background: #fff;
}

.page {
  width: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 30px;
  border-bottom: 3px solid #9a641f;
  padding-bottom: 16px;
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.logo {
  width: 115px;
  height: auto;
  object-fit: contain;
}

.wordmark {
  width: 190px;
  max-height: 42px;
  object-fit: contain;
  margin-top: 8px;
}

.company {
  text-align: right;
}

.company h1 {
  margin: 0 0 6px;
  font-size: 21px;
  letter-spacing: 1px;
}

.company p {
  margin: 3px 0;
  font-size: 10px;
  line-height: 1.4;
}

.title {
  text-align: center;
  margin: 22px 0;
}

.title h2 {
  margin: 0;
  font-size: 25px;
  letter-spacing: 2px;
}

.meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 22px;
}

.box {
  border: 1px solid #ddd;
  padding: 13px;
  border-radius: 5px;
}

.box h3 {
  margin: 0 0 9px;
  color: #9a641f;
  font-size: 12px;
}

.box p {
  margin: 4px 0;
  font-size: 10px;
  line-height: 1.4;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}

th {
  background: #151b2b;
  color: #fff;
  padding: 8px;
  font-size: 10px;
  text-align: left;
}

td {
  border-bottom: 1px solid #ddd;
  padding: 8px;
  font-size: 10px;
}

.number {
  text-align: right;
}

.empty {
  text-align: center;
}

.summary {
  width: 44%;
  margin-left: auto;
  margin-top: 18px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 11px;
}

.grand {
  border-top: 2px solid #222;
  margin-top: 5px;
  padding-top: 10px;
  font-size: 15px;
  color: #9a641f;
}

.payment {
  margin-top: 22px;
}

.terms {
  margin-top: 25px;
  border-top: 1px solid #ddd;
  padding-top: 12px;
}

.terms h3 {
  color: #9a641f;
  font-size: 12px;
}

.terms p {
  white-space: pre-line;
  font-size: 9px;
  line-height: 1.5;
}

.footer {
  margin-top: 30px;
  padding-top: 10px;
  border-top: 1px solid #ddd;
  text-align: center;
  font-size: 9px;
  color: #666;
}

@media print {
  body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}

</style>
</head>

<body>

<div class="page">

  <div class="header">

    <div class="brand">

      <img
        src="/logo.png"
        class="logo"
      />

      <img
        src="/srl-wordmark.png"
        class="wordmark"
      />

    </div>

    <div class="company">

      <h1>
        ${escapeHtml(
          COMPANY.name
        )}
      </h1>

      <p>
        ${escapeHtml(
          COMPANY.address[0]
        )}
        <br>
        ${escapeHtml(
          COMPANY.address[1]
        )}
        <br>
        ${escapeHtml(
          COMPANY.address[2]
        )}
      </p>

      <p>
        Phone:
        ${escapeHtml(
          COMPANY.phone
        )}
        /
        ${escapeHtml(
          COMPANY.phone2
        )}
      </p>

      <p>
        ${escapeHtml(
          COMPANY.website
        )}
      </p>

    </div>

  </div>

  <div class="title">
    <h2>TAX INVOICE</h2>
  </div>

  <div class="meta">

    <div class="box">

      <h3>BILL TO</h3>

      <p>
        <strong>
          ${escapeHtml(
            lead?.company ||
              lead?.name ||
              'Client'
          )}
        </strong>
      </p>

      ${
        lead?.company &&
        lead?.name
          ? `<p>${escapeHtml(
              lead.name
            )}</p>`
          : ''
      }

      ${
        lead?.phone
          ? `<p>Phone: ${escapeHtml(
              lead.phone
            )}</p>`
          : ''
      }

      ${
        lead?.email
          ? `<p>Email: ${escapeHtml(
              lead.email
            )}</p>`
          : ''
      }

      ${
        lead?.project_type
          ? `<p>Project: ${escapeHtml(
              lead.project_type
            )}</p>`
          : ''
      }

    </div>

    <div class="box">

      <h3>INVOICE DETAILS</h3>

      <p>
        <strong>Invoice No:</strong>
        ${escapeHtml(
          invoice.invoice_number
        )}
      </p>

      <p>
        <strong>Invoice Date:</strong>
        ${escapeHtml(
          formatDate(
            invoice.invoice_date
          )
        )}
      </p>

      <p>
        <strong>Due Date:</strong>
        ${escapeHtml(
          formatDate(
            invoice.due_date
          )
        )}
      </p>

      ${
        quotation
          ? `
            <p>
              <strong>Quotation:</strong>
              ${escapeHtml(
                quotation.quotation_number
              )}
            </p>
          `
          : ''
      }

      ${
        lead?.project_type
          ? `
            <p>
              <strong>Project:</strong>
              ${escapeHtml(
                lead.project_type
              )}
            </p>
          `
          : ''
      }

    </div>

  </div>

  <table>

    <thead>

      <tr>
        <th>#</th>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit</th>
        <th class="number">
          Rate
        </th>
        <th class="number">
          Amount
        </th>
      </tr>

    </thead>

    <tbody>

      ${itemRows}

    </tbody>

  </table>

  <div class="summary">

    <div class="summary-row">

      <span>Subtotal</span>

      <strong>
        ${escapeHtml(
          formatCurrency(
            subtotal
          )
        )}
      </strong>

    </div>

    ${
      Number(
        quotation?.discount_amount ||
          0
      ) > 0
        ? `
          <div class="summary-row">
            <span>Discount</span>
            <strong>
              -
              ${escapeHtml(
                formatCurrency(
                  quotation?.discount_amount ||
                    0
                )
              )}
            </strong>
          </div>
        `
        : ''
    }

    ${gstRows}

    <div class="summary-row grand">

      <span>Grand Total</span>

      <strong>
        ${escapeHtml(
          formatCurrency(total)
        )}
      </strong>

    </div>

  </div>

  <div class="box payment">

    <h3>PAYMENT DETAILS</h3>

    <p>
      <strong>
        Payment Terms:
      </strong>
      ${escapeHtml(
        invoice.payment_terms ||
          '—'
      )}
    </p>

    <p>
      <strong>
        Payment Status:
      </strong>
      ${escapeHtml(
        invoice.payment_status
      )}
    </p>

    <p>
      <strong>
        Paid Amount:
      </strong>
      ${escapeHtml(
        formatCurrency(paid)
      )}
    </p>

    <p>
      <strong>
        Balance:
      </strong>
      ${escapeHtml(
        formatCurrency(balance)
      )}
    </p>

  </div>

  ${
    invoice.terms_conditions
      ? `
        <div class="terms">

          <h3>
            TERMS & CONDITIONS
          </h3>

          <p>
            ${escapeHtml(
              invoice.terms_conditions
            )}
          </p>

        </div>
      `
      : ''
  }

  ${
    invoice.notes
      ? `
        <div class="terms">

          <h3>NOTES</h3>

          <p>
            ${escapeHtml(
              invoice.notes
            )}
          </p>

        </div>
      `
      : ''
  }

  <div class="footer">

    <strong>
      ${escapeHtml(
        COMPANY.name
      )}
    </strong>

    <br>

    Thank you for your business.

  </div>

</div>

<script>

window.onload = function() {
  window.print();
};

</script>

</body>
</html>
`;

    const printWindow =
      window.open(
        '',
        '_blank',
        'width=900,height=1100'
      );

    if (!printWindow) {
      alert(
        'Please allow pop-ups to print the invoice.'
      );
      return;
    }

    printWindow.document.open();

    printWindow.document.write(
      html
    );

    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-xl rounded-xl bg-white p-10 text-center shadow-sm">
          <p className="text-gray-500">
            Loading invoices...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-xl rounded-xl bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-red-600">
            Access Denied
          </h2>

          <p className="mt-2 text-gray-600">
            Only Admin can access invoices.
          </p>

          <button
            onClick={() =>
              navigate('/portal')
            }
            className="mt-5 rounded-lg bg-[#C5832B] px-5 py-3 text-white"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">

      <div className="mx-auto max-w-7xl">

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <button
              onClick={() =>
                navigate('/portal')
              }
              className="mb-2 text-sm text-gray-500 hover:text-[#9a641f]"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold text-gray-900">
              Invoices
            </h1>

            <p className="mt-1 text-gray-500">
              Manage invoices, payments and billing.
            </p>

          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="rounded-lg bg-gray-900 px-5 py-3 text-white hover:bg-black disabled:opacity-50"
          >
            Refresh
          </button>

        </div>

        <div className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-6">

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">
              Total Invoices
            </p>

            <p className="mt-2 text-2xl font-bold">
              {stats.total}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">
              Invoice Value
            </p>

            <p className="mt-2 text-xl font-bold">
              {formatCurrency(
                stats.totalValue
              )}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">
              Paid
            </p>

            <p className="mt-2 text-xl font-bold text-green-700">
              {formatCurrency(
                stats.paid
              )}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">
              Outstanding
            </p>

            <p className="mt-2 text-xl font-bold text-orange-600">
              {formatCurrency(
                stats.outstanding
              )}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">
              Sent
            </p>

            <p className="mt-2 text-2xl font-bold">
              {stats.sent}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">
              Overdue
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600">
              {stats.overdue}
            </p>
          </div>

        </div>

        <div className="mb-6 rounded-xl border bg-white p-4">

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search invoice, client, phone..."
              className="rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-[#c5832b]"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="rounded-lg border px-4 py-3"
            >
              <option value="ALL">
                All Status
              </option>

              <option value="DRAFT">
                Draft
              </option>

              <option value="SENT">
                Sent
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>
            </select>

            <select
              value={paymentFilter}
              onChange={(event) =>
                setPaymentFilter(
                  event.target.value
                )
              }
              className="rounded-lg border px-4 py-3"
            >
              <option value="ALL">
                All Payments
              </option>

              <option value="UNPAID">
                Unpaid
              </option>

              <option value="PARTIALLY PAID">
                Partially Paid
              </option>

              <option value="PAID">
                Paid
              </option>

              <option value="OVERDUE">
                Overdue
              </option>
            </select>

          </div>

        </div>

        <div className="overflow-hidden rounded-xl border bg-white">

          {filteredInvoices.length ===
          0 ? (
            <div className="p-12 text-center">

              <div className="mb-3 text-4xl">
                🧾
              </div>

              <h3 className="text-lg font-semibold">
                No invoices found
              </h3>

              <p className="mt-1 text-gray-500">
                Approved quotations can be converted into invoices.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-gray-900 text-white">

                  <tr>

                    <th className="px-5 py-4 text-left">
                      Invoice
                    </th>

                    <th className="px-5 py-4 text-left">
                      Client
                    </th>

                    <th className="px-5 py-4 text-left">
                      Date
                    </th>

                    <th className="px-5 py-4 text-left">
                      Due
                    </th>

                    <th className="px-5 py-4 text-left">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left">
                      Payment
                    </th>

                    <th className="px-5 py-4 text-right">
                      Total
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredInvoices.map(
                    (invoice) => {
                      const lead =
                        getLead(
                          invoice.lead_id
                        );

                      return (
                        <tr
                          key={
                            invoice.id
                          }
                          onClick={() =>
                            openInvoice(
                              invoice
                            )
                          }
                          className="cursor-pointer border-b hover:bg-gray-50"
                        >

                          <td className="px-5 py-4">

                            <p className="font-semibold text-[#9a641f]">
                              {
                                invoice.invoice_number
                              }
                            </p>

                          </td>

                          <td className="px-5 py-4">

                            <p className="font-medium">
                              {
                                lead?.company ||
                                lead?.name ||
                                '—'
                              }
                            </p>

                            {lead?.phone && (
                              <p className="text-xs text-gray-500">
                                {
                                  lead.phone
                                }
                              </p>
                            )}

                          </td>

                          <td className="px-5 py-4 text-sm">
                            {formatDate(
                              invoice.invoice_date
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm">
                            {formatDate(
                              invoice.due_date
                            )}
                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                invoice.status ===
                                'SENT'
                                  ? 'bg-blue-100 text-blue-700'
                                  : invoice.status ===
                                    'CANCELLED'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {
                                invoice.status
                              }
                            </span>

                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                invoice.payment_status ===
                                'PAID'
                                  ? 'bg-green-100 text-green-700'
                                  : invoice.payment_status ===
                                    'PARTIALLY PAID'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : invoice.payment_status ===
                                    'OVERDUE'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {
                                invoice.payment_status
                              }
                            </span>

                          </td>

                          <td className="px-5 py-4 text-right font-bold">
                            {formatCurrency(
                              invoice.total_amount
                            )}
                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>

      {showDetails &&
        selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

            <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white">

              <div className="flex items-start justify-between border-b p-6">

                <div>

                  <p className="text-sm text-gray-500">
                    Invoice
                  </p>

                  <h2 className="text-2xl font-bold">
                    {
                      selectedInvoice.invoice_number
                    }
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {
                      selectedLead?.project_type ||
                      'Invoice'
                    }
                  </p>

                </div>

                <button
                  onClick={() =>
                    setShowDetails(
                      false
                    )
                  }
                  className="text-2xl text-gray-500 hover:text-black"
                >
                  ×
                </button>

              </div>

              <div className="p-6">

                <div className="grid gap-5 md:grid-cols-2">

                  <div className="rounded-xl border p-5">

                    <h3 className="mb-3 font-semibold text-[#9a641f]">
                      Bill To
                    </h3>

                    <p className="font-semibold">
                      {
                        selectedLead?.company ||
                        selectedLead?.name ||
                        '—'
                      }
                    </p>

                    {selectedLead?.company &&
                      selectedLead?.name && (
                        <p>
                          {
                            selectedLead.name
                          }
                        </p>
                      )}

                    {selectedLead?.phone && (
                      <p className="mt-2 text-sm">
                        {
                          selectedLead.phone
                        }
                      </p>
                    )}

                    {selectedLead?.email && (
                      <p className="text-sm text-gray-600">
                        {
                          selectedLead.email
                        }
                      </p>
                    )}

                  </div>

                  <div className="rounded-xl border p-5">

                    <h3 className="mb-3 font-semibold text-[#9a641f]">
                      Invoice Details
                    </h3>

                    <div className="space-y-2 text-sm">

                      <p>
                        <strong>
                          Invoice:
                        </strong>{' '}
                        {
                          selectedInvoice.invoice_number
                        }
                      </p>

                      <p>
                        <strong>
                          Date:
                        </strong>{' '}
                        {formatDate(
                          selectedInvoice.invoice_date
                        )}
                      </p>

                      <p>
                        <strong>
                          Due:
                        </strong>{' '}
                        {formatDate(
                          selectedInvoice.due_date
                        )}
                      </p>

                      {selectedQuotation && (
                        <p>
                          <strong>
                            Quotation:
                          </strong>{' '}
                          {
                            selectedQuotation.quotation_number
                          }
                        </p>
                      )}

                      <p>
                        <strong>
                          Status:
                        </strong>{' '}
                        {
                          selectedInvoice.status
                        }
                      </p>

                    </div>

                  </div>

                </div>

                <div className="mt-6 overflow-hidden rounded-xl border">

                  <div className="border-b bg-gray-50 px-5 py-4 font-semibold">
                    Invoice Items
                  </div>

                  <div className="overflow-x-auto">

                    <table className="w-full">

                      <thead className="bg-gray-900 text-sm text-white">

                        <tr>

                          <th className="px-4 py-3 text-left">
                            Description
                          </th>

                          <th className="px-4 py-3 text-right">
                            Qty
                          </th>

                          <th className="px-4 py-3 text-right">
                            Rate
                          </th>

                          <th className="px-4 py-3 text-right">
                            Amount
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {getInvoiceItems(
                          selectedInvoice.id
                        ).length > 0 ? (
                          getInvoiceItems(
                            selectedInvoice.id
                          ).map(
                            (item) => (
                              <tr
                                key={
                                  item.id
                                }
                                className="border-b"
                              >

                                <td className="px-4 py-3">
                                  {
                                    item.description
                                  }
                                </td>

                                <td className="px-4 py-3 text-right">
                                  {
                                    item.quantity
                                  }{' '}
                                  {
                                    item.unit ||
                                    ''
                                  }
                                </td>

                                <td className="px-4 py-3 text-right">
                                  {formatCurrency(
                                    item.rate
                                  )}
                                </td>

                                <td className="px-4 py-3 text-right font-semibold">
                                  {formatCurrency(
                                    item.amount
                                  )}
                                </td>

                              </tr>
                            )
                          )
                        ) : (
                          <tr>

                            <td
                              colSpan={4}
                              className="px-4 py-6 text-center text-gray-500"
                            >
                              No invoice items.
                            </td>

                          </tr>
                        )}

                      </tbody>

                    </table>

                  </div>

                </div>

                <div className="mt-6 flex justify-end">

                  <div className="w-full space-y-3 rounded-xl border p-5 md:w-96">

                    <div className="flex justify-between">

                      <span>
                        Subtotal
                      </span>

                      <strong>
                        {formatCurrency(
                          selectedInvoice.subtotal
                        )}
                      </strong>

                    </div>

                    {Number(
                      selectedInvoice.cgst ||
                        0
                    ) > 0 && (
                      <div className="flex justify-between text-sm">

                        <span>
                          CGST
                        </span>

                        <strong>
                          {formatCurrency(
                            selectedInvoice.cgst ||
                              0
                          )}
                        </strong>

                      </div>
                    )}

                    {Number(
                      selectedInvoice.sgst ||
                        0
                    ) > 0 && (
                      <div className="flex justify-between text-sm">

                        <span>
                          SGST
                        </span>

                        <strong>
                          {formatCurrency(
                            selectedInvoice.sgst ||
                              0
                          )}
                        </strong>

                      </div>
                    )}

                    {Number(
                      selectedInvoice.igst ||
                        0
                    ) > 0 && (
                      <div className="flex justify-between text-sm">

                        <span>
                          IGST
                        </span>

                        <strong>
                          {formatCurrency(
                            selectedInvoice.igst ||
                              0
                          )}
                        </strong>

                      </div>
                    )}

                    <div className="flex justify-between">

                      <span>
                        Tax
                      </span>

                      <strong>
                        {formatCurrency(
                          selectedInvoice.tax_amount
                        )}
                      </strong>

                    </div>

                    <div className="flex justify-between border-t pt-3 text-lg">

                      <span className="font-bold">
                        Grand Total
                      </span>

                      <strong className="text-[#9a641f]">
                        {formatCurrency(
                          selectedInvoice.total_amount
                        )}
                      </strong>

                    </div>

                  </div>

                </div>

                <div className="mt-6 rounded-xl border p-5">

                  <h3 className="mb-4 font-semibold text-[#9a641f]">
                    Payment
                  </h3>

                  <div className="grid gap-4 md:grid-cols-3">

                    <div>

                      <label className="mb-1 block text-sm text-gray-500">
                        Payment Status
                      </label>

                      <div className="font-semibold">
                        {
                          selectedInvoice.payment_status
                        }
                      </div>

                    </div>

                    <div>

                      <label className="mb-1 block text-sm text-gray-500">
                        Paid Amount
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          paidAmountInput
                        }
                        onChange={(
                          event
                        ) =>
                          setPaidAmountInput(
                            event.target
                              .value
                          )
                        }
                        className="w-full rounded-lg border px-3 py-2"
                      />

                    </div>

                    <div>

                      <label className="mb-1 block text-sm text-gray-500">
                        Balance
                      </label>

                      <div className="font-bold text-orange-600">

                        {formatCurrency(
                          Math.max(
                            Number(
                              selectedInvoice.total_amount ||
                                0
                            ) -
                              Number(
                                paidAmountInput ||
                                  0
                              ),
                            0
                          )
                        )}

                      </div>

                    </div>

                  </div>

                  <button
                    onClick={
                      updatePayment
                    }
                    className="mt-4 rounded-lg bg-gray-900 px-5 py-2.5 text-white hover:bg-black"
                  >
                    Update Payment
                  </button>

                </div>

                <div className="mt-6 flex flex-wrap gap-3">

                  {selectedInvoice.status ===
                    'DRAFT' && (
                    <button
                      onClick={() =>
                        updateInvoiceStatus(
                          selectedInvoice,
                          'SENT'
                        )
                      }
                      className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
                    >
                      Send Invoice
                    </button>
                  )}

                  {selectedInvoice.status ===
                    'SENT' && (
                    <button
                      onClick={() =>
                        updateInvoiceStatus(
                          selectedInvoice,
                          'CANCELLED'
                        )
                      }
                      className="rounded-lg bg-red-600 px-5 py-3 text-white hover:bg-red-700"
                    >
                      Cancel Invoice
                    </button>
                  )}

                  <button
                    onClick={
                      printInvoice
                    }
                    className="rounded-lg bg-[#9a641f] px-5 py-3 text-white hover:bg-[#7e5017]"
                  >
                    Print / PDF
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

      {creating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">

          <div className="rounded-xl bg-white px-8 py-7 text-center shadow-xl">

            <div className="mb-3 text-2xl">
              🧾
            </div>

            <p className="font-semibold">
              Creating invoice...
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Please wait.
            </p>

          </div>

        </div>
      )}

    </div>
  );
}