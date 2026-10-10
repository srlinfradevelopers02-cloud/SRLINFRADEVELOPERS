import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type Lead = {
  id: number;
  client_name?: string;
  company_name?: string;
  phone?: string;
  email?: string;
  project_type?: string;
  project_location?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst_number?: string;
  pan_number?: string;
};

type QuotationItem = {
  id?: number;
  quotation_id?: number;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  tax_rate: number;
  amount: number;
  created_at?: string;
};

type Quotation = {
  id: number;
  lead_id?: number | null;
  quotation_number: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  valid_until?: string | null;
  payment_terms?: string | null;
  notes?: string | null;
  terms_conditions?: string | null;
  cgst: number;
  sgst: number;
  igst: number;
};

type Staff = {
  id: string;
  user_id?: string;
  full_name: string;
  role: string;
  department: string;
  is_active: boolean;
};

type FormState = {
  lead_id: string;
  valid_until: string;
  payment_terms: string;
  notes: string;
  terms_conditions: string;
  gst_type: 'NONE' | 'CGST_SGST' | 'IGST';
  gst_rate: number;
};

const COMPANY = {
  name: 'SRL INFRA DEVELOPERS',
  tagline: 'Where expectations meet reality',
  address: [
    'D Mart Road, Near SRR Clg Chowrasta',
    'Karimnagar, Telangana',
  ],
  phone: '7416964666',
  phone2: '8783546061',
  website: 'www.srlinfra.in',
};

