import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { pb } from '../../lib/pocketbase';

/* =========================================================
   TYPES
========================================================= */

type Client = {
  id: string;
  clientCode?: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  address?: string;
  clientType?: string;
};

type Quotation = {
  id: string;
  quotationNumber: string;
  client: string;
  quotationDate: string;
  validUntil?: string;
  projectName?: string;
  status: string;

  subTotal: number;
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
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  client: string;
  quotation?: string;

  invoiceDate: string;
  dueDate?: string;

  projectName?: string;

  status: string;

  subTotal: number;
  discount?: number;
  tax?: number;
  grandTotal: number;

  paidAmount?: number;
  paymentStatus: string;

  paymentTerms?: string;
  notes?: string;

  created: string;
};

type InvoiceItem = {
  id?: string;
  invoice: string;

  description: string;
  quantity: number;
  unit?: string;
  rate: number;
  taxRate?: number;
  amount: number;
};

/* =========================================================
   COMPANY DETAILS
========================================================= */

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

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (value: number = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value?: string) => {
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

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

/* =========================================================
   POCKETBASE ERROR HELPER
========================================================= */

const getPocketBaseErrorMessage = (
  error: any
) => {
  console.error(
    'POCKETBASE ERROR:',
    error
  );

  console.error(
    'ORIGINAL ERROR:',
    error?.originalError
  );

  console.error(
    'ERROR DATA:',
    error?.data
  );

  console.error(
    'RESPONSE DATA:',
    error?.response?.data
  );

  const data =
    error?.response?.data ||
    error?.data ||
    error?.originalError?.response?.data;

  let validationErrors = '';

  /*
   * PocketBase sometimes returns:
   *
   * {
   *   fieldName: {
   *     code: "...",
   *     message: "..."
   *   }
   * }
   */

  if (
    data &&
    typeof data === 'object'
  ) {
    validationErrors =
      Object.entries(data)
        .map(
          ([field, details]: [
            string,
            any
          ]) => {
            if (
              details &&
              typeof details ===
                'object' &&
              details.message
            ) {
              return `${field}: ${details.message}`;
            }

            return `${field}: ${JSON.stringify(
              details
            )}`;
          }
        )
        .join('\n');
  }

  if (!validationErrors) {
    validationErrors =
      error?.message ||
      error?.originalError?.message ||
      'Unknown PocketBase error occurred.';
  }

  return validationErrors;
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Invoices() {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  /* =======================================================
     DATA
  ======================================================= */

  const [invoices, setInvoices] =
    useState<Invoice[]>([]);

  const [clients, setClients] =
    useState<Client[]>([]);

  const [quotations, setQuotations] =
    useState<Quotation[]>([]);

  /* =======================================================
     SELECTED DATA
  ======================================================= */

  const [selectedInvoice, setSelectedInvoice] =
    useState<Invoice | null>(null);

  const [selectedItems, setSelectedItems] =
    useState<InvoiceItem[]>([]);

  const [selectedQuotation, setSelectedQuotation] =
    useState<Quotation | null>(null);

  const [selectedClient, setSelectedClient] =
    useState<Client | null>(null);

  /* =======================================================
     UI STATE
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [showDetails, setShowDetails] =
    useState(false);

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('ALL');

  const [paymentFilter, setPaymentFilter] =
    useState('ALL');

  const [paidAmountInput, setPaidAmountInput] =
    useState('');

  /*
   * Prevent duplicate automatic conversion
   * caused by React StrictMode.
   */
  const autoConversionStarted =
    useRef(false);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadData = useCallback(
    async () => {
      try {
        setLoading(true);

        const [
          invoiceResult,
          clientResult,
          quotationResult,
        ] = await Promise.all([
          pb
            .collection('invoices')
            .getFullList<Invoice>({
              sort: '-created',
            }),

          pb
            .collection('clients')
            .getFullList<Client>({
              sort: 'name',
            }),

          pb
            .collection('quotations')
            .getFullList<Quotation>({
              sort: '-created',
            }),
        ]);

        setInvoices(invoiceResult);
        setClients(clientResult);
        setQuotations(
          quotationResult
        );
      } catch (error: any) {
        console.error(
          'Failed to load invoice data:',
          error
        );

        const message =
          getPocketBaseErrorMessage(
            error
          );

        alert(
          `Unable to load invoice data.\n\n${message}`
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =======================================================
     LOOKUPS
  ======================================================= */

  const getClient = useCallback(
    (clientId?: string) =>
      clients.find(
        (client) =>
          client.id === clientId
      ),
    [clients]
  );

  const getQuotation = useCallback(
    (quotationId?: string) =>
      quotations.find(
        (quotation) =>
          quotation.id === quotationId
      ),
    [quotations]
  );

  /* =======================================================
     FILTERED INVOICES
  ======================================================= */

  const filteredInvoices = useMemo(
    () => {
      const query =
        search.trim().toLowerCase();

      return invoices.filter(
        (invoice) => {
          const client =
            getClient(
              invoice.client
            );

          const searchText = [
            invoice.invoiceNumber,
            invoice.projectName,
            client?.name,
            client?.company,
            client?.phone,
            client?.email,
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
            invoice.paymentStatus ===
              paymentFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesPayment
          );
        }
      );
    },
    [
      invoices,
      search,
      statusFilter,
      paymentFilter,
      getClient,
    ]
  );

  /* =======================================================
     STATISTICS
  ======================================================= */

  const stats = useMemo(() => {
    const total =
      invoices.length;

    const totalValue =
      invoices.reduce(
        (sum, invoice) =>
          sum +
          Number(
            invoice.grandTotal || 0
          ),
        0
      );

    const paid =
      invoices.reduce(
        (sum, invoice) =>
          sum +
          Number(
            invoice.paidAmount || 0
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
          invoice.status ===
          'SENT'
      ).length;

    return {
      total,
      totalValue,
      paid,
      outstanding,
      sent,
    };
  }, [invoices]);

  /* =======================================================
     GENERATE INVOICE NUMBER
  ======================================================= */

  const generateInvoiceNumber =
    useCallback(() => {
      const year =
        new Date().getFullYear();

      const numbers =
        invoices
          .map((invoice) => {
            const match =
              invoice.invoiceNumber?.match(
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

      const nextNumber =
        numbers.length > 0
          ? Math.max(...numbers) + 1
          : 1;

      return `INV-${year}-${String(
        nextNumber
      ).padStart(4, '0')}`;
    }, [invoices]);

  /* =======================================================
     LOAD INVOICE ITEMS
  ======================================================= */

  const loadInvoiceItems =
    async (
      invoiceId: string
    ) => {
      try {
        const items =
          await pb
            .collection(
              'invoice_items'
            )
            .getFullList<InvoiceItem>({
              filter: `invoice = "${invoiceId}"`,
              sort: 'created',
            });

        setSelectedItems(
          items
        );

        return items;
      } catch (error) {
        console.error(
          'Failed to load invoice items:',
          error
        );

        setSelectedItems([]);

        return [];
      }
    };

  /* =======================================================
     OPEN INVOICE
  ======================================================= */

  const openInvoice =
    async (
      invoice: Invoice
    ) => {
      setSelectedInvoice(
        invoice
      );

      const client =
        getClient(
          invoice.client
        );

      const quotation =
        getQuotation(
          invoice.quotation
        );

      setSelectedClient(
        client || null
      );

      setSelectedQuotation(
        quotation || null
      );

      setPaidAmountInput(
        String(
          invoice.paidAmount || 0
        )
      );

      await loadInvoiceItems(
        invoice.id
      );

      setShowDetails(true);
    };

  /* =======================================================
     CREATE INVOICE FROM QUOTATION
  ======================================================= */

  const createInvoiceFromQuotation =
    useCallback(
      async (
        quotation: Quotation
      ) => {
        if (
          quotation.status !==
          'APPROVED'
        ) {
          alert(
            'Only APPROVED quotations can be converted into invoices.'
          );

          return;
        }

        try {
          setCreating(true);

          /* -----------------------------------------------
             DUPLICATE CHECK
          ------------------------------------------------ */

          const existing =
            invoices.find(
              (invoice) =>
                invoice.quotation ===
                quotation.id
            );

          if (existing) {
            alert(
              `An invoice already exists for ${quotation.quotationNumber}.\n\nInvoice: ${existing.invoiceNumber}`
            );

            await openInvoice(
              existing
            );

            return;
          }

          /* -----------------------------------------------
             INVOICE NUMBER
          ------------------------------------------------ */

          const invoiceNumber =
            generateInvoiceNumber();

          /* -----------------------------------------------
             DUE DATE
          ------------------------------------------------ */

          const dueDate =
            new Date();

          dueDate.setDate(
            dueDate.getDate() +
              15
          );

          /* -----------------------------------------------
             TAX
          ------------------------------------------------ */

          const quotationTax =
            Number(
              quotation.tax || 0
            );

          const gstTax =
            Number(
              quotation.cgst || 0
            ) +
            Number(
              quotation.sgst || 0
            ) +
            Number(
              quotation.igst || 0
            );

          const finalTax =
            quotationTax ||
            gstTax;

          /* -----------------------------------------------
             PAYLOAD
          ------------------------------------------------ */

          const invoicePayload = {
            invoiceNumber,

            client:
              quotation.client,

            quotation:
              quotation.id,

            invoiceDate:
              todayISO(),

            dueDate:
              dueDate.toISOString(),

            projectName:
              quotation.projectName ||
              '',

            status: 'DRAFT',

            subTotal:
              Number(
                quotation.subTotal ||
                  0
              ),

            discount:
              Number(
                quotation.discount ||
                  0
              ),

            tax: finalTax,

            grandTotal:
              Number(
                quotation.grandTotal ||
                  0
              ),

            paidAmount: 0,

            paymentStatus:
              'UNPAID',

            paymentTerms:
              quotation.paymentTerms ||
              '15 days',

            notes:
              quotation.notes ||
              '',
          };

          console.log(
            'Creating invoice with payload:',
            invoicePayload
          );

          /* -----------------------------------------------
             CREATE INVOICE
          ------------------------------------------------ */

          let invoice: Invoice;

          try {
            invoice =
              await pb
                .collection(
                  'invoices'
                )
                .create<Invoice>(
                  invoicePayload
                );
          } catch (error: any) {
            console.error(
              'Invoice creation failed:',
              error
            );

            console.error(
              'Original error:',
              error?.originalError
            );

            console.error(
              'Error data:',
              error?.data
            );

            console.error(
              'Response data:',
              error?.response?.data
            );

            const validationErrors =
              getPocketBaseErrorMessage(
                error
              );

            alert(
              `Failed to create invoice:\n\n${validationErrors}`
            );

            return;
          }

          /* -----------------------------------------------
             GET QUOTATION ITEMS
          ------------------------------------------------ */

          let quotationItems:
            Array<{
              id: string;
              quotation: string;
              description: string;
              quantity: number;
              unit?: string;
              rate: number;
              taxRate?: number;
              amount: number;
            }> = [];

          try {
            quotationItems =
              await pb
                .collection(
                  'quotation_items'
                )
                .getFullList({
                  filter: `quotation = "${quotation.id}"`,
                  sort: 'created',
                });
          } catch (error: any) {
            console.error(
              'Could not load quotation items:',
              error
            );

            /*
             * Roll back invoice.
             */
            try {
              await pb
                .collection(
                  'invoices'
                )
                .delete(
                  invoice.id
                );
            } catch (
              rollbackError
            ) {
              console.error(
                'Invoice rollback failed:',
                rollbackError
              );
            }

            alert(
              `Invoice was not completed because quotation items could not be loaded.\n\n${getPocketBaseErrorMessage(
                error
              )}`
            );

            return;
          }

          /* -----------------------------------------------
             COPY ITEMS
          ------------------------------------------------ */

          try {
            for (
              const item of quotationItems
            ) {
              await pb
                .collection(
                  'invoice_items'
                )
                .create({
                  invoice:
                    invoice.id,

                  description:
                    item.description,

                  quantity:
                    Number(
                      item.quantity ||
                        0
                    ),

                  unit:
                    item.unit || '',

                  rate:
                    Number(
                      item.rate || 0
                    ),

                  taxRate:
                    Number(
                      item.taxRate ||
                        0
                    ),

                  amount:
                    Number(
                      item.amount ||
                        0
                    ),
                });
            }
          } catch (error: any) {
            console.error(
              'Invoice item creation failed:',
              error
            );

            /*
             * Delete incomplete invoice.
             */
            try {
              await pb
                .collection(
                  'invoices'
                )
                .delete(
                  invoice.id
                );
            } catch (
              rollbackError
            ) {
              console.error(
                'Invoice rollback failed:',
                rollbackError
              );
            }

            alert(
              `Invoice items could not be created.\n\n${getPocketBaseErrorMessage(
                error
              )}\n\nThe incomplete invoice was removed.`
            );

            return;
          }

          /* -----------------------------------------------
             REFRESH
          ------------------------------------------------ */

          await loadData();

          await openInvoice(
            invoice
          );

          alert(
            `Invoice ${invoiceNumber} created successfully.`
          );
        } catch (error: any) {
          console.error(
            'Unexpected invoice creation error:',
            error
          );

          alert(
            `Invoice creation failed.\n\n${getPocketBaseErrorMessage(
              error
            )}`
          );
        } finally {
          setCreating(false);
        }
      },
      [
        invoices,
        generateInvoiceNumber,
        loadData,
        getClient,
        getQuotation,
      ]
    );

  /* =======================================================
     AUTO CONVERT
     
     /portal/invoices?quotation=QUOTATION_ID
  ======================================================= */

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
          item.id === quotationId
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

  /* =======================================================
     UPDATE INVOICE STATUS
  ======================================================= */

  const updateInvoiceStatus =
    async (
      invoice: Invoice,
      status: string
    ) => {
      try {
        const updated =
          await pb
            .collection(
              'invoices'
            )
            .update<Invoice>(
              invoice.id,
              {
                status,
              }
            );

        setInvoices(
          (previous) =>
            previous.map(
              (item) =>
                item.id ===
                invoice.id
                  ? updated
                  : item
            )
        );

        setSelectedInvoice(
          updated
        );
      } catch (error: any) {
        console.error(
          'Status update failed:',
          error
        );

        alert(
          `Unable to update invoice status.\n\n${getPocketBaseErrorMessage(
            error
          )}`
        );
      }
    };

  /* =======================================================
     UPDATE PAYMENT
  ======================================================= */

  const updatePayment =
    async () => {
      if (!selectedInvoice) {
        return;
      }

      const paidAmount =
        Number(
          paidAmountInput || 0
        );

      const grandTotal =
        Number(
          selectedInvoice.grandTotal ||
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

      if (
        paidAmount >
        grandTotal
      ) {
        alert(
          `Paid amount cannot exceed the invoice total of ${formatCurrency(
            grandTotal
          )}.`
        );

        return;
      }

      let paymentStatus =
        'UNPAID';

      if (
        paidAmount <= 0
      ) {
        paymentStatus =
          'UNPAID';
      } else if (
        paidAmount >=
        grandTotal
      ) {
        paymentStatus =
          'PAID';
      } else {
        paymentStatus =
          'PARTIALLY PAID';
      }

      try {
        const updated =
          await pb
            .collection(
              'invoices'
            )
            .update<Invoice>(
              selectedInvoice.id,
              {
                paidAmount,
                paymentStatus,
              }
            );

        setInvoices(
          (previous) =>
            previous.map(
              (item) =>
                item.id ===
                updated.id
                  ? updated
                  : item
            )
        );

        setSelectedInvoice(
          updated
        );

        setPaidAmountInput(
          String(
            updated.paidAmount ||
              0
          )
        );

        alert(
          'Payment information updated.'
        );
      } catch (error: any) {
        console.error(
          'Payment update failed:',
          error
        );

        alert(
          `Unable to update payment information.\n\n${getPocketBaseErrorMessage(
            error
          )}`
        );
      }
    };

  /* =======================================================
     PRINT / PDF
  ======================================================= */

  const printInvoice = () => {
    if (!selectedInvoice) {
      return;
    }

    const client =
      selectedClient ||
      getClient(
        selectedInvoice.client
      );

    const quotation =
      selectedQuotation ||
      getQuotation(
        selectedInvoice.quotation
      );

    const subTotal =
      Number(
        selectedInvoice.subTotal ||
          0
      );

    const discount =
      Number(
        selectedInvoice.discount ||
          0
      );

    const tax =
      Number(
        selectedInvoice.tax ||
          0
      );

    const grandTotal =
      Number(
        selectedInvoice.grandTotal ||
          0
      );

    const paidAmount =
      Number(
        selectedInvoice.paidAmount ||
          0
      );

    const balance =
      Math.max(
        grandTotal -
          paidAmount,
        0
      );

    const itemRows =
      selectedItems.length > 0
        ? selectedItems
            .map(
              (
                item,
                index
              ) => `
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
                      item.unit ||
                        '—'
                    )}
                  </td>

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
              <td
                colspan="6"
                style="text-align:center"
              >
                No invoice items
              </td>
            </tr>
          `;

    const gstRows =
      quotation?.gstType ===
      'CGST_SGST'
        ? `
          <div class="summary-row">
            <span>
              CGST (${
                quotation.gstRate
                  ? quotation.gstRate /
                    2
                  : 0
              }%)
            </span>

            <strong>
              ${escapeHtml(
                formatCurrency(
                  quotation.cgst ||
                    0
                )
              )}
            </strong>
          </div>

          <div class="summary-row">
            <span>
              SGST (${
                quotation.gstRate
                  ? quotation.gstRate /
                    2
                  : 0
              }%)
            </span>

            <strong>
              ${escapeHtml(
                formatCurrency(
                  quotation.sgst ||
                    0
                )
              )}
            </strong>
          </div>
        `
        : quotation?.gstType ===
          'IGST'
        ? `
          <div class="summary-row">

            <span>
              IGST (${
                quotation.gstRate ||
                0
              }%)
            </span>

            <strong>
              ${escapeHtml(
                formatCurrency(
                  quotation.igst ||
                    0
                )
              )}
            </strong>

          </div>
        `
        : `
          <div class="summary-row">

            <span>
              Tax / GST
            </span>

            <strong>
              ${escapeHtml(
                formatCurrency(
                  tax
                )
              )}
            </strong>

          </div>
        `;

    const html = `
<!DOCTYPE html>

<html>

<head>

  <meta charset="UTF-8" />

  <title>
    ${escapeHtml(
      selectedInvoice.invoiceNumber
    )}
  </title>

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

      font-family:
        Arial,
        Helvetica,
        sans-serif;

      color: #222;
      background: white;
    }

    .page {
      width: 100%;
    }

    .header {
      display: flex;
      justify-content: space-between;
      gap: 30px;

      border-bottom:
        3px solid #9a641f;

      padding-bottom: 18px;
    }

    .logo {
      width: 120px;
      height: auto;
      object-fit: contain;
    }

    .company {
      text-align: right;
    }

    .company h1 {
      margin:
        0 0 6px;

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

    .invoice-meta {
      display: grid;

      grid-template-columns:
        1fr 1fr;

      gap: 25px;

      margin-bottom: 25px;
    }

    .box {
      border:
        1px solid #ddd;

      padding: 14px;

      border-radius: 5px;
    }

    .box h3 {
      margin:
        0 0 9px;

      color: #9a641f;

      font-size: 13px;
    }

    .box p {
      margin: 4px 0;
      font-size: 11px;
    }

    table {
      width: 100%;

      border-collapse:
        collapse;

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
      border-bottom:
        1px solid #ddd;

      padding: 9px;

      font-size: 11px;
    }

    .number {
      text-align: right;
    }

    .summary {
      width: 45%;

      margin-left: auto;

      margin-top: 20px;
    }

    .summary-row {
      display: flex;

      justify-content:
        space-between;

      padding: 7px 0;

      font-size: 12px;
    }

    .grand {
      border-top:
        2px solid #222;

      font-size: 16px;

      font-weight: bold;

      color: #9a641f;

      padding-top: 12px;
    }

    .terms {
      margin-top: 30px;

      border-top:
        1px solid #ddd;

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

      border-top:
        1px solid #ddd;

      text-align: center;

      font-size: 9px;

      color: #666;
    }

    @media print {

      body {
        print-color-adjust:
          exact;

        -webkit-print-color-adjust:
          exact;
      }

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
          onerror="
            this.style.display='none'
          "
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

          <br />

          ${escapeHtml(
            COMPANY.address[1]
          )}

          <br />

          ${escapeHtml(
            COMPANY.address[2]
          )}

        </p>

        <p>
          Phone:
          ${escapeHtml(
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

      <h2>
        TAX INVOICE
      </h2>

    </div>

    <div class="invoice-meta">

      <div class="box">

        <h3>
          BILL TO
        </h3>

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
            ? `
              <p>
                ${escapeHtml(
                  client.name
                )}
              </p>
            `
            : ''
        }

        ${
          client?.address
            ? `
              <p>
                ${escapeHtml(
                  client.address
                )}
              </p>
            `
            : ''
        }

        ${
          client?.phone
            ? `
              <p>
                Phone:
                ${escapeHtml(
                  client.phone
                )}
              </p>
            `
            : ''
        }

        ${
          client?.email
            ? `
              <p>
                Email:
                ${escapeHtml(
                  client.email
                )}
              </p>
            `
            : ''
        }

      </div>

      <div class="box">

        <h3>
          INVOICE DETAILS
        </h3>

        <p>

          <strong>
            Invoice No:
          </strong>

          ${escapeHtml(
            selectedInvoice.invoiceNumber
          )}

        </p>

        <p>

          <strong>
            Invoice Date:
          </strong>

          ${escapeHtml(
            formatDate(
              selectedInvoice.invoiceDate
            )
          )}

        </p>

        <p>

          <strong>
            Due Date:
          </strong>

          ${escapeHtml(
            formatDate(
              selectedInvoice.dueDate
            )
          )}

        </p>

        <p>

          <strong>
            Project:
          </strong>

          ${escapeHtml(
            selectedInvoice.projectName ||
              '—'
          )}

        </p>

        ${
          quotation
            ? `
              <p>

                <strong>
                  Quotation:
                </strong>

                ${escapeHtml(
                  quotation.quotationNumber
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

          <th>
            #
          </th>

          <th>
            Description
          </th>

          <th>
            Qty
          </th>

          <th>
            Unit
          </th>

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

        <span>
          Subtotal
        </span>

        <strong>
          ${escapeHtml(
            formatCurrency(
              subTotal
            )
          )}
        </strong>

      </div>

      <div class="summary-row">

        <span>
          Discount
        </span>

        <strong>

          -
          ${escapeHtml(
            formatCurrency(
              discount
            )
          )}

        </strong>

      </div>

      ${gstRows}

      <div class="summary-row grand">

        <span>
          Grand Total
        </span>

        <strong>

          ${escapeHtml(
            formatCurrency(
              grandTotal
            )
          )}

        </strong>

      </div>

    </div>

    <div
      class="box"
      style="margin-top:25px"
    >

      <h3>
        PAYMENT DETAILS
      </h3>

      <p>

        <strong>
          Payment Terms:
        </strong>

        ${escapeHtml(
          selectedInvoice.paymentTerms ||
            '—'
        )}

      </p>

      <p>

        <strong>
          Payment Status:
        </strong>

        ${escapeHtml(
          selectedInvoice.paymentStatus
        )}

      </p>

      <p>

        <strong>
          Paid Amount:
        </strong>

        ${escapeHtml(
          formatCurrency(
            paidAmount
          )
        )}

      </p>

      <p>

        <strong>
          Balance:
        </strong>

        ${escapeHtml(
          formatCurrency(
            balance
          )
        )}

      </p>

    </div>

    ${
      quotation?.termsConditions
        ? `
          <div class="terms">

            <h3>
              TERMS & CONDITIONS
            </h3>

            <p>
              ${escapeHtml(
                quotation.termsConditions
              )}
            </p>

          </div>
        `
        : ''
    }

    ${
      selectedInvoice.notes
        ? `
          <div class="terms">

            <h3>
              NOTES
            </h3>

            <p>
              ${escapeHtml(
                selectedInvoice.notes
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

      <br />

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
        'Please allow pop-ups in your browser to print the invoice.'
      );

      return;
    }

    printWindow.document.open();

    printWindow.document.write(
      html
    );

    printWindow.document.close();
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">

      <div className="max-w-7xl mx-auto">

        {/* =================================================
            HEADER
        ================================================= */}

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
              Invoices
            </h1>

            <p className="text-gray-500 mt-1">
              Manage invoices, payments and billing.
            </p>

          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="px-5 py-3 rounded-lg bg-gray-900 text-white hover:bg-black disabled:opacity-50"
          >
            {loading
              ? 'Refreshing...'
              : 'Refresh'}
          </button>

        </div>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-7">

          <div className="bg-white rounded-xl border p-5">

            <p className="text-sm text-gray-500">
              Total Invoices
            </p>

            <p className="text-2xl font-bold mt-2">
              {stats.total}
            </p>

          </div>

          <div className="bg-white rounded-xl border p-5">

            <p className="text-sm text-gray-500">
              Invoice Value
            </p>

            <p className="text-xl font-bold mt-2">
              {formatCurrency(
                stats.totalValue
              )}
            </p>

          </div>

          <div className="bg-white rounded-xl border p-5">

            <p className="text-sm text-gray-500">
              Paid
            </p>

            <p className="text-xl font-bold mt-2 text-green-700">
              {formatCurrency(
                stats.paid
              )}
            </p>

          </div>

          <div className="bg-white rounded-xl border p-5">

            <p className="text-sm text-gray-500">
              Outstanding
            </p>

            <p className="text-xl font-bold mt-2 text-orange-600">
              {formatCurrency(
                stats.outstanding
              )}
            </p>

          </div>

          <div className="bg-white rounded-xl border p-5">

            <p className="text-sm text-gray-500">
              Sent
            </p>

            <p className="text-2xl font-bold mt-2">
              {stats.sent}
            </p>

          </div>

        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="bg-white border rounded-xl p-4 mb-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search invoice, client or project..."
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
              className="border rounded-lg px-4 py-3"
            >

              <option value="ALL">
                All Payment Status
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

        {/* =================================================
            INVOICE TABLE
        ================================================= */}

        <div className="bg-white border rounded-xl overflow-hidden">

          {loading ? (

            <div className="p-10 text-center text-gray-500">
              Loading invoices...
            </div>

          ) : filteredInvoices.length === 0 ? (

            <div className="p-12 text-center">

              <div className="text-4xl mb-3">
                🧾
              </div>

              <h3 className="font-semibold text-lg">
                No invoices found
              </h3>

              <p className="text-gray-500 mt-1">
                Approved quotations can be converted into invoices.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-gray-900 text-white">

                  <tr>

                    <th className="text-left px-5 py-4">
                      Invoice
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

                    <th className="text-left px-5 py-4">
                      Payment
                    </th>

                    <th className="text-right px-5 py-4">
                      Total
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredInvoices.map(
                    (invoice) => {

                      const client =
                        getClient(
                          invoice.client
                        );

                      return (
                        <tr
                          key={
                            invoice.id
                          }
                          className="border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() =>
                            openInvoice(
                              invoice
                            )
                          }
                        >

                          <td className="px-5 py-4">

                            <p className="font-semibold text-[#9a641f]">
                              {
                                invoice.invoiceNumber
                              }
                            </p>

                            {invoice.projectName && (
                              <p className="text-xs text-gray-500">
                                {
                                  invoice.projectName
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
                              invoice.invoiceDate
                            )}

                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`
                                inline-flex
                                px-3 py-1
                                rounded-full
                                text-xs
                                font-semibold
                                ${
                                  invoice.status ===
                                  'SENT'
                                    ? 'bg-blue-100 text-blue-700'
                                    : invoice.status ===
                                      'CANCELLED'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-700'
                                }
                              `}
                            >
                              {
                                invoice.status
                              }
                            </span>

                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`
                                inline-flex
                                px-3 py-1
                                rounded-full
                                text-xs
                                font-semibold
                                ${
                                  invoice.paymentStatus ===
                                  'PAID'
                                    ? 'bg-green-100 text-green-700'
                                    : invoice.paymentStatus ===
                                      'PARTIALLY PAID'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : invoice.paymentStatus ===
                                      'OVERDUE'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-700'
                                }
                              `}
                            >
                              {
                                invoice.paymentStatus
                              }
                            </span>

                          </td>

                          <td className="px-5 py-4 text-right font-bold">

                            {formatCurrency(
                              invoice.grandTotal
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

      {/* ===================================================
          DETAILS MODAL
      =================================================== */}

      {showDetails &&
        selectedInvoice && (

          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">

            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto">

              {/* HEADER */}

              <div className="p-6 border-b flex items-start justify-between gap-4">

                <div>

                  <p className="text-sm text-gray-500">
                    Invoice
                  </p>

                  <h2 className="text-2xl font-bold">
                    {
                      selectedInvoice.invoiceNumber
                    }
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    {
                      selectedInvoice.projectName ||
                      'General Invoice'
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

                {/* BILL TO + DETAILS */}

                <div className="grid md:grid-cols-2 gap-5">

                  <div className="border rounded-xl p-5">

                    <h3 className="font-semibold text-[#9a641f] mb-3">
                      Bill To
                    </h3>

                    <p className="font-semibold">

                      {
                        selectedClient?.company ||
                        selectedClient?.name ||
                        '—'
                      }

                    </p>

                    {selectedClient?.company &&
                      selectedClient?.name && (
                        <p>
                          {
                            selectedClient.name
                          }
                        </p>
                      )}

                    {selectedClient?.address && (
                      <p className="text-sm text-gray-600 mt-2">
                        {
                          selectedClient.address
                        }
                      </p>
                    )}

                    {selectedClient?.phone && (
                      <p className="text-sm mt-2">
                        {
                          selectedClient.phone
                        }
                      </p>
                    )}

                    {selectedClient?.email && (
                      <p className="text-sm text-gray-600">
                        {
                          selectedClient.email
                        }
                      </p>
                    )}

                  </div>

                  <div className="border rounded-xl p-5">

                    <h3 className="font-semibold text-[#9a641f] mb-3">
                      Invoice Details
                    </h3>

                    <div className="space-y-2 text-sm">

                      <p>

                        <strong>
                          Invoice:
                        </strong>{' '}

                        {
                          selectedInvoice.invoiceNumber
                        }

                      </p>

                      <p>

                        <strong>
                          Date:
                        </strong>{' '}

                        {formatDate(
                          selectedInvoice.invoiceDate
                        )}

                      </p>

                      <p>

                        <strong>
                          Due:
                        </strong>{' '}

                        {formatDate(
                          selectedInvoice.dueDate
                        )}

                      </p>

                      {selectedQuotation && (
                        <p>

                          <strong>
                            Quotation:
                          </strong>{' '}

                          {
                            selectedQuotation.quotationNumber
                          }

                        </p>
                      )}

                    </div>

                  </div>

                </div>

                {/* ITEMS */}

                <div className="mt-6 border rounded-xl overflow-hidden">

                  <div className="px-5 py-4 bg-gray-50 border-b font-semibold">
                    Invoice Items
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

                        {selectedItems.length >
                        0 ? (

                          selectedItems.map(
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

                {/* TOTALS */}

                <div className="flex justify-end mt-6">

                  <div className="w-full md:w-96 border rounded-xl p-5 space-y-3">

                    <div className="flex justify-between">

                      <span>
                        Subtotal
                      </span>

                      <strong>

                        {formatCurrency(
                          selectedInvoice.subTotal
                        )}

                      </strong>

                    </div>

                    <div className="flex justify-between">

                      <span>
                        Discount
                      </span>

                      <strong>

                        -

                        {formatCurrency(
                          selectedInvoice.discount ||
                            0
                        )}

                      </strong>

                    </div>

                    {selectedQuotation?.gstType ===
                      'CGST_SGST' && (
                      <>

                        <div className="flex justify-between text-sm">

                          <span>

                            CGST (
                            {
                              selectedQuotation.gstRate
                                ? selectedQuotation.gstRate /
                                  2
                                : 0
                            }
                            %)

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

                            SGST (
                            {
                              selectedQuotation.gstRate
                                ? selectedQuotation.gstRate /
                                  2
                                : 0
                            }
                            %)

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

                    {selectedQuotation?.gstType ===
                      'IGST' && (

                      <div className="flex justify-between text-sm">

                        <span>

                          IGST (
                          {
                            selectedQuotation.gstRate ||
                            0
                          }
                          %)

                        </span>

                        <strong>

                          {formatCurrency(
                            selectedQuotation.igst ||
                              0
                          )}

                        </strong>

                      </div>

                    )}

                    {(!selectedQuotation?.gstType ||
                      selectedQuotation.gstType ===
                        'NONE') && (

                      <div className="flex justify-between text-sm">

                        <span>
                          Tax / GST
                        </span>

                        <strong>

                          {formatCurrency(
                            selectedInvoice.tax ||
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
                          selectedInvoice.grandTotal
                        )}

                      </strong>

                    </div>

                  </div>

                </div>

                {/* PAYMENT */}

                <div className="mt-6 border rounded-xl p-5">

                  <h3 className="font-semibold text-[#9a641f] mb-4">
                    Payment
                  </h3>

                  <div className="grid md:grid-cols-3 gap-4">

                    <div>

                      <label className="block text-sm text-gray-500 mb-1">
                        Payment Status
                      </label>

                      <div className="font-semibold">
                        {
                          selectedInvoice.paymentStatus
                        }
                      </div>

                    </div>

                    <div>

                      <label className="block text-sm text-gray-500 mb-1">
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
                            event
                              .target
                              .value
                          )
                        }
                        className="w-full border rounded-lg px-3 py-2"
                      />

                    </div>

                    <div>

                      <label className="block text-sm text-gray-500 mb-1">
                        Balance
                      </label>

                      <div className="font-bold text-orange-600">

                        {formatCurrency(
                          Math.max(
                            Number(
                              selectedInvoice.grandTotal ||
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
                    className="mt-4 px-5 py-2.5 rounded-lg bg-gray-900 text-white hover:bg-black"
                  >
                    Update Payment
                  </button>

                </div>

                {/* ACTIONS */}

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
                      className="px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
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
                      className="px-5 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700"
                    >
                      Cancel Invoice
                    </button>

                  )}

                  <button
                    onClick={
                      printInvoice
                    }
                    className="px-5 py-3 rounded-lg bg-[#9a641f] text-white hover:bg-[#7e5017]"
                  >
                    Print / PDF
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

      {/* ===================================================
          CREATING OVERLAY
      =================================================== */}

      {creating && (

        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">

          <div className="bg-white rounded-xl px-8 py-7 shadow-xl text-center">

            <div className="text-2xl mb-3">
              🧾
            </div>

            <p className="font-semibold">
              Creating invoice...
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Please wait.
            </p>

          </div>

        </div>

      )}

    </div>
  );
}