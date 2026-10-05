import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pb } from '../../lib/pocketbase';

type Client = {
  id: string;
  clientCode?: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  clientType?: string;
  address?: string;
  projectType?: string;
  status?: string;
  created?: string;
};

type QuotationItem = {
  id?: string;
  quotation?: string;
  description: string;
  quantity: number;
  unit?: string;
  rate: number;
  taxRate?: number;
  amount: number;
};

type Quotation = {
  id: string;
  quotationNumber: string;
  client: string;
  quotationDate: string;
  validUntil?: string;
  projectName?: string;
  status: string;
  subtotal: number;
  discount?: number;
  tax?: number;
  grandTotal: number;
  paymentTerms?: string;
  notes?: string;

  gstType?: string;
  gstRate?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;

  termsConditions?: string;

  created?: string;
  updated?: string;
};

const COMPANY = {
  name: 'SRL INFRA DEVELOPERS',
  address: [
    'H.NO: 3, 7-809, D-Mart Road,',
    'Near SRR Signal, Vivekananda Puri,',
    'Karimnagar, Telangana – 505001',
  ],
  phone: '7416964666',
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

const formatCurrency = (value: number = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value?: string) => {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

function generateQuotationNumber(
  existing: Quotation[]
) {
  const year = new Date().getFullYear();

  const numbers = existing
    .map((quotation) => {
      const match =
        quotation.quotationNumber?.match(
          /QT-\d{4}-(\d+)/
        );

      return match ? Number(match[1]) : 0;
    })
    .filter((number) => !Number.isNaN(number));

  const next =
    numbers.length > 0
      ? Math.max(...numbers) + 1
      : 1;

  return `QT-${year}-${String(next).padStart(4, '0')}`;
}

function calculateGST(
  taxableAmount: number,
  gstType: string,
  gstRate: number
) {
  const rate = Number(gstRate || 0);

  if (gstType === 'CGST_SGST') {
    const totalGST =
      taxableAmount * (rate / 100);

    return {
      cgst: totalGST / 2,
      sgst: totalGST / 2,
      igst: 0,
      totalTax: totalGST,
    };
  }

  if (gstType === 'IGST') {
    const igst =
      taxableAmount * (rate / 100);

    return {
      cgst: 0,
      sgst: 0,
      igst,
      totalTax: igst,
    };
  }

  return {
    cgst: 0,
    sgst: 0,
    igst: 0,
    totalTax: 0,
  };
}

export default function Quotations() {
  const navigate = useNavigate();

  const [quotations, setQuotations] =
    useState<Quotation[]>([]);

  const [clients, setClients] =
    useState<Client[]>([]);

  const [selectedQuotation, setSelectedQuotation] =
    useState<Quotation | null>(null);

  const [selectedItems, setSelectedItems] =
    useState<QuotationItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [showDetails, setShowDetails] =
    useState(false);

  const [showCreate, setShowCreate] =
    useState(false);

  const [showEdit, setShowEdit] =
    useState(false);

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('ALL');

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] = useState({
    client: '',
    quotationDate: todayISO(),
    validUntil: '',
    projectName: '',
    status: 'DRAFT',
    paymentTerms: '',
    notes: '',

    gstType: 'NONE',
    gstRate: 0,

    termsConditions: DEFAULT_TERMS,
  });

  const [items, setItems] = useState<QuotationItem[]>([
    {
      description: '',
      quantity: 1,
      unit: 'Nos',
      rate: 0,
      taxRate: 0,
      amount: 0,
    },
  ]);

  const [discount, setDiscount] =
    useState(0);

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        quotationResult,
        clientResult,
      ] = await Promise.all([
        pb.collection('quotations')
          .getFullList<Quotation>({
            sort: '-created',
          }),

        pb.collection('clients')
          .getFullList<Client>({
            sort: 'name',
          }),
      ]);

      setQuotations(quotationResult);
      setClients(clientResult);
    } catch (error) {
      console.error(
        'Failed to load quotations:',
        error
      );

      alert(
        'Unable to load quotation data.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getClient = (
    clientId?: string
  ) =>
    clients.find(
      (client) => client.id === clientId
    );

  const filteredQuotations =
    useMemo(() => {
      return quotations.filter(
        (quotation) => {
          const client =
            getClient(quotation.client);

          const searchText = [
            quotation.quotationNumber,
            quotation.projectName,
            client?.name,
            client?.company,
            client?.phone,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          const matchesSearch =
            searchText.includes(
              search.toLowerCase()
            );

          const matchesStatus =
            statusFilter === 'ALL' ||
            quotation.status === statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      quotations,
      clients,
      search,
      statusFilter,
    ]);

  const stats = useMemo(() => {
    const total =
      quotations.length;

    const draft =
      quotations.filter(
        (quotation) =>
          quotation.status === 'DRAFT'
      ).length;

    const sent =
      quotations.filter(
        (quotation) =>
          quotation.status === 'SENT'
      ).length;

    const negotiation =
      quotations.filter(
        (quotation) =>
          quotation.status ===
          'NEGOTIATION'
      ).length;

    const approved =
      quotations.filter(
        (quotation) =>
          quotation.status === 'APPROVED'
      ).length;

    const value =
      quotations.reduce(
        (sum, quotation) =>
          sum +
          Number(
            quotation.grandTotal || 0
          ),
        0
      );

    return {
      total,
      draft,
      sent,
      negotiation,
      approved,
      value,
    };
  }, [quotations]);

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
      {
        description: '',
        quantity: 1,
        unit: 'Nos',
        rate: 0,
        taxRate: 0,
        amount: 0,
      },
    ]);
  };

  const removeItem = (
    index: number
  ) => {
    setItems((previous) =>
      previous.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
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
    subtotal - Number(discount || 0)
  );

  const gst = calculateGST(
    taxableAmount,
    form.gstType,
    Number(form.gstRate || 0)
  );

  const grandTotal =
    taxableAmount + gst.totalTax;

  const resetForm = () => {
    setForm({
      client: '',
      quotationDate: todayISO(),
      validUntil: '',
      projectName: '',
      status: 'DRAFT',
      paymentTerms: '',
      notes: '',
      gstType: 'NONE',
      gstRate: 0,
      termsConditions: DEFAULT_TERMS,
    });

    setItems([
      {
        description: '',
        quantity: 1,
        unit: 'Nos',
        rate: 0,
        taxRate: 0,
        amount: 0,
      },
    ]);

    setDiscount(0);
  };

  const createQuotation =
    async () => {
      if (!form.client) {
        alert(
          'Please select a client.'
        );
        return;
      }

      const validItems =
        items.filter(
          (item) =>
            item.description.trim() &&
            Number(item.quantity) > 0
        );

      if (validItems.length === 0) {
        alert(
          'Please add at least one quotation item.'
        );
        return;
      }

      try {
        setSaving(true);

        const quotationNumber =
          generateQuotationNumber(
            quotations
          );

        const quotation =
          await pb
            .collection('quotations')
            .create<Quotation>({
              quotationNumber,
              client: form.client,
              quotationDate:
                form.quotationDate,
              validUntil:
                form.validUntil || '',
              projectName:
                form.projectName,
              status: 'DRAFT',
              subtotal,
              discount:
                Number(discount || 0),
              tax: gst.totalTax,
              grandTotal,
              paymentTerms:
                form.paymentTerms,
              notes: form.notes,

              gstType:
                form.gstType,

              gstRate:
                Number(
                  form.gstRate || 0
                ),

              cgst: gst.cgst,
              sgst: gst.sgst,
              igst: gst.igst,

              termsConditions:
                form.termsConditions,
            });

        await Promise.all(
          validItems.map((item) =>
            pb
              .collection(
                'quotation_items'
              )
              .create({
                quotation:
                  quotation.id,
                description:
                  item.description,
                quantity:
                  Number(
                    item.quantity || 0
                  ),
                unit:
                  item.unit || '',
                rate:
                  Number(
                    item.rate || 0
                  ),
                taxRate:
                  Number(
                    item.taxRate || 0
                  ),
                amount:
                  Number(
                    item.amount || 0
                  ),
              })
          )
        );

        alert(
          `Quotation ${quotationNumber} created successfully.`
        );

        setShowCreate(false);
        resetForm();

        await loadData();
      } catch (error: any) {
        console.error(
          'Quotation creation failed:',
          error
        );

        alert(
          error?.message ||
            'Failed to create quotation.'
        );
      } finally {
        setSaving(false);
      }
    };

  const loadQuotationItems =
    async (
      quotationId: string
    ) => {
      try {
        const result =
          await pb
            .collection(
              'quotation_items'
            )
            .getFullList<QuotationItem>({
              filter: `quotation = "${quotationId}"`,
              sort: 'created',
            });

        setSelectedItems(result);

        return result;
      } catch (error) {
        console.error(
          'Failed to load quotation items:',
          error
        );

        setSelectedItems([]);

        return [];
      }
    };

  const openQuotation = async (
    quotation: Quotation
  ) => {
    setSelectedQuotation(
      quotation
    );

    await loadQuotationItems(
      quotation.id
    );

    setShowDetails(true);
  };

  const updateStatus =
    async (
      quotation: Quotation,
      status: string
    ) => {
      try {
        const updated =
          await pb
            .collection('quotations')
            .update<Quotation>(
              quotation.id,
              {
                status,
              }
            );

        setQuotations(
          (previous) =>
            previous.map(
              (item) =>
                item.id === updated.id
                  ? updated
                  : item
            )
        );

        setSelectedQuotation(
          updated
        );
      } catch (error) {
        console.error(error);

        alert(
          'Unable to update quotation status.'
        );
      }
    };

  const handleCreateInvoice =
    () => {
      if (!selectedQuotation) {
        return;
      }

      if (
        selectedQuotation.status !==
        'APPROVED'
      ) {
        alert(
          'Only approved quotations can be converted into invoices.'
        );

        return;
      }

      navigate(
        `/portal/invoices?quotation=${selectedQuotation.id}`
      );
    };

  const startEdit =
    async () => {
      if (!selectedQuotation) {
        return;
      }

      const quotationItems =
        await loadQuotationItems(
          selectedQuotation.id
        );

      setForm({
        client:
          selectedQuotation.client ||
          '',
        quotationDate:
          selectedQuotation.quotationDate ||
          todayISO(),
        validUntil:
          selectedQuotation.validUntil
            ? selectedQuotation.validUntil.slice(
                0,
                10
              )
            : '',
        projectName:
          selectedQuotation.projectName ||
          '',
        status:
          selectedQuotation.status ||
          'DRAFT',
        paymentTerms:
          selectedQuotation.paymentTerms ||
          '',
        notes:
          selectedQuotation.notes ||
          '',
        gstType:
          selectedQuotation.gstType ||
          'NONE',
        gstRate:
          Number(
            selectedQuotation.gstRate ||
              0
          ),
        termsConditions:
          selectedQuotation.termsConditions ||
          DEFAULT_TERMS,
      });

      setDiscount(
        Number(
          selectedQuotation.discount ||
            0
        )
      );

      setItems(
        quotationItems.length > 0
          ? quotationItems.map(
              (item) => ({
                id: item.id,
                description:
                  item.description,
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
                taxRate:
                  Number(
                    item.taxRate || 0
                  ),
                amount:
                  Number(
                    item.amount || 0
                  ),
              })
            )
          : [
              {
                description: '',
                quantity: 1,
                unit: 'Nos',
                rate: 0,
                taxRate: 0,
                amount: 0,
              },
            ]
      );

      setShowDetails(false);
      setShowEdit(true);
    };

  const saveEdit =
    async () => {
      if (!selectedQuotation) {
        return;
      }

      if (!form.client) {
        alert(
          'Please select a client.'
        );
        return;
      }

      const validItems =
        items.filter(
          (item) =>
            item.description.trim() &&
            Number(item.quantity) > 0
        );

      if (validItems.length === 0) {
        alert(
          'Please add at least one item.'
        );
        return;
      }

      try {
        setSaving(true);

        const updated =
          await pb
            .collection('quotations')
            .update<Quotation>(
              selectedQuotation.id,
              {
                client: form.client,
                quotationDate:
                  form.quotationDate,
                validUntil:
                  form.validUntil || '',
                projectName:
                  form.projectName,
                status:
                  form.status,
                subtotal,
                discount:
                  Number(discount || 0),
                tax: gst.totalTax,
                grandTotal,
                paymentTerms:
                  form.paymentTerms,
                notes: form.notes,

                gstType:
                  form.gstType,

                gstRate:
                  Number(
                    form.gstRate || 0
                  ),

                cgst: gst.cgst,
                sgst: gst.sgst,
                igst: gst.igst,

                termsConditions:
                  form.termsConditions,
              }
            );

        const oldItems =
          await pb
            .collection(
              'quotation_items'
            )
            .getFullList({
              filter: `quotation = "${selectedQuotation.id}"`,
            });

        await Promise.all(
          oldItems.map(
            (item: any) =>
              pb
                .collection(
                  'quotation_items'
                )
                .delete(item.id)
          )
        );

        await Promise.all(
          validItems.map((item) =>
            pb
              .collection(
                'quotation_items'
              )
              .create({
                quotation:
                  selectedQuotation.id,
                description:
                  item.description,
                quantity:
                  Number(
                    item.quantity || 0
                  ),
                unit:
                  item.unit || '',
                rate:
                  Number(
                    item.rate || 0
                  ),
                taxRate:
                  Number(
                    item.taxRate || 0
                  ),
                amount:
                  Number(
                    item.amount || 0
                  ),
              })
          )
        );

        setSelectedQuotation(
          updated
        );

        alert(
          'Quotation updated successfully.'
        );

        setShowEdit(false);

        await loadData();

        await loadQuotationItems(
          updated.id
        );

        setShowDetails(true);
      } catch (error: any) {
        console.error(
          'Quotation update failed:',
          error
        );

        alert(
          error?.message ||
            'Failed to update quotation.'
        );
      } finally {
        setSaving(false);
      }
    };

  const deleteQuotation =
    async () => {
      if (!selectedQuotation) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete quotation ${selectedQuotation.quotationNumber}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        const quotationItems =
          await pb
            .collection(
              'quotation_items'
            )
            .getFullList({
              filter: `quotation = "${selectedQuotation.id}"`,
            });

        await Promise.all(
          quotationItems.map(
            (item: any) =>
              pb
                .collection(
                  'quotation_items'
                )
                .delete(item.id)
          )
        );

        await pb
          .collection('quotations')
          .delete(
            selectedQuotation.id
          );

        setShowDetails(false);
        setSelectedQuotation(null);

        await loadData();

        alert(
          'Quotation deleted successfully.'
        );
      } catch (error: any) {
        console.error(
          'Delete failed:',
          error
        );

        alert(
          error?.message ||
            'Unable to delete quotation.'
        );
      }
    };

  const printQuotation =
    () => {
      if (!selectedQuotation) {
        return;
      }

      const client =
        getClient(
          selectedQuotation.client
        );

      const quotationSubtotal =
        Number(
          selectedQuotation.subtotal ||
            0
        );

      const quotationDiscount =
        Number(
          selectedQuotation.discount ||
            0
        );

      const quotationTax =
        Number(
          selectedQuotation.tax ||
            0
        );

      const quotationGrandTotal =
        Number(
          selectedQuotation.grandTotal ||
            0
        );

      const cgst =
        Number(
          selectedQuotation.cgst ||
            0
        );

      const sgst =
        Number(
          selectedQuotation.sgst ||
            0
        );

      const igst =
        Number(
          selectedQuotation.igst ||
            0
        );

      const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />

<title>${escapeHtml(
        selectedQuotation.quotationNumber
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

.page {
  width: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  border-bottom: 3px solid #9a641f;
  padding-bottom: 18px;
}

.logo {
  width: 115px;
  height: auto;
  object-fit: contain;
}

.company {
  text-align: right;
}

.company h1 {
  margin: 0 0 6px;
  font-size: 22px;
  letter-spacing: 1px;
}

.company p {
  margin: 3px 0;
  font-size: 11px;
}

.title {
  text-align: center;
  margin: 25px 0;
}

.title h2 {
  margin: 0;
  font-size: 26px;
  letter-spacing: 2px;
}

.meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  margin-bottom: 25px;
}

.box {
  border: 1px solid #ddd;
  padding: 14px;
  border-radius: 5px;
}

.box h3 {
  margin: 0 0 9px;
  color: #9a641f;
  font-size: 13px;
}

.box p {
  margin: 4px 0;
  font-size: 11px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

th {
  background: #222;
  color: white;
  padding: 9px;
  font-size: 11px;
  text-align: left;
}

td {
  border-bottom: 1px solid #ddd;
  padding: 9px;
  font-size: 11px;
}

.right {
  text-align: right;
}

.summary {
  width: 45%;
  margin-left: auto;
  margin-top: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 7px 0;
  font-size: 12px;
}

.grand {
  border-top: 2px solid #222;
  font-size: 16px;
  font-weight: bold;
  color: #9a641f;
  padding-top: 12px;
}

.terms {
  margin-top: 30px;
  border-top: 1px solid #ddd;
  padding-top: 15px;
}

.terms h3 {
  color: #9a641f;
  font-size: 13px;
}

.terms p {
  white-space: pre-line;
  font-size: 10px;
  line-height: 1.5;
}

.footer {
  margin-top: 35px;
  padding-top: 12px;
  border-top: 1px solid #ddd;
  text-align: center;
  font-size: 9px;
  color: #666;
}

</style>
</head>

<body>

<div class="page">

<div class="header">

<div>
<img
  src="/logo.png"
  class="logo"
  onerror="this.style.display='none'"
/>
</div>

<div class="company">

<h1>
${escapeHtml(COMPANY.name)}
</h1>

<p>
${escapeHtml(
  COMPANY.address[0]
)}<br/>
${escapeHtml(
  COMPANY.address[1]
)}<br/>
${escapeHtml(
  COMPANY.address[2]
)}
</p>

<p>
Phone: ${escapeHtml(
  COMPANY.phone
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

<h3>BILL TO</h3>

<p>
<strong>
${escapeHtml(
  client?.company ||
    client?.name ||
    'Client'
)}
</strong>
</p>

${
  client?.company &&
  client?.name
    ? `<p>${escapeHtml(
        client.name
      )}</p>`
    : ''
}

${
  client?.address
    ? `<p>${escapeHtml(
        client.address
      )}</p>`
    : ''
}

${
  client?.phone
    ? `<p>Phone: ${escapeHtml(
        client.phone
      )}</p>`
    : ''
}

${
  client?.email
    ? `<p>Email: ${escapeHtml(
        client.email
      )}</p>`
    : ''
}

</div>

<div class="box">

<h3>QUOTATION DETAILS</h3>

<p>
<strong>Quotation No:</strong>
${escapeHtml(
  selectedQuotation.quotationNumber
)}
</p>

<p>
<strong>Quotation Date:</strong>
${escapeHtml(
  formatDate(
    selectedQuotation.quotationDate
  )
)}
</p>

<p>
<strong>Valid Until:</strong>
${escapeHtml(
  formatDate(
    selectedQuotation.validUntil
  )
)}
</p>

<p>
<strong>Project:</strong>
${escapeHtml(
  selectedQuotation.projectName ||
    '—'
)}
</p>

<p>
<strong>Status:</strong>
${escapeHtml(
  selectedQuotation.status
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
<th class="right">Rate</th>
<th class="right">Amount</th>
</tr>

</thead>

<tbody>

${
  selectedItems.length > 0
    ? selectedItems
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

<td>
${escapeHtml(
  item.quantity
)}
</td>

<td>
${escapeHtml(
  item.unit || '—'
)}
</td>

<td class="right">
${escapeHtml(
  formatCurrency(item.rate)
)}
</td>

<td class="right">
${escapeHtml(
  formatCurrency(item.amount)
)}
</td>

</tr>
`
        )
        .join('')
    : `
<tr>
<td colspan="6" style="text-align:center">
No quotation items
</td>
</tr>
`
}

</tbody>

</table>

<div class="summary">

<div class="summary-row">

<span>
Subtotal
</span>

<strong>
${escapeHtml(
  formatCurrency(
    quotationSubtotal
  )
)}
</strong>

</div>

<div class="summary-row">

<span>
Discount
</span>

<strong>
- ${escapeHtml(
  formatCurrency(
    quotationDiscount
  )
)}
</strong>

</div>

${
  selectedQuotation.gstType ===
  'CGST_SGST'
    ? `
<div class="summary-row">
<span>
CGST (${Number(
  selectedQuotation.gstRate || 0
) / 2}%)
</span>

<strong>
${escapeHtml(
  formatCurrency(cgst)
)}
</strong>
</div>

<div class="summary-row">
<span>
SGST (${Number(
  selectedQuotation.gstRate || 0
) / 2}%)
</span>

<strong>
${escapeHtml(
  formatCurrency(sgst)
)}
</strong>
</div>
`
    : ''
}

${
  selectedQuotation.gstType ===
  'IGST'
    ? `
<div class="summary-row">
<span>
IGST (${Number(
  selectedQuotation.gstRate || 0
)}%)
</span>

<strong>
${escapeHtml(
  formatCurrency(igst)
)}
</strong>
</div>
`
    : ''
}

${
  !selectedQuotation.gstType ||
  selectedQuotation.gstType ===
    'NONE'
    ? `
<div class="summary-row">
<span>
Tax / GST
</span>

<strong>
${escapeHtml(
  formatCurrency(
    quotationTax
  )
)}
</strong>

</div>
`
    : ''
}

<div class="summary-row grand">

<span>
Grand Total
</span>

<strong>
${escapeHtml(
  formatCurrency(
    quotationGrandTotal
  )
)}
</strong>

</div>

</div>

${
  selectedQuotation.paymentTerms
    ? `
<div class="box" style="margin-top:25px">

<h3>
PAYMENT TERMS
</h3>

<p>
${escapeHtml(
  selectedQuotation.paymentTerms
)}
</p>

</div>
`
    : ''
}

${
  selectedQuotation.notes
    ? `
<div class="box" style="margin-top:15px">

<h3>
NOTES
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

${
  selectedQuotation.termsConditions
    ? `
<div class="terms">

<h3>
TERMS & CONDITIONS
</h3>

<p>
${escapeHtml(
  selectedQuotation.termsConditions
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

<br/>

Thank you for considering SRL INFRA DEVELOPERS.

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
          'Please allow pop-ups in your browser to print the quotation.'
        );

        return;
      }

      printWindow.document.open();
      printWindow.document.write(
        html
      );
      printWindow.document.close();
    };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>

            <button
              onClick={() =>
                navigate('/portal')
              }
              className="text-sm text-gray-500 hover:text-[#9a641f] mb-2"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Quotations
            </h1>

            <p className="text-gray-500 mt-1">
              Create, manage and track customer quotations.
            </p>

          </div>

          <div className="flex gap-3">

            <button
              onClick={loadData}
              className="px-5 py-3 rounded-lg border bg-white hover:bg-gray-50"
            >
              Refresh
            </button>

            <button
              onClick={() => {
                resetForm();
                setShowCreate(true);
              }}
              className="px-5 py-3 rounded-lg bg-[#9a641f] text-white hover:bg-[#7e5017]"
            >
              + New Quotation
            </button>

          </div>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-7">

          <div className="bg-white border rounded-xl p-5">
            <p className="text-sm text-gray-500">
              Total
            </p>

            <p className="text-2xl font-bold mt-2">
              {stats.total}
            </p>
          </div>

          <div className="bg-white border rounded-xl p-5">
            <p className="text-sm text-gray-500">
              Draft
            </p>

            <p className="text-2xl font-bold mt-2">
              {stats.draft}
            </p>
          </div>

          <div className="bg-white border rounded-xl p-5">
            <p className="text-sm text-gray-500">
              Sent
            </p>

            <p className="text-2xl font-bold mt-2">
              {stats.sent}
            </p>
          </div>

          <div className="bg-white border rounded-xl p-5">
            <p className="text-sm text-gray-500">
              Negotiation
            </p>

            <p className="text-2xl font-bold mt-2">
              {stats.negotiation}
            </p>
          </div>

          <div className="bg-white border rounded-xl p-5">
            <p className="text-sm text-gray-500">
              Approved
            </p>

            <p className="text-2xl font-bold mt-2 text-green-700">
              {stats.approved}
            </p>
          </div>

          <div className="bg-white border rounded-xl p-5">
            <p className="text-sm text-gray-500">
              Total Value
            </p>

            <p className="text-lg font-bold mt-2">
              {formatCurrency(
                stats.value
              )}
            </p>
          </div>

        </div>

        {/* FILTERS */}

        <div className="bg-white border rounded-xl p-4 mb-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search quotation, client or project..."
              className="border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#c5832b]"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="border rounded-lg px-4 py-3"
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

              <option value="NEGOTIATION">
                Negotiation
              </option>

              <option value="APPROVED">
                Approved
              </option>

              <option value="REJECTED">
                Rejected
              </option>

            </select>

          </div>

        </div>

        {/* TABLE */}

        <div className="bg-white border rounded-xl overflow-hidden">

          {loading ? (

            <div className="p-12 text-center text-gray-500">
              Loading quotations...
            </div>

          ) : filteredQuotations.length === 0 ? (

            <div className="p-12 text-center">

              <div className="text-4xl mb-3">
                📄
              </div>

              <h3 className="font-semibold text-lg">
                No quotations found
              </h3>

              <p className="text-gray-500 mt-1">
                Create your first quotation.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-gray-900 text-white">

                  <tr>

                    <th className="text-left px-5 py-4">
                      Quotation
                    </th>

                    <th className="text-left px-5 py-4">
                      Client
                    </th>

                    <th className="text-left px-5 py-4">
                      Date
                    </th>

                    <th className="text-left px-5 py-4">
                      Status
                    </th>

                    <th className="text-right px-5 py-4">
                      Total
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredQuotations.map(
                    (quotation) => {

                      const client =
                        getClient(
                          quotation.client
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
                              onClick={() => {
                                setSelectedQuotation(
                                  quotation
                                );

                                setShowDetails(
                                  true
                                );

                                loadQuotationItems(
                                  quotation.id
                                );
                              }}
                              className="font-semibold text-[#9a641f] hover:underline"
                            >
                              {
                                quotation.quotationNumber
                              }
                            </button>

                            {quotation.projectName && (
                              <p className="text-xs text-gray-500 mt-1">
                                {
                                  quotation.projectName
                                }
                              </p>
                            )}

                          </td>

                          <td className="px-5 py-4">

                            <p className="font-medium">
                              {
                                client?.company ||
                                client?.name ||
                                '—'
                              }
                            </p>

                            {client?.phone && (
                              <p className="text-xs text-gray-500">
                                {
                                  client.phone
                                }
                              </p>
                            )}

                          </td>

                          <td className="px-5 py-4 text-sm">
                            {formatDate(
                              quotation.quotationDate
                            )}
                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                quotation.status ===
                                'APPROVED'
                                  ? 'bg-green-100 text-green-700'
                                  : quotation.status ===
                                    'REJECTED'
                                  ? 'bg-red-100 text-red-700'
                                  : quotation.status ===
                                    'NEGOTIATION'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : quotation.status ===
                                    'SENT'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {
                                quotation.status
                              }
                            </span>

                          </td>

                          <td className="px-5 py-4 text-right font-bold">
                            {formatCurrency(
                              quotation.grandTotal
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

      {/* CREATE / EDIT MODAL */}

      {(showCreate || showEdit) && (

        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[94vh] overflow-y-auto">

            <div className="p-6 border-b flex items-center justify-between">

              <div>

                <h2 className="text-2xl font-bold">
                  {showEdit
                    ? 'Edit Quotation'
                    : 'New Quotation'}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Prepare a professional quotation for your client.
                </p>

              </div>

              <button
                onClick={() => {
                  setShowCreate(false);
                  setShowEdit(false);
                }}
                className="text-2xl text-gray-500 hover:text-black"
              >
                ×
              </button>

            </div>

            <div className="p-6 space-y-7">

              {/* BASIC DETAILS */}

              <div>

                <h3 className="font-semibold text-[#9a641f] mb-4">
                  Basic Details
                </h3>

                <div className="grid md:grid-cols-2 gap-4">

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Client
                    </label>

                    <select
                      value={form.client}
                      onChange={(event) =>
                        setForm(
                          (previous) => ({
                            ...previous,
                            client:
                              event.target
                                .value,
                          })
                        )
                      }
                      className="w-full border rounded-lg px-4 py-3"
                    >

                      <option value="">
                        Select Client
                      </option>

                      {clients.map(
                        (client) => (
                          <option
                            key={client.id}
                            value={
                              client.id
                            }
                          >
                            {client.company
                              ? `${client.company} — ${client.name}`
                              : client.name}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Project Name
                    </label>

                    <input
                      value={
                        form.projectName
                      }
                      onChange={(event) =>
                        setForm(
                          (previous) => ({
                            ...previous,
                            projectName:
                              event.target
                                .value,
                          })
                        )
                      }
                      placeholder="Interior / Automation / Infrastructure..."
                      className="w-full border rounded-lg px-4 py-3"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Quotation Date
                    </label>

                    <input
                      type="date"
                      value={
                        form.quotationDate
                      }
                      onChange={(event) =>
                        setForm(
                          (previous) => ({
                            ...previous,
                            quotationDate:
                              event.target
                                .value,
                          })
                        )
                      }
                      className="w-full border rounded-lg px-4 py-3"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Valid Until
                    </label>

                    <input
                      type="date"
                      value={
                        form.validUntil
                      }
                      onChange={(event) =>
                        setForm(
                          (previous) => ({
                            ...previous,
                            validUntil:
                              event.target
                                .value,
                          })
                        )
                      }
                      className="w-full border rounded-lg px-4 py-3"
                    />

                  </div>

                </div>

              </div>

              {/* ITEMS */}

              <div>

                <div className="flex items-center justify-between mb-4">

                  <h3 className="font-semibold text-[#9a641f]">
                    Items / Services
                  </h3>

                  <button
                    type="button"
                    onClick={addItem}
                    className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm"
                  >
                    + Add Item
                  </button>

                </div>

                <div className="space-y-3">

                  {items.map(
                    (item, index) => (

                      <div
                        key={index}
                        className="grid grid-cols-12 gap-2 items-end border rounded-xl p-3"
                      >

                        <div className="col-span-12 md:col-span-4">

                          <label className="text-xs text-gray-500">
                            Description
                          </label>

                          <input
                            value={
                              item.description
                            }
                            onChange={(
                              event
                            ) =>
                              updateItem(
                                index,
                                'description',
                                event.target
                                  .value
                              )
                            }
                            placeholder="Product / Service"
                            className="w-full border rounded-lg px-3 py-2"
                          />

                        </div>

                        <div className="col-span-4 md:col-span-2">

                          <label className="text-xs text-gray-500">
                            Quantity
                          </label>

                          <input
                            type="number"
                            min="0"
                            value={
                              item.quantity
                            }
                            onChange={(
                              event
                            ) =>
                              updateItem(
                                index,
                                'quantity',
                                Number(
                                  event.target
                                    .value
                                )
                              )
                            }
                            className="w-full border rounded-lg px-3 py-2"
                          />

                        </div>

                        <div className="col-span-4 md:col-span-2">

                          <label className="text-xs text-gray-500">
                            Unit
                          </label>

                          <input
                            value={
                              item.unit ||
                              ''
                            }
                            onChange={(
                              event
                            ) =>
                              updateItem(
                                index,
                                'unit',
                                event.target
                                  .value
                              )
                            }
                            className="w-full border rounded-lg px-3 py-2"
                          />

                        </div>

                        <div className="col-span-4 md:col-span-2">

                          <label className="text-xs text-gray-500">
                            Rate
                          </label>

                          <input
                            type="number"
                            min="0"
                            value={
                              item.rate
                            }
                            onChange={(
                              event
                            ) =>
                              updateItem(
                                index,
                                'rate',
                                Number(
                                  event.target
                                    .value
                                )
                              )
                            }
                            className="w-full border rounded-lg px-3 py-2"
                          />

                        </div>

                        <div className="col-span-10 md:col-span-1">

                          <label className="text-xs text-gray-500">
                            Amount
                          </label>

                          <div className="border rounded-lg px-2 py-2 text-sm font-semibold bg-gray-50">
                            {formatCurrency(
                              item.amount
                            )}
                          </div>

                        </div>

                        <div className="col-span-2 md:col-span-1">

                          <button
                            type="button"
                            onClick={() =>
                              removeItem(
                                index
                              )
                            }
                            className="w-full px-2 py-2 rounded-lg border text-red-600 hover:bg-red-50"
                          >
                            ×
                          </button>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>

              {/* GST */}

              <div>

                <h3 className="font-semibold text-[#9a641f] mb-4">
                  GST / Tax
                </h3>

                <div className="grid md:grid-cols-3 gap-4">

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      GST Type
                    </label>

                    <select
                      value={
                        form.gstType
                      }
                      onChange={(event) =>
                        setForm(
                          (previous) => ({
                            ...previous,
                            gstType:
                              event.target
                                .value,
                          })
                        )
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

                    <label className="block text-sm font-medium mb-1">
                      GST Rate %
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        form.gstRate
                      }
                      disabled={
                        form.gstType ===
                        'NONE'
                      }
                      onChange={(event) =>
                        setForm(
                          (previous) => ({
                            ...previous,
                            gstRate:
                              Number(
                                event.target
                                  .value
                              ),
                          })
                        )
                      }
                      className="w-full border rounded-lg px-4 py-3 disabled:bg-gray-100"
                    />

                  </div>

                  <div className="border rounded-lg p-4 bg-gray-50">

                    <p className="text-sm text-gray-500">
                      Taxable Amount
                    </p>

                    <p className="text-lg font-bold mt-1">
                      {formatCurrency(
                        taxableAmount
                      )}
                    </p>

                  </div>

                </div>

                <div className="grid md:grid-cols-4 gap-4 mt-4">

                  <div className="border rounded-lg p-4">

                    <p className="text-xs text-gray-500">
                      CGST
                    </p>

                    <p className="font-semibold">
                      {formatCurrency(
                        gst.cgst
                      )}
                    </p>

                  </div>

                  <div className="border rounded-lg p-4">

                    <p className="text-xs text-gray-500">
                      SGST
                    </p>

                    <p className="font-semibold">
                      {formatCurrency(
                        gst.sgst
                      )}
                    </p>

                  </div>

                  <div className="border rounded-lg p-4">

                    <p className="text-xs text-gray-500">
                      IGST
                    </p>

                    <p className="font-semibold">
                      {formatCurrency(
                        gst.igst
                      )}
                    </p>

                  </div>

                  <div className="border rounded-lg p-4">

                    <p className="text-xs text-gray-500">
                      Total GST
                    </p>

                    <p className="font-semibold text-[#9a641f]">
                      {formatCurrency(
                        gst.totalTax
                      )}
                    </p>

                  </div>

                </div>

              </div>

              {/* DISCOUNT + TOTAL */}

              <div className="grid md:grid-cols-2 gap-6">

                <div>

                  <h3 className="font-semibold text-[#9a641f] mb-4">
                    Discount
                  </h3>

                  <input
                    type="number"
                    min="0"
                    value={
                      discount
                    }
                    onChange={(event) =>
                      setDiscount(
                        Number(
                          event.target
                            .value
                        )
                      )
                    }
                    className="w-full border rounded-lg px-4 py-3"
                    placeholder="Discount amount"
                  />

                </div>

                <div className="border rounded-xl p-5 bg-gray-50">

                  <div className="flex justify-between mb-2">

                    <span>
                      Subtotal
                    </span>

                    <strong>
                      {formatCurrency(
                        subtotal
                      )}
                    </strong>

                  </div>

                  <div className="flex justify-between mb-2">

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

                  <div className="flex justify-between mb-2">

                    <span>
                      GST
                    </span>

                    <strong>
                      {formatCurrency(
                        gst.totalTax
                      )}
                    </strong>

                  </div>

                  <div className="border-t pt-3 flex justify-between text-lg">

                    <span className="font-bold">
                      Grand Total
                    </span>

                    <strong className="text-[#9a641f]">
                      {formatCurrency(
                        grandTotal
                      )}
                    </strong>

                  </div>

                </div>

              </div>

              {/* PAYMENT */}

              <div>

                <h3 className="font-semibold text-[#9a641f] mb-4">
                  Payment Details
                </h3>

                <div className="grid md:grid-cols-2 gap-4">

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Payment Terms
                    </label>

                    <input
                      value={
                        form.paymentTerms
                      }
                      onChange={(event) =>
                        setForm(
                          (previous) => ({
                            ...previous,
                            paymentTerms:
                              event.target
                                .value,
                          })
                        )
                      }
                      placeholder="Example: 25% advance, balance before delivery"
                      className="w-full border rounded-lg px-4 py-3"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Notes
                    </label>

                    <input
                      value={
                        form.notes
                      }
                      onChange={(event) =>
                        setForm(
                          (previous) => ({
                            ...previous,
                            notes:
                              event.target
                                .value,
                          })
                        )
                      }
                      placeholder="Internal / client notes"
                      className="w-full border rounded-lg px-4 py-3"
                    />

                  </div>

                </div>

              </div>

              {/* TERMS */}

              <div>

                <h3 className="font-semibold text-[#9a641f] mb-4">
                  Terms & Conditions
                </h3>

                <textarea
                  rows={9}
                  value={
                    form.termsConditions
                  }
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        termsConditions:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="w-full border rounded-lg px-4 py-3"
                />

              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 border-t pt-5">

                <button
                  onClick={() => {
                    setShowCreate(false);
                    setShowEdit(false);
                  }}
                  className="px-5 py-3 rounded-lg border"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    showEdit
                      ? saveEdit
                      : createQuotation
                  }
                  disabled={saving}
                  className="px-6 py-3 rounded-lg bg-[#9a641f] text-white hover:bg-[#7e5017] disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : showEdit
                    ? 'Save Changes'
                    : 'Create Quotation'}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* DETAILS MODAL */}

      {showDetails &&
        selectedQuotation && (

          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">

            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto">

              <div className="p-6 border-b flex items-start justify-between">

                <div>

                  <p className="text-sm text-gray-500">
                    Quotation
                  </p>

                  <h2 className="text-2xl font-bold">
                    {
                      selectedQuotation.quotationNumber
                    }
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    {
                      selectedQuotation.projectName ||
                      'General Project'
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

                {/* CLIENT + DETAILS */}

                <div className="grid md:grid-cols-2 gap-5">

                  <div className="border rounded-xl p-5">

                    <h3 className="font-semibold text-[#9a641f] mb-3">
                      Bill To
                    </h3>

                    <p className="font-semibold">
                      {
                        getClient(
                          selectedQuotation.client
                        )?.company ||
                        getClient(
                          selectedQuotation.client
                        )?.name ||
                        '—'
                      }
                    </p>

                    {getClient(
                      selectedQuotation.client
                    )?.company &&
                      getClient(
                        selectedQuotation.client
                      )?.name && (
                        <p>
                          {
                            getClient(
                              selectedQuotation.client
                            )?.name
                          }
                        </p>
                      )}

                    {getClient(
                      selectedQuotation.client
                    )?.address && (
                      <p className="text-sm text-gray-600 mt-2">
                        {
                          getClient(
                            selectedQuotation.client
                          )?.address
                        }
                      </p>
                    )}

                    {getClient(
                      selectedQuotation.client
                    )?.phone && (
                      <p className="text-sm mt-2">
                        Phone:{' '}
                        {
                          getClient(
                            selectedQuotation.client
                          )?.phone
                        }
                      </p>
                    )}

                    {getClient(
                      selectedQuotation.client
                    )?.email && (
                      <p className="text-sm text-gray-600">
                        Email:{' '}
                        {
                          getClient(
                            selectedQuotation.client
                          )?.email
                        }
                      </p>
                    )}

                  </div>

                  <div className="border rounded-xl p-5">

                    <h3 className="font-semibold text-[#9a641f] mb-3">
                      Quotation Details
                    </h3>

                    <div className="space-y-2 text-sm">

                      <p>
                        <strong>
                          Quotation:
                        </strong>{' '}
                        {
                          selectedQuotation.quotationNumber
                        }
                      </p>

                      <p>
                        <strong>
                          Date:
                        </strong>{' '}
                        {formatDate(
                          selectedQuotation.quotationDate
                        )}
                      </p>

                      <p>
                        <strong>
                          Valid Until:
                        </strong>{' '}
                        {formatDate(
                          selectedQuotation.validUntil
                        )}
                      </p>

                      <p>
                        <strong>
                          Project:
                        </strong>{' '}
                        {
                          selectedQuotation.projectName ||
                          '—'
                        }
                      </p>

                      <p>
                        <strong>
                          Status:
                        </strong>{' '}
                        {
                          selectedQuotation.status
                        }
                      </p>

                    </div>

                  </div>

                </div>

                {/* ITEMS */}

                <div className="mt-6 border rounded-xl overflow-hidden">

                  <div className="px-5 py-4 bg-gray-50 border-b font-semibold">
                    Quotation Items
                  </div>

                  <div className="overflow-x-auto">

                    <table className="w-full">

                      <thead>

                        <tr className="bg-gray-900 text-white text-sm">

                          <th className="text-left px-4 py-3">
                            Description
                          </th>

                          <th className="text-right px-4 py-3">
                            Qty
                          </th>

                          <th className="text-right px-4 py-3">
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
                        )}

                      </tbody>

                    </table>

                  </div>

                </div>

                {/* TOTALS */}

                <div className="flex justify-end mt-6">

                  <div className="w-full md:w-96 border rounded-xl p-5 space-y-3">

                    <div className="flex justify-between">

                      <span>
                        Subtotal
                      </span>

                      <strong>
                        {formatCurrency(
                          selectedQuotation.subtotal
                        )}
                      </strong>

                    </div>

                    <div className="flex justify-between">

                      <span>
                        Discount
                      </span>

                      <strong>
                        -{' '}
                        {formatCurrency(
                          selectedQuotation.discount ||
                            0
                        )}
                      </strong>

                    </div>

                    {selectedQuotation.gstType ===
                      'CGST_SGST' && (
                      <>
                        <div className="flex justify-between text-sm">

                          <span>
                            CGST
                          </span>

                          <strong>
                            {formatCurrency(
                              selectedQuotation.cgst ||
                                0
                            )}
                          </strong>

                        </div>

                        <div className="flex justify-between text-sm">

                          <span>
                            SGST
                          </span>

                          <strong>
                            {formatCurrency(
                              selectedQuotation.sgst ||
                                0
                            )}
                          </strong>

                        </div>
                      </>
                    )}

                    {selectedQuotation.gstType ===
                      'IGST' && (
                      <div className="flex justify-between text-sm">

                        <span>
                          IGST
                        </span>

                        <strong>
                          {formatCurrency(
                            selectedQuotation.igst ||
                              0
                          )}
                        </strong>

                      </div>
                    )}

                    {(!selectedQuotation.gstType ||
                      selectedQuotation.gstType ===
                        'NONE') && (
                      <div className="flex justify-between text-sm">

                        <span>
                          Tax / GST
                        </span>

                        <strong>
                          {formatCurrency(
                            selectedQuotation.tax ||
                              0
                          )}
                        </strong>

                      </div>
                    )}

                    <div className="border-t pt-3 flex justify-between text-lg">

                      <span className="font-bold">
                        Grand Total
                      </span>

                      <strong className="text-[#9a641f]">
                        {formatCurrency(
                          selectedQuotation.grandTotal
                        )}
                      </strong>

                    </div>

                  </div>

                </div>

                {/* PAYMENT + NOTES */}

                <div className="grid md:grid-cols-2 gap-5 mt-6">

                  <div className="border rounded-xl p-5">

                    <h3 className="font-semibold text-[#9a641f] mb-3">
                      Payment Terms
                    </h3>

                    <p className="text-sm whitespace-pre-line">
                      {
                        selectedQuotation.paymentTerms ||
                        '—'
                      }
                    </p>

                  </div>

                  <div className="border rounded-xl p-5">

                    <h3 className="font-semibold text-[#9a641f] mb-3">
                      Notes
                    </h3>

                    <p className="text-sm whitespace-pre-line">
                      {
                        selectedQuotation.notes ||
                        '—'
                      }
                    </p>

                  </div>

                </div>

                {/* TERMS */}

                <div className="border rounded-xl p-5 mt-5">

                  <h3 className="font-semibold text-[#9a641f] mb-3">
                    Terms & Conditions
                  </h3>

                  <p className="text-sm whitespace-pre-line leading-6">
                    {
                      selectedQuotation.termsConditions ||
                      DEFAULT_TERMS
                    }
                  </p>

                </div>

                {/* WORKFLOW */}

                <div className="mt-6 border rounded-xl p-5">

                  <h3 className="font-semibold text-[#9a641f] mb-4">
                    Quotation Workflow
                  </h3>

                  <div className="flex flex-wrap gap-3">

                    {selectedQuotation.status ===
                      'DRAFT' && (

                      <button
                        onClick={() =>
                          updateStatus(
                            selectedQuotation,
                            'SENT'
                          )
                        }
                        className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Mark as Sent
                      </button>

                    )}

                    {selectedQuotation.status ===
                      'SENT' && (
                      <button
                        onClick={() =>
                          updateStatus(
                            selectedQuotation,
                            'NEGOTIATION'
                          )
                        }
                        className="px-5 py-2.5 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700"
                      >
                        Move to Negotiation
                      </button>
                    )}

                    {(selectedQuotation.status ===
                      'SENT' ||
                      selectedQuotation.status ===
                        'NEGOTIATION') && (
                      <>
                        <button
                          onClick={() =>
                            updateStatus(
                              selectedQuotation,
                              'APPROVED'
                            )
                          }
                          className="px-5 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() =>
                            updateStatus(
                              selectedQuotation,
                              'REJECTED'
                            )
                          }
                          className="px-5 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {selectedQuotation.status ===
                      'APPROVED' && (

                      <button
                        onClick={
                          handleCreateInvoice
                        }
                        className="px-5 py-2.5 rounded-lg bg-[#9a641f] text-white hover:bg-[#7e5017]"
                      >
                        Create Invoice
                      </button>

                    )}

                  </div>

                </div>

                {/* ACTIONS */}

                <div className="mt-6 flex flex-wrap gap-3">

                  <button
                    onClick={
                      printQuotation
                    }
                    className="px-5 py-3 rounded-lg bg-gray-900 text-white hover:bg-black"
                  >
                    Print / PDF
                  </button>

                  <button
                    onClick={startEdit}
                    className="px-5 py-3 rounded-lg border hover:bg-gray-50"
                  >
                    Edit
                  </button>

                  <button
                    onClick={
                      deleteQuotation
                    }
                    className="px-5 py-3 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
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