const DEFAULT_TERMS = `1. This quotation is valid until the validity date mentioned above.
2. Scope of work shall be as mutually agreed between SRL INFRA DEVELOPERS and the client.
3. Any additional work or changes outside the agreed scope may be quoted separately.
4. Payment terms shall be as mutually agreed and mentioned in this quotation.
5. Delivery and execution timelines are subject to project scope, site conditions and client approvals.
6. Applicable taxes will be charged as specified in the quotation.
7. Material specifications and brands shall be finalized as mutually agreed.
8. This quotation is subject to final confirmation and approval by both parties.`;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value?: string | null) => {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const emptyItem = (): QuotationItem => ({
  description: '',
  quantity: 1,
  unit: 'Nos',
  rate: 0,
  tax_rate: 0,
  amount: 0,
});

const emptyForm = (): FormState => ({
  lead_id: '',
  valid_until: '',
  payment_terms: '',
  notes: '',
  terms_conditions: DEFAULT_TERMS,
  gst_type: 'NONE',
  gst_rate: 0,
});

const statusOptions = [
  'DRAFT',
  'SENT',
  'NEGOTIATION',
  'APPROVED',
  'REJECTED',
];

export default function Quotations() {
  const navigate = useNavigate();

  const [staff, setStaff] = useState<Staff | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selectedQuotation, setSelectedQuotation] =
    useState<Quotation | null>(null);

  const [selectedItems, setSelectedItems] = useState<QuotationItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [form, setForm] = useState<FormState>(emptyForm());
  const [items, setItems] = useState<QuotationItem[]>([emptyItem()]);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error('Please login first.');
      }

      const { data: staffData, error: staffError } =
        await supabase
          .from('staff')
          .select(
            'id, user_id, full_name, role, department, is_active'
          )
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

      if (staffError) throw staffError;

      if (!staffData) {
        throw new Error(
          'Your account is not registered as an active SRL staff member.'
        );
      }

      const role = staffData.role?.toUpperCase();    
      if (role !== 'ADMIN' && role !== 'MANAGER') {
        throw new Error(
          'Quotation management is available only to administrators.'
        );
      }

      await loadData();
    } catch (err: any) {
      console.error('Quotation initialization failed:', err);

      setError(
        err?.message ||
          'Unable to initialize quotation management.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    const [
      { data: quotationData, error: quotationError },
      { data: leadData, error: leadError },
    ] = await Promise.all([
      supabase
        .from('quotations')
        .select('*')
        .order('created_at', {
          ascending: false,
        }),

      supabase
        .from('leads')
        .select('*')
        .order('created_at', {
          ascending: false,
        }),
    ]);

    if (quotationError) throw quotationError;
    if (leadError) throw leadError;

    setQuotations(
      (quotationData || []) as Quotation[]
    );

    setLeads(
      (leadData || []) as Lead[]
    );
  };

  const loadQuotationItems = async (
    quotationId: number
  ) => {
    const { data, error } = await supabase
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', quotationId)
      .order('created_at', {
        ascending: true,
      });

    if (error) throw error;

    const result =
      (data || []) as QuotationItem[];

    setSelectedItems(result);

    return result;
  };

  const getLead = (
    leadId?: number | null
  ) =>
    leads.find(
      (lead) =>
        Number(lead.id) ===
        Number(leadId)
    );

  const getLeadName = (
    leadId?: number | null
  ) => {
    const lead = getLead(leadId);

    if (!lead) {
      return 'Unknown Lead';
    }

    return (
      lead.client_name ||
      lead.company_name ||
      `Lead #${lead.id}`
    );
  };

  const generateQuotationNumber = () => {
    const year =
      new Date().getFullYear();

    const numbers = quotations
      .map((quotation) => {
        const match =
          quotation.quotation_number?.match(
            /QT-(\d{4})-(\d+)/
          );

        if (!match) return 0;

        if (
          Number(match[1]) !==
          year
        ) {
          return 0;
        }

        return Number(match[2]) || 0;
      })
      .filter(Boolean);

    const nextNumber =
      numbers.length > 0
        ? Math.max(...numbers) + 1
        : 1;

    return `QT-${year}-${String(
      nextNumber
    ).padStart(4, '0')}`;
  };

  const updateItem = (
    index: number,
    field: keyof QuotationItem,
    value: string | number
  ) => {
    setItems((previous) => {
      const updated = [...previous];

      const item = {
        ...updated[index],
        [field]: value,
      };

      const quantity =
        Number(item.quantity || 0);

      const rate =
        Number(item.rate || 0);

      item.amount =
        quantity * rate;

      updated[index] = item;

      return updated;
    });
  };

  const addItem = () => {
    setItems((previous) => [
      ...previous,
      emptyItem(),
    ]);
  };

  const removeItem = (
    index: number
  ) => {
    setItems((previous) => {
      if (previous.length === 1) {
        return [emptyItem()];
      }

      return previous.filter(
        (_, itemIndex) =>
          itemIndex !== index
      );
    });
  };

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          Number(item.amount || 0),
        0
      ),
    [items]
  );

  const taxableAmount = Math.max(
    0,
    subtotal -
      Number(discount || 0)
  );

  const totalTax = useMemo(() => {
    const rate =
      Number(form.gst_rate || 0);

    if (
      !rate ||
      form.gst_type === 'NONE'
    ) {
      return 0;
    }

    return (
      (taxableAmount * rate) /
      100
    );
  }, [
    taxableAmount,
    form.gst_rate,
    form.gst_type,
  ]);

  const cgst =
    form.gst_type ===
    'CGST_SGST'
      ? totalTax / 2
      : 0;

  const sgst =
    form.gst_type ===
    'CGST_SGST'
      ? totalTax / 2
      : 0;

  const igst =
    form.gst_type === 'IGST'
      ? totalTax
      : 0;

  const grandTotal =
    taxableAmount + totalTax;

  const filteredQuotations =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return quotations.filter(
        (quotation) => {
          const lead = getLead(
            quotation.lead_id
          );

          const matchesSearch =
            !query ||
            quotation.quotation_number
              ?.toLowerCase()
              .includes(query) ||
            lead?.client_name
              ?.toLowerCase()
              .includes(query) ||
            lead?.company_name
              ?.toLowerCase()
              .includes(query) ||
            lead?.phone
              ?.toLowerCase()
              .includes(query) ||
            lead?.project_type
              ?.toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter === 'ALL' ||
            quotation.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      quotations,
      leads,
      search,
      statusFilter,
    ]);

  const resetForm = () => {
    setForm(emptyForm());
    setItems([emptyItem()]);
    setDiscount(0);
  };

  const openCreate = () => {
    resetForm();
    setShowCreate(true);
  };

  const createQuotation = async () => {
    if (!staff) {
      alert(
        'Staff session not found.'
      );
      return;
    }

    if (!form.lead_id) {
      alert(
        'Please select a lead.'
      );
      return;
    }

    const validItems =
      items.filter(
        (item) =>
          item.description.trim() &&
          Number(item.quantity) > 0
      );

    if (
      validItems.length === 0
    ) {
      alert(
        'Please add at least one quotation item.'
      );
      return;
    }

    try {
      setSaving(true);

      const quotationNumber =
        generateQuotationNumber();

      const {
        data: quotation,
        error: quotationError,
      } = await supabase
        .from('quotations')
        .insert({
          lead_id:
            Number(form.lead_id),

          quotation_number:
            quotationNumber,

          subtotal,

          tax_amount:
            totalTax,

          discount_amount:
            Number(discount || 0),

          total_amount:
            grandTotal,

          status: 'DRAFT',

          created_by:
            staff.id,

          valid_until:
            form.valid_until ||
            null,

          payment_terms:
            form.payment_terms ||
            null,

          notes:
            form.notes || null,

          terms_conditions:
            form.terms_conditions ||
            null,

          cgst,

          sgst,

          igst,
        })
        .select()
        .single();

      if (quotationError) {
        throw quotationError;
      }

      const quotationItems =
        validItems.map(
          (item) => ({
            quotation_id:
              quotation.id,

            description:
              item.description.trim(),

            quantity:
              Number(
                item.quantity || 0
              ),

            unit:
              item.unit || 'Nos',

            rate:
              Number(
                item.rate || 0
              ),

            tax_rate:
              Number(
                form.gst_rate || 0
              ),

            amount:
              Number(
                item.amount || 0
              ),
          })
        );

      const {
        error: itemError,
      } = await supabase
        .from('quotation_items')
        .insert(
          quotationItems
        );

      if (itemError) {
        await supabase
          .from('quotations')
          .delete()
          .eq(
            'id',
            quotation.id
          );

        throw itemError;
      }

      alert(
        `Quotation ${quotationNumber} created successfully.`
      );

      setShowCreate(false);

      resetForm();

      await loadData();
    } catch (err: any) {
      console.error(
        'Quotation creation failed:',
        err
      );

      alert(
        err?.message ||
          'Failed to create quotation.'
      );
    } finally {
      setSaving(false);
    }
  };

  const openQuotation = async (
    quotation: Quotation
  ) => {
    try {
      setSelectedQuotation(
        quotation
      );

      await loadQuotationItems(
        quotation.id
      );

      setShowDetails(true);
    } catch (err: any) {
      console.error(err);

      alert(
        err?.message ||
          'Unable to load quotation items.'
      );
    }
  };

  const openEdit = async (
    quotation: Quotation
  ) => {
    try {
      setSelectedQuotation(
        quotation
      );

      const quotationItems =
        await loadQuotationItems(
          quotation.id
        );

      let gstType:
        | 'NONE'
        | 'CGST_SGST'
        | 'IGST' = 'NONE';

      const tax =
        Number(
          quotation.tax_amount || 0
        );

      if (
        Number(
          quotation.cgst || 0
        ) > 0 ||
        Number(
          quotation.sgst || 0
        ) > 0
      ) {
        gstType =
          'CGST_SGST';
      } else if (
        Number(
          quotation.igst || 0
        ) > 0
      ) {
        gstType = 'IGST';
      }

      const taxable =
        Math.max(
          0,
          Number(
            quotation.subtotal || 0
          ) -
            Number(
              quotation.discount_amount ||
                0
            )
        );

      const calculatedRate =
        taxable > 0 &&
        tax > 0
          ? Number(
              (
                (tax / taxable) *
                100
              ).toFixed(2)
            )
          : 0;

      setForm({
        lead_id:
          quotation.lead_id
            ? String(
                quotation.lead_id
              )
            : '',

        valid_until:
          quotation.valid_until
            ? String(
                quotation.valid_until
              ).slice(0, 10)
            : '',

        payment_terms:
          quotation.payment_terms ||
          '',

        notes:
          quotation.notes || '',

        terms_conditions:
          quotation.terms_conditions ||
          DEFAULT_TERMS,

        gst_type:
          gstType,

        gst_rate:
          calculatedRate,
      });

      setDiscount(
        Number(
          quotation.discount_amount ||
            0
        )
      );

      setItems(
        quotationItems.length > 0
          ? quotationItems.map(
              (item) => ({
                id: item.id,

                quotation_id:
                  item.quotation_id,

                description:
                  item.description ||
                  '',

                quantity:
                  Number(
                    item.quantity || 0
                  ),

                unit:
                  item.unit || 'Nos',

                rate:
                  Number(
                    item.rate || 0
                  ),

                tax_rate:
                  Number(
                    item.tax_rate ||
                      0
                  ),

                amount:
                  Number(
                    item.amount ||
                      0
                  ),
              })
            )
          : [emptyItem()]
      );

      setShowDetails(false);
      setShowEdit(true);
    } catch (err: any) {
      console.error(err);

      alert(
        err?.message ||
          'Unable to open quotation.'
      );
    }
  };

  const saveEdit = async () => {
    if (!selectedQuotation) {
      return;
    }

    if (!form.lead_id) {
      alert(
        'Please select a lead.'
      );
      return;
    }

    const validItems =
      items.filter(
        (item) =>
          item.description.trim() &&
          Number(item.quantity) > 0
      );

    if (
      validItems.length === 0
    ) {
      alert(
        'Please add at least one quotation item.'
      );
      return;
    }

    try {
      setSaving(true);

      const {
        data: updated,
        error,
      } = await supabase
        .from('quotations')
        .update({
          lead_id:
            Number(form.lead_id),

          subtotal,

          tax_amount:
            totalTax,

          discount_amount:
            Number(discount || 0),

          total_amount:
            grandTotal,

          valid_until:
            form.valid_until ||
            null,

          payment_terms:
            form.payment_terms ||
            null,

          notes:
            form.notes || null,

          terms_conditions:
            form.terms_conditions ||
            null,

          cgst,

          sgst,

          igst,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          selectedQuotation.id
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      const {
        error: deleteItemsError,
      } = await supabase
        .from('quotation_items')
        .delete()
        .eq(
          'quotation_id',
          selectedQuotation.id
        );

      if (deleteItemsError) {
        throw deleteItemsError;
      }

      const quotationItems =
        validItems.map(
          (item) => ({
            quotation_id:
              selectedQuotation.id,

            description:
              item.description.trim(),

            quantity:
              Number(
                item.quantity || 0
              ),

            unit:
              item.unit || 'Nos',

            rate:
              Number(
                item.rate || 0
              ),

            tax_rate:
              Number(
                form.gst_rate || 0
              ),

            amount:
              Number(
                item.amount || 0
              ),
          })
        );

      const {
        error: itemError,
      } = await supabase
        .from('quotation_items')
        .insert(
          quotationItems
        );

      if (itemError) {
        throw itemError;
      }

      setSelectedQuotation(
        updated as Quotation
      );

      setShowEdit(false);

      await loadData();

      await loadQuotationItems(
        selectedQuotation.id
      );

      setShowDetails(true);

      alert(
        'Quotation updated successfully.'
      );
    } catch (err: any) {
      console.error(
        'Quotation update failed:',
        err
      );

      alert(
        err?.message ||
          'Failed to update quotation.'
      );
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (
    quotation: Quotation,
    status: string
  ) => {
    try {
      const {
        data,
        error,
      } = await supabase
        .from('quotations')
        .update({
          status,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          quotation.id
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      setQuotations(
        (previous) =>
          previous.map(
            (item) =>
              item.id ===
              quotation.id
                ? (data as Quotation)
                : item
          )
      );

      if (
        selectedQuotation?.id ===
        quotation.id
      ) {
        setSelectedQuotation(
          data as Quotation
        );
      }
    } catch (err: any) {
      console.error(err);

      alert(
        err?.message ||
          'Unable to update quotation status.'
      );
    }
  };

  const deleteQuotation = async () => {
    if (!selectedQuotation) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete quotation ${selectedQuotation.quotation_number}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      const {
        error: itemError,
      } = await supabase
        .from('quotation_items')
        .delete()
        .eq(
          'quotation_id',
          selectedQuotation.id
        );

      if (itemError) {
        throw itemError;
      }

      const { error } =
        await supabase
          .from('quotations')
          .delete()
          .eq(
            'id',
            selectedQuotation.id
          );

      if (error) {
        throw error;
      }

      setQuotations(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              selectedQuotation.id
          )
      );

      setSelectedQuotation(null);
      setSelectedItems([]);
      setShowDetails(false);

      alert(
        'Quotation deleted successfully.'
      );
    } catch (err: any) {
      console.error(err);

      alert(
        err?.message ||
          'Unable to delete quotation.'
      );
    } finally {
      setSaving(false);
    }
  };

  const printQuotation = () => {
    if (!selectedQuotation) {
      return;
    }

    const lead = getLead(
      selectedQuotation.lead_id
    );

    const quotationItems =
      selectedItems;

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${escapeHtml(
      selectedQuotation.quotation_number
    )}</title>

<style>

@page {
  size: A4;
  margin: 14mm;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  color: #222;
  background: white;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
  border-bottom: 3px solid #9a641f;
  padding-bottom: 15px;
}

.brand {
  width: 270px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-shrink: 0;
}

.logo {
  width: 85px;
  height: 85px;
  object-fit: contain;
}

.wordmark {
  width: 220px;
  height: auto;
  max-height: 65px;
  object-fit: contain;
}

.company {
  flex: 1;
  text-align: right;
}

.company .tagline {
  font-size: 12px;
  font-weight: 600;
  font-style: italic;
  margin-bottom: 8px;
}

.company p {
  margin: 3px 0;
  font-size: 10px;
}

.title {
  text-align: center;
  margin: 25px 0;
}

.title h2 {
  margin: 0;
  font-size: 25px;
  letter-spacing: 2px;
}

.meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.box {
  border: 1px solid #ddd;
  padding: 12px;
  border-radius: 5px;
}

.box h3 {
  margin: 0 0 8px;
  color: #9a641f;
  font-size: 13px;
}

.box p {
  margin: 4px 0;
  font-size: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th {
  background: #222;
  color: white;
  padding: 8px;
  font-size: 10px;
  text-align: left;
}

td {
  border: 1px solid #ddd;
  padding: 8px;
  font-size: 10px;
}

.right {
  text-align: right;
}

.summary {
  width: 320px;
  margin-left: auto;
  margin-top: 20px;
}

.summary div {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 11px;
}

.total {
  border-top: 2px solid #222;
  font-size: 15px !important;
  font-weight: bold;
}

.section {
  margin-top: 25px;
}

.section h3 {
  font-size: 13px;
  color: #9a641f;
  border-bottom: 1px solid #ddd;
  padding-bottom: 5px;
}

.section p {
  font-size: 10px;
  line-height: 1.6;
  white-space: pre-line;
}

.footer {
  margin-top: 35px;
  border-top: 1px solid #ddd;
  padding-top: 10px;
  text-align: center;
  font-size: 9px;
  color: #666;
}

@media print {
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}

</style>
</head>

<body>

<div class="header">

  <div class="brand">

    <img
      src="/logo.png"
      class="logo"
      alt="SRL Logo"
    />

    <img
      src="/srl-wordmark.png"
      class="wordmark"
      alt="SRL INFRA DEVELOPERS"
    />

  </div>

  <div class="company">

    <div class="tagline">
      ${escapeHtml(
        COMPANY.tagline
      )}
    </div>

    <p>
      ${escapeHtml(
        COMPANY.address[0]
      )}
    </p>

    <p>
      ${escapeHtml(
        COMPANY.address[1]
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
  <h2>QUOTATION</h2>
</div>

<div class="meta">

  <div class="box">

    <h3>Quotation Details</h3>

    <p>
      <strong>Quotation No:</strong>
      ${escapeHtml(
        selectedQuotation.quotation_number
      )}
    </p>

    <p>
      <strong>Date:</strong>
      ${formatDate(
        selectedQuotation.created_at
      )}
    </p>

    <p>
      <strong>Valid Until:</strong>
      ${formatDate(
        selectedQuotation.valid_until
      )}
    </p>

    <p>
      <strong>Status:</strong>
      ${escapeHtml(
        selectedQuotation.status
      )}
    </p>

  </div>

  <div class="box">

    <h3>Client Details</h3>

    <p>
      <strong>Name:</strong>
      ${escapeHtml(
        lead?.client_name ||
          lead?.company_name ||
          '—'
      )}
    </p>

    <p>
      <strong>Company:</strong>
      ${escapeHtml(
        lead?.company_name ||
          '—'
      )}
    </p>

    <p>
      <strong>Phone:</strong>
      ${escapeHtml(
        lead?.phone || '—'
      )}
    </p>

    <p>
      <strong>Email:</strong>
      ${escapeHtml(
        lead?.email || '—'
      )}
    </p>

    <p>
      <strong>Project:</strong>
      ${escapeHtml(
        lead?.project_type ||
          '—'
      )}
    </p>

  </div>

</div>

<table>

  <thead>

    <tr>
      <th>#</th>
      <th>Description</th>
      <th>Qty</th>
      <th>Unit</th>
      <th>Rate</th>
      <th>Amount</th>
    </tr>

  </thead>

  <tbody>

    ${quotationItems
      .map(
        (item, index) => `
          <tr>

            <td>
              ${index + 1}
            </td>

            <td>
              ${escapeHtml(
                item.description
              )}
            </td>

            <td class="right">
              ${Number(
                item.quantity
              ).toFixed(2)}
            </td>

            <td>
              ${escapeHtml(
                item.unit
              )}
            </td>

            <td class="right">
              ${formatCurrency(
                Number(
                  item.rate
                )
              )}
            </td>

            <td class="right">
              ${formatCurrency(
                Number(
                  item.amount
                )
              )}
            </td>

          </tr>
        `
      )
      .join('')}

  </tbody>

</table>

<div class="summary">

  <div>
    <span>Subtotal</span>
    <strong>
      ${formatCurrency(
        Number(
          selectedQuotation.subtotal
        )
      )}
    </strong>
  </div>

  <div>
    <span>Discount</span>
    <strong>
      -
      ${formatCurrency(
        Number(
          selectedQuotation.discount_amount
        )
      )}
    </strong>
  </div>

  ${
    Number(
      selectedQuotation.cgst
    ) > 0
      ? `
        <div>
          <span>CGST</span>
          <strong>
            ${formatCurrency(
              Number(
                selectedQuotation.cgst
              )
            )}
          </strong>
        </div>

        <div>
          <span>SGST</span>
          <strong>
            ${formatCurrency(
              Number(
                selectedQuotation.sgst
              )
            )}
          </strong>
        </div>
      `
      : ''
  }

  ${
    Number(
      selectedQuotation.igst
    ) > 0
      ? `
        <div>
          <span>IGST</span>
          <strong>
            ${formatCurrency(
              Number(
                selectedQuotation.igst
              )
            )}
          </strong>
        </div>
      `
      : ''
  }

  <div class="total">

    <span>
      Total
    </span>

    <strong>
      ${formatCurrency(
        Number(
          selectedQuotation.total_amount
        )
      )}
    </strong>

  </div>

</div>

${
  selectedQuotation.payment_terms
    ? `
      <div class="section">

        <h3>
          Payment Terms
        </h3>

        <p>
          ${escapeHtml(
            selectedQuotation.payment_terms
          )}
        </p>

      </div>
    `
    : ''
}

<div class="section">

  <h3>
    Terms & Conditions
  </h3>

  <p>
    ${escapeHtml(
      selectedQuotation.terms_conditions ||
        DEFAULT_TERMS
    )}
  </p>

</div>

${
  selectedQuotation.notes
    ? `
      <div class="section">

        <h3>
          Notes
        </h3>

        <p>
          ${escapeHtml(
            selectedQuotation.notes
          )}
        </p>

      </div>
    `
    : ''
}

<div class="footer">

  SRL INFRA DEVELOPERS —
  Where expectations meet reality

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
        'width=900,height=700'
      );

    if (!printWindow) {
      alert(
        'Please allow pop-ups to print the quotation.'
      );
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleCreateInvoice = () => {
    if (!selectedQuotation) {
      return;
    }

    if (
      selectedQuotation.status !==
      'APPROVED'
    ) {
      alert(
        'Only APPROVED quotations can be converted into an invoice.'
      );
      return;
    }

    navigate(
      `/portal/invoices?quotation=${selectedQuotation.id}`
    );
  };

  const stats = {
    total: quotations.length,

    draft: quotations.filter(
      (item) =>
        item.status === 'DRAFT'
    ).length,

    sent: quotations.filter(
      (item) =>
        item.status === 'SENT'
    ).length,

    approved: quotations.filter(
      (item) =>
        item.status === 'APPROVED'
    ).length,

    totalValue:
      quotations.reduce(
        (sum, item) =>
          sum +
          Number(
            item.total_amount || 0
          ),
        0
      ),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

        <div className="text-center">

          <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />

          <p className="text-gray-600">
            Loading quotations...
          </p>

        </div>

      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">

        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full">

          <h2 className="text-xl font-bold text-red-600 mb-3">
            Quotation Access Error
          </h2>

          <p className="text-gray-700 mb-6">
            {error}
          </p>

          <button
            onClick={() =>
              navigate('/portal')
            }
            className="px-5 py-3 bg-black text-white rounded-lg"
          >
            Back to Dashboard
          </button>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">

      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

          <div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Quotations
            </h1>

            <p className="text-gray-500 mt-1">
              Create, manage and approve client quotations
            </p>

          </div>

          <button
            onClick={openCreate}
            className="px-5 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800"
          >
            + Create Quotation
          </button>

        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">

          <div className="bg-white rounded-xl p-5 shadow-sm border">

            <p className="text-sm text-gray-500">
              Total
            </p>

            <p className="text-2xl font-bold mt-1">
              {stats.total}
            </p>

          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border">

            <p className="text-sm text-gray-500">
              Draft
            </p>

            <p className="text-2xl font-bold mt-1">
              {stats.draft}
            </p>

          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border">

            <p className="text-sm text-gray-500">
              Sent
            </p>

            <p className="text-2xl font-bold mt-1">
              {stats.sent}
            </p>

          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border">

            <p className="text-sm text-gray-500">
              Approved
            </p>

            <p className="text-2xl font-bold mt-1">
              {stats.approved}
            </p>

          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border col-span-2 md:col-span-1">

            <p className="text-sm text-gray-500">
              Total Value
            </p>

            <p className="text-lg font-bold mt-1">
              {formatCurrency(
                stats.totalValue
              )}
            </p>

          </div>

        </div>

        <div className="bg-white rounded-xl border shadow-sm p-4 mb-5">

          <div className="grid md:grid-cols-2 gap-3">

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search quotation, client, company, phone..."
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-gray-300"
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="w-full border rounded-lg px-4 py-3"
            >

              <option value="ALL">
                All Statuses
              </option>

              {statusOptions.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                )
              )}

            </select>

          </div>

        </div>

        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[950px]">

              <thead>

                <tr className="bg-gray-900 text-white text-sm">

                  <th className="text-left px-5 py-4">
                    Quotation
                  </th>

                  <th className="text-left px-5 py-4">
                    Client
                  </th>

                  <th className="text-left px-5 py-4">
                    Project
                  </th>

                  <th className="text-left px-5 py-4">
                    Date
                  </th>

                  <th className="text-right px-5 py-4">
                    Amount
                  </th>

                  <th className="text-left px-5 py-4">
                    Status
                  </th>

                  <th className="text-right px-5 py-4">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredQuotations.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan={7}
                      className="text-center py-12 text-gray-500"
                    >
                      No quotations found.
                    </td>

                  </tr>

                ) : (

                  filteredQuotations.map(
                    (quotation) => {

                      const lead =
                        getLead(
                          quotation.lead_id
                        );

                      return (
                        <tr
                          key={
                            quotation.id
                          }
                          className="border-b hover:bg-gray-50"
                        >

                          <td className="px-5 py-4">

                            <button
                              onClick={() =>
                                openQuotation(
                                  quotation
                                )
                              }
                              className="font-semibold text-gray-900 hover:underline"
                            >
                              {
                                quotation.quotation_number
                              }
                            </button>

                          </td>

                          <td className="px-5 py-4">

                            <p className="font-medium">
                              {lead?.client_name ||
                                lead?.company_name ||
                                'Unknown'}
                            </p>

                            {lead?.phone && (
                              <p className="text-xs text-gray-500">
                                {
                                  lead.phone
                                }
                              </p>
                            )}

                          </td>

                          <td className="px-5 py-4">

                            <span className="text-sm">
                              {
                                lead?.project_type ||
                                '—'
                              }
                            </span>

                          </td>

                          <td className="px-5 py-4 text-sm">
                            {formatDate(
                              quotation.created_at
                            )}
                          </td>

                          <td className="px-5 py-4 text-right font-semibold">
                            {formatCurrency(
                              Number(
                                quotation.total_amount
                              )
                            )}
                          </td>

                          <td className="px-5 py-4">

                            <select
                              value={
                                quotation.status
                              }
                              onChange={(e) =>
                                updateStatus(
                                  quotation,
                                  e.target.value
                                )
                              }
                              className="border rounded-lg px-3 py-2 text-sm"
                            >

                              {statusOptions.map(
                                (status) => (
                                  <option
                                    key={
                                      status
                                    }
                                    value={
                                      status
                                    }
                                  >
                                    {status}
                                  </option>
                                )
                              )}

                            </select>

                          </td>

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-2">

                              <button
                                onClick={() =>
                                  openQuotation(
                                    quotation
                                  )
                                }
                                className="px-3 py-2 border rounded-lg text-sm"
                              >
                                View
                              </button>

                              <button
                                onClick={() =>
                                  openEdit(
                                    quotation
                                  )
                                }
                                className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm"
                              >
                                Edit
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {showCreate && (

        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto p-4">

          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl my-6">

            <div className="p-6 border-b flex justify-between items-center">

              <div>

                <h2 className="text-xl font-bold">
                  Create Quotation
                </h2>

                <p className="text-sm text-gray-500">
                  Create quotation from an existing lead
                </p>

              </div>

              <button
                onClick={() =>
                  setShowCreate(false)
                }
                className="text-2xl text-gray-500"
              >
                ×
              </button>

            </div>

            <div className="p-6">

              <div className="grid md:grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Select Lead *
                  </label>

                  <select
                    value={form.lead_id}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        lead_id:
                          e.target.value,
                      })
                    }
                    className="w-full border rounded-lg px-4 py-3"
                  >

                    <option value="">
                      Select Lead
                    </option>

                    {leads.map(
                      (lead) => (
                        <option
                          key={lead.id}
                          value={lead.id}
                        >
                          #{lead.id} —{' '}
                          {lead.client_name ||
                            lead.company_name ||
                            'Unknown'}
                          {lead.project_type
                            ? ` — ${lead.project_type}`
                            : ''}
                        </option>
                      )
                    )}

                  </select>

                </div>

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Valid Until
                  </label>

                  <input
                    type="date"
                    value={
                      form.valid_until
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        valid_until:
                          e.target.value,
                      })
                    }
                    className="w-full border rounded-lg px-4 py-3"
                  />

                </div>

              </div>

              <div className="mt-6">

                <div className="flex justify-between items-center mb-3">

                  <h3 className="font-semibold">
                    Quotation Items
                  </h3>

                  <button
                    onClick={addItem}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm"
                  >
                    + Add Item
                  </button>

                </div>

                <div className="overflow-x-auto border rounded-xl">

                  <table className="w-full min-w-[800px]">

                    <thead>

                      <tr className="bg-gray-100 text-sm">

                        <th className="text-left px-3 py-3">
                          Description
                        </th>

                        <th className="px-3 py-3">
                          Qty
                        </th>

                        <th className="px-3 py-3">
                          Unit
                        </th>

                        <th className="px-3 py-3">
                          Rate
                        </th>

                        <th className="text-right px-3 py-3">
                          Amount
                        </th>

                        <th className="px-3 py-3">
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {items.map(
                        (item, index) => (

                          <tr
                            key={index}
                            className="border-t"
                          >

                            <td className="px-3 py-3">

                              <input
                                value={
                                  item.description
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    'description',
                                    e.target.value
                                  )
                                }
                                placeholder="Product / Service"
                                className="w-full border rounded-lg px-3 py-2"
                              />

                            </td>

                            <td className="px-3 py-3">

                              <input
                                type="number"
                                min="0"
                                value={
                                  item.quantity
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    'quantity',
                                    Number(
                                      e.target.value
                                    )
                                  )
                                }
                                className="w-24 border rounded-lg px-3 py-2"
                              />

                            </td>

                            <td className="px-3 py-3">

                              <input
                                value={
                                  item.unit
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    'unit',
                                    e.target.value
                                  )
                                }
                                className="w-24 border rounded-lg px-3 py-2"
                              />

                            </td>

                            <td className="px-3 py-3">

                              <input
                                type="number"
                                min="0"
                                value={
                                  item.rate
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    'rate',
                                    Number(
                                      e.target.value
                                    )
                                  )
                                }
                                className="w-32 border rounded-lg px-3 py-2"
                              />

                            </td>

                            <td className="px-3 py-3 text-right font-medium">
                              {formatCurrency(
                                item.amount
                              )}
                            </td>

                            <td className="px-3 py-3">

                              <button
                                onClick={() =>
                                  removeItem(
                                    index
                                  )
                                }
                                className="text-red-600"
                              >
                                Remove
                              </button>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-6">

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Payment Terms
                  </label>

                  <textarea
                    value={
                      form.payment_terms
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        payment_terms:
                          e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full border rounded-lg px-4 py-3"
                    placeholder="Example: 50% advance, 50% on completion"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Notes
                  </label>

                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        notes:
                          e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full border rounded-lg px-4 py-3"
                  />

                </div>

              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-6">

                <div>

                  <label className="block text-sm font-medium mb-2">
                    GST Type
                  </label>

                  <select
                    value={
                      form.gst_type
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        gst_type:
                          e.target
                            .value as FormState['gst_type'],
                      })
                    }
                    className="w-full border rounded-lg px-4 py-3"
                  >

                    <option value="NONE">
                      No GST
                    </option>

                    <option value="CGST_SGST">
                      CGST + SGST
                    </option>

                    <option value="IGST">
                      IGST
                    </option>

                  </select>

                </div>

                <div>

                  <label className="block text-sm font-medium mb-2">
                    GST Rate %
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.gst_rate
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        gst_rate:
                          Number(
                            e.target.value
                          ),
                      })
                    }
                    className="w-full border rounded-lg px-4 py-3"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Discount
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) =>
                      setDiscount(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    className="w-full border rounded-lg px-4 py-3"
                  />

                </div>

              </div>

              <div className="mt-6 bg-gray-50 rounded-xl p-5">

                <div className="flex justify-between py-2">

                  <span>
                    Subtotal
                  </span>

                  <strong>
                    {formatCurrency(
                      subtotal
                    )}
                  </strong>

                </div>

                <div className="flex justify-between py-2">

                  <span>
                    Discount
                  </span>

                  <strong>
                    -{' '}
                    {formatCurrency(
                      discount
                    )}
                  </strong>

                </div>

                {cgst > 0 && (
                  <div className="flex justify-between py-2">

                    <span>
                      CGST
                    </span>

                    <strong>
                      {formatCurrency(
                        cgst
                      )}
                    </strong>

                  </div>
                )}

                {sgst > 0 && (
                  <div className="flex justify-between py-2">

                    <span>
                      SGST
                    </span>

                    <strong>
                      {formatCurrency(
                        sgst
                      )}
                    </strong>

                  </div>
                )}

                {igst > 0 && (
                  <div className="flex justify-between py-2">

                    <span>
                      IGST
                    </span>

                    <strong>
                      {formatCurrency(
                        igst
                      )}
                    </strong>

                  </div>
                )}

                <div className="flex justify-between border-t mt-3 pt-3 text-lg">

                  <span className="font-bold">
                    Grand Total
                  </span>

                  <strong>
                    {formatCurrency(
                      grandTotal
                    )}
                  </strong>

                </div>

              </div>

              <div className="mt-6">

                <label className="block text-sm font-medium mb-2">
                  Terms & Conditions
                </label>

                <textarea
                  value={
                    form.terms_conditions
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      terms_conditions:
                        e.target.value,
                    })
                  }
                  rows={8}
                  className="w-full border rounded-lg px-4 py-3"
                />

              </div>

              <div className="flex justify-end gap-3 mt-6">

                <button
                  onClick={() =>
                    setShowCreate(
                      false
                    )
                  }
                  className="px-5 py-3 border rounded-lg"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    createQuotation
                  }
                  disabled={saving}
                  className="px-6 py-3 bg-gray-900 text-white rounded-lg disabled:opacity-50"
                >
                  {saving
                    ? 'Creating...'
                    : 'Create Quotation'}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {showEdit &&
        selectedQuotation && (

          <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto p-4">

            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl my-6">

              <div className="p-6 border-b flex justify-between items-center">

                <div>

                  <h2 className="text-xl font-bold">
                    Edit Quotation
                  </h2>

                  <p className="text-sm text-gray-500">
                    {
                      selectedQuotation.quotation_number
                    }
                  </p>

                </div>

                <button
                  onClick={() =>
                    setShowEdit(false)
                  }
                  className="text-2xl text-gray-500"
                >
                  ×
                </button>

              </div>

              <div className="p-6">

                <div className="grid md:grid-cols-2 gap-4">

                  <div>

                    <label className="block text-sm font-medium mb-2">
                      Lead *
                    </label>

                    <select
                      value={
                        form.lead_id
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          lead_id:
                            e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-4 py-3"
                    >

                      <option value="">
                        Select Lead
                      </option>

                      {leads.map(
                        (lead) => (
                          <option
                            key={
                              lead.id
                            }
                            value={
                              lead.id
                            }
                          >
                            #{lead.id} —{' '}
                            {lead.client_name ||
                              lead.company_name ||
                              'Unknown'}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-2">
                      Valid Until
                    </label>

                    <input
                      type="date"
                      value={
                        form.valid_until
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          valid_until:
                            e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-4 py-3"
                    />

                  </div>

                </div>

                <div className="mt-6">

                  <div className="flex justify-between items-center mb-3">

                    <h3 className="font-semibold">
                      Quotation Items
                    </h3>

                    <button
                      onClick={addItem}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg"
                    >
                      + Add Item
                    </button>

                  </div>

                  <div className="overflow-x-auto border rounded-xl">

                    <table className="w-full min-w-[800px]">

                      <thead>

                        <tr className="bg-gray-100">

                          <th className="text-left px-3 py-3">
                            Description
                          </th>

                          <th className="px-3 py-3">
                            Qty
                          </th>

                          <th className="px-3 py-3">
                            Unit
                          </th>

                          <th className="px-3 py-3">
                            Rate
                          </th>

                          <th className="px-3 py-3">
                            Amount
                          </th>

                          <th />

                        </tr>

                      </thead>

                      <tbody>

                        {items.map(
                          (
                            item,
                            index
                          ) => (

                            <tr
                              key={
                                index
                              }
                              className="border-t"
                            >

                              <td className="px-3 py-3">

                                <input
                                  value={
                                    item.description
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    updateItem(
                                      index,
                                      'description',
                                      e.target
                                        .value
                                    )
                                  }
                                  className="w-full border rounded-lg px-3 py-2"
                                />

                              </td>

                              <td className="px-3 py-3">

                                <input
                                  type="number"
                                  value={
                                    item.quantity
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    updateItem(
                                      index,
                                      'quantity',
                                      Number(
                                        e.target
                                          .value
                                      )
                                    )
                                  }
                                  className="w-24 border rounded-lg px-3 py-2"
                                />

                              </td>

                              <td className="px-3 py-3">

                                <input
                                  value={
                                    item.unit
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    updateItem(
                                      index,
                                      'unit',
                                      e.target
                                        .value
                                    )
                                  }
                                  className="w-24 border rounded-lg px-3 py-2"
                                />

                              </td>

                              <td className="px-3 py-3">

                                <input
                                  type="number"
                                  value={
                                    item.rate
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    updateItem(
                                      index,
                                      'rate',
                                      Number(
                                        e.target
                                          .value
                                      )
                                    )
                                  }
                                  className="w-32 border rounded-lg px-3 py-2"
                                />

                              </td>

                              <td className="px-3 py-3 text-right">

                                {formatCurrency(
                                  item.amount
                                )}

                              </td>

                              <td className="px-3 py-3">

                                <button
                                  onClick={() =>
                                    removeItem(
                                      index
                                    )
                                  }
                                  className="text-red-600"
                                >
                                  Remove
                                </button>

                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-6">

                  <div>

                    <label className="block text-sm font-medium mb-2">
                      GST Type
                    </label>

                    <select
                      value={
                        form.gst_type
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          gst_type:
                            e.target
                              .value as FormState['gst_type'],
                        })
                      }
                      className="w-full border rounded-lg px-4 py-3"
                    >

                      <option value="NONE">
                        No GST
                      </option>

                      <option value="CGST_SGST">
                        CGST + SGST
                      </option>

                      <option value="IGST">
                        IGST
                      </option>

                    </select>

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-2">
                      GST Rate %
                    </label>

                    <input
                      type="number"
                      value={
                        form.gst_rate
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          gst_rate:
                            Number(
                              e.target
                                .value
                            ),
                        })
                      }
                      className="w-full border rounded-lg px-4 py-3"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-2">
                      Discount
                    </label>

                    <input
                      type="number"
                      value={
                        discount
                      }
                      onChange={(e) =>
                        setDiscount(
                          Number(
                            e.target
                              .value
                          )
                        )
                      }
                      className="w-full border rounded-lg px-4 py-3"
                    />

                  </div>

                </div>

                <div className="mt-6 bg-gray-50 rounded-xl p-5">

                  <div className="flex justify-between py-2">

                    <span>
                      Subtotal
                    </span>

                    <strong>
                      {formatCurrency(
                        subtotal
                      )}
                    </strong>

                  </div>

                  <div className="flex justify-between py-2">

                    <span>
                      Discount
                    </span>

                    <strong>
                      -{' '}
                      {formatCurrency(
                        discount
                      )}
                    </strong>

                  </div>

                  {cgst > 0 && (
                    <div className="flex justify-between py-2">

                      <span>
                        CGST
                      </span>

                      <strong>
                        {formatCurrency(
                          cgst
                        )}
                      </strong>

                    </div>
                  )}

                  {sgst > 0 && (
                    <div className="flex justify-between py-2">

                      <span>
                        SGST
                      </span>

                      <strong>
                        {formatCurrency(
                          sgst
                        )}
                      </strong>

                    </div>
                  )}

                  {igst > 0 && (
                    <div className="flex justify-between py-2">

                      <span>
                        IGST
                      </span>

                      <strong>
                        {formatCurrency(
                          igst
                        )}
                      </strong>

                    </div>
                  )}

                  <div className="flex justify-between border-t mt-3 pt-3 text-lg">

                    <span className="font-bold">
                      Grand Total
                    </span>

                    <strong>
                      {formatCurrency(
                        grandTotal
                      )}
                    </strong>

                  </div>

                </div>

                <div className="mt-6">

                  <label className="block text-sm font-medium mb-2">
                    Payment Terms
                  </label>

                  <textarea
                    value={
                      form.payment_terms
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        payment_terms:
                          e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full border rounded-lg px-4 py-3"
                  />

                </div>

                <div className="mt-6">

                  <label className="block text-sm font-medium mb-2">
                    Notes
                  </label>

                  <textarea
                    value={
                      form.notes
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        notes:
                          e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full border rounded-lg px-4 py-3"
                  />

                </div>

                <div className="mt-6">

                  <label className="block text-sm font-medium mb-2">
                    Terms & Conditions
                  </label>

                  <textarea
                    value={
                      form.terms_conditions
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        terms_conditions:
                          e.target.value,
                      })
                    }
                    rows={8}
                    className="w-full border rounded-lg px-4 py-3"
                  />

                </div>

                <div className="flex justify-end gap-3 mt-6">

                  <button
                    onClick={() =>
                      setShowEdit(false)
                    }
                    className="px-5 py-3 border rounded-lg"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="px-6 py-3 bg-gray-900 text-white rounded-lg disabled:opacity-50"
                  >
                    {saving
                      ? 'Saving...'
                      : 'Save Changes'}
                  </button>

                </div>

              </div>

            </div>

          </div>

        )}

      {showDetails &&
        selectedQuotation && (

          <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto p-4">

            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl my-6">

              <div className="p-6 border-b flex justify-between items-center">

                <div>

                  <h2 className="text-2xl font-bold">
                    {
                      selectedQuotation.quotation_number
                    }
                  </h2>

                  <p className="text-gray-500">
                    {getLeadName(
                      selectedQuotation.lead_id
                    )}
                  </p>

                </div>

                <button
                  onClick={() =>
                    setShowDetails(
                      false
                    )
                  }
                  className="text-2xl text-gray-500"
                >
                  ×
                </button>

              </div>

              <div className="p-6">

                <div className="grid md:grid-cols-2 gap-5">

                  <div className="border rounded-xl p-5">

                    <h3 className="font-semibold mb-3">
                      Quotation Details
                    </h3>

                    <p className="text-sm mb-2">
                      <strong>
                        Quotation:
                      </strong>{' '}
                      {
                        selectedQuotation.quotation_number
                      }
                    </p>

                    <p className="text-sm mb-2">
                      <strong>
                        Date:
                      </strong>{' '}
                      {formatDate(
                        selectedQuotation.created_at
                      )}
                    </p>

                    <p className="text-sm mb-2">
                      <strong>
                        Valid Until:
                      </strong>{' '}
                      {formatDate(
                        selectedQuotation.valid_until
                      )}
                    </p>

                    <p className="text-sm">
                      <strong>
                        Status:
                      </strong>{' '}
                      {
                        selectedQuotation.status
                      }
                    </p>

                  </div>

                  <div className="border rounded-xl p-5">

                    <h3 className="font-semibold mb-3">
                      Client
                    </h3>

                    {(() => {

                      const lead =
                        getLead(
                          selectedQuotation.lead_id
                        );

                      return (
                        <>
                          <p className="text-sm mb-2">
                            <strong>
                              Name:
                            </strong>{' '}
                            {lead?.client_name ||
                              '—'}
                          </p>

                          <p className="text-sm mb-2">
                            <strong>
                              Company:
                            </strong>{' '}
                            {lead?.company_name ||
                              '—'}
                          </p>

                          <p className="text-sm mb-2">
                            <strong>
                              Phone:
                            </strong>{' '}
                            {lead?.phone ||
                              '—'}
                          </p>

                          <p className="text-sm mb-2">
                            <strong>
                              Email:
                            </strong>{' '}
                            {lead?.email ||
                              '—'}
                          </p>

                          <p className="text-sm">
                            <strong>
                              Project:
                            </strong>{' '}
                            {lead?.project_type ||
                              '—'}
                          </p>
                        </>
                      );

                    })()}

                  </div>

                </div>

                <div className="mt-6 border rounded-xl overflow-hidden">

                  <div className="px-5 py-4 bg-gray-100 font-semibold">
                    Quotation Items
                  </div>

                  <div className="overflow-x-auto">

                    <table className="w-full">

                      <thead>

                        <tr className="bg-gray-900 text-white text-sm">

                          <th className="text-left px-4 py-3">
                            Description
                          </th>

                          <th className="px-4 py-3">
                            Qty
                          </th>

                          <th className="px-4 py-3">
                            Unit
                          </th>

                          <th className="px-4 py-3">
                            Rate
                          </th>

                          <th className="text-right px-4 py-3">
                            Amount
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {selectedItems.map(
                          (item) => (

                            <tr
                              key={
                                item.id
                              }
                              className="border-t"
                            >

                              <td className="px-4 py-3">
                                {
                                  item.description
                                }
                              </td>

                              <td className="px-4 py-3 text-center">
                                {
                                  item.quantity
                                }
                              </td>

                              <td className="px-4 py-3 text-center">
                                {
                                  item.unit
                                }
                              </td>

                              <td className="px-4 py-3 text-right">
                                {formatCurrency(
                                  Number(
                                    item.rate
                                  )
                                )}
                              </td>

                              <td className="px-4 py-3 text-right font-medium">
                                {formatCurrency(
                                  Number(
                                    item.amount
                                  )
                                )}
                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                </div>

                <div className="max-w-sm ml-auto mt-6 bg-gray-50 rounded-xl p-5">

                  <div className="flex justify-between py-2">

                    <span>
                      Subtotal
                    </span>

                    <strong>
                      {formatCurrency(
                        Number(
                          selectedQuotation.subtotal
                        )
                      )}
                    </strong>

                  </div>

                  <div className="flex justify-between py-2">

                    <span>
                      Discount
                    </span>

                    <strong>
                      -{' '}
                      {formatCurrency(
                        Number(
                          selectedQuotation.discount_amount
                        )
                      )}
                    </strong>

                  </div>

                  {Number(
                    selectedQuotation.cgst
                  ) > 0 && (
                    <div className="flex justify-between py-2">

                      <span>
                        CGST
                      </span>

                      <strong>
                        {formatCurrency(
                          Number(
                            selectedQuotation.cgst
                          )
                        )}
                      </strong>

                    </div>
                  )}

                  {Number(
                    selectedQuotation.sgst
                  ) > 0 && (
                    <div className="flex justify-between py-2">

                      <span>
                        SGST
                      </span>

                      <strong>
                        {formatCurrency(
                          Number(
                            selectedQuotation.sgst
                          )
                        )}
                      </strong>

                    </div>
                  )}

                  {Number(
                    selectedQuotation.igst
                  ) > 0 && (
                    <div className="flex justify-between py-2">

                      <span>
                        IGST
                      </span>

                      <strong>
                        {formatCurrency(
                          Number(
                            selectedQuotation.igst
                          )
                        )}
                      </strong>

                    </div>
                  )}

                  <div className="flex justify-between border-t mt-3 pt-3 text-xl font-bold">

                    <span>
                      Total
                    </span>

                    <span>
                      {formatCurrency(
                        Number(
                          selectedQuotation.total_amount
                        )
                      )}
                    </span>

                  </div>

                </div>

                {selectedQuotation.payment_terms && (
                  <div className="mt-6">

                    <h3 className="font-semibold mb-2">
                      Payment Terms
                    </h3>

                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      {
                        selectedQuotation.payment_terms
                      }
                    </p>

                  </div>
                )}

                {selectedQuotation.terms_conditions && (
                  <div className="mt-6">

                    <h3 className="font-semibold mb-2">
                      Terms & Conditions
                    </h3>

                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      {
                        selectedQuotation.terms_conditions
                      }
                    </p>

                  </div>
                )}

                {selectedQuotation.notes && (
                  <div className="mt-6">

                    <h3 className="font-semibold mb-2">
                      Notes
                    </h3>

                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      {
                        selectedQuotation.notes
                      }
                    </p>

                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-3 mt-8">

                  <button
                    onClick={
                      printQuotation
                    }
                    className="px-5 py-3 border rounded-lg"
                  >
                    Print / PDF
                  </button>

                  <button
                    onClick={() =>
                      openEdit(
                        selectedQuotation
                      )
                    }
                    className="px-5 py-3 bg-gray-900 text-white rounded-lg"
                  >
                    Edit
                  </button>

                  {selectedQuotation.status ===
                    'APPROVED' && (

                    <button
                      onClick={
                        handleCreateInvoice
                      }
                      className="px-5 py-3 bg-green-600 text-white rounded-lg"
                    >
                      Create Invoice
                    </button>

                  )}

                  <button
                    onClick={
                      deleteQuotation
                    }
                    disabled={saving}
                    className="px-5 py-3 bg-red-600 text-white rounded-lg disabled:opacity-50"
                  >
                    Delete
                  </button>

                </div>

              </div>

            </div>

          </div>

        )}

    </div>
  );
}