
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Truck,
  ClipboardList,
  PackageCheck,
  History,
  RefreshCw,
  Plus,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

type Supplier = {
  id: number;
  supplier_code: string;
  supplier_name: string;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  address: string | null;
  city: string | null;
  payment_terms: string | null;
  is_active: boolean;
};

type InventoryItem = {
  id: number;
  sku: string;
  product_name: string;
  category: string;
  unit: string;
  quantity: number;
  purchase_price: number;
};

type PurchaseOrder = {
  id: number;
  po_number: string;
  supplier_id: number;
  order_date: string;
  expected_date: string | null;
  status: string;
  subtotal: number;
  notes: string | null;
  suppliers?: { supplier_name: string } | null;
};

type PurchaseLine = {
  id: number;
  purchase_order_id: number;
  item_id: number;
  ordered_quantity: number;
  received_quantity: number;
  unit_cost: number;
  line_total: number;
  inventory_items?: {
    product_name: string;
    sku: string;
    unit: string;
  } | null;
  purchase_orders?: {
    po_number: string;
    status: string;
    suppliers?: { supplier_name: string } | null;
  } | null;
};

type Receipt = {
  id: number;
  receipt_number: string;
  purchase_order_id: number;
  reference: string | null;
  notes: string | null;
  received_at: string;
  goods_receipt_items?: {
    quantity: number;
    unit_cost: number;
    quantity_before: number;
    quantity_after: number;
    inventory_items?: {
      product_name: string;
      sku: string;
      unit: string;
    } | null;
  }[];
  purchase_orders?: {
    po_number: string;
    suppliers?: { supplier_name: string } | null;
  } | null;
};

type Tab = 'suppliers' | 'orders' | 'receive' | 'history';

const money = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));

export default function Purchasing() {
  const [tab, setTab] = useState<Tab>('suppliers');

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [lines, setLines] = useState<PurchaseLine[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Supplier form
  const [supplierName, setSupplierName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 days');

  // Purchase-order form
  const [supplierId, setSupplierId] = useState('');
  const [itemId, setItemId] = useState('');
  const [orderQuantity, setOrderQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Goods receipt form
  const [lineId, setLineId] = useState('');
  const [receiveQuantity, setReceiveQuantity] = useState('');
  const [receiptReference, setReceiptReference] = useState('');
  const [receiptNotes, setReceiptNotes] = useState('');

  const selectedItem = items.find((item) => String(item.id) === itemId);
  const selectedLine = lines.find((line) => String(line.id) === lineId);

  const remainingQuantity = selectedLine
    ? Number(selectedLine.ordered_quantity) -
      Number(selectedLine.received_quantity)
    : 0;

  const orderTotal =
    Number(orderQuantity || 0) * Number(unitCost || 0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [
        supplierResult,
        itemResult,
        orderResult,
        lineResult,
        receiptResult,
      ] = await Promise.all([
        supabase
          .from('suppliers')
          .select('*')
          .order('supplier_name'),

        supabase
          .from('inventory_items')
          .select('id, sku, product_name, category, unit, quantity, purchase_price')
          .eq('is_active', true)
          .order('product_name'),

        supabase
          .from('purchase_orders')
          .select('*, suppliers(supplier_name)')
          .order('created_at', { ascending: false })
          .limit(200),

        supabase
          .from('purchase_order_items')
          .select(`
            id,
            purchase_order_id,
            item_id,
            ordered_quantity,
            received_quantity,
            unit_cost,
            line_total,
            inventory_items(product_name, sku, unit),
            purchase_orders(
              po_number,
              status,
              suppliers(supplier_name)
            )
          `)
          .order('id', { ascending: false })
          .limit(500),

        supabase
          .from('goods_receipts')
          .select(`
            id,
            receipt_number,
            purchase_order_id,
            reference,
            notes,
            received_at,
            purchase_orders(
              po_number,
              suppliers(supplier_name)
            ),
            goods_receipt_items(
              quantity,
              unit_cost,
              quantity_before,
              quantity_after,
              inventory_items(product_name, sku, unit)
            )
          `)
          .order('received_at', { ascending: false })
          .limit(200),
      ]);

      if (supplierResult.error) throw supplierResult.error;
      if (itemResult.error) throw itemResult.error;
      if (orderResult.error) throw orderResult.error;
      if (lineResult.error) throw lineResult.error;
      if (receiptResult.error) throw receiptResult.error;

      setSuppliers((supplierResult.data ?? []) as Supplier[]);
      setItems((itemResult.data ?? []) as InventoryItem[]);
      setOrders((orderResult.data ?? []) as unknown as PurchaseOrder[]);
      setLines((lineResult.data ?? []) as unknown as PurchaseLine[]);
      setReceipts((receiptResult.data ?? []) as unknown as Receipt[]);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Unable to load purchasing data.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const addSupplier = async () => {
    resetMessages();

    if (!supplierName.trim()) {
      setError('Supplier name is required.');
      return;
    }

    setSaving(true);

    try {
      const code =
        'SUP-' +
        Date.now().toString().slice(-9);

      const { error: insertError } = await supabase
        .from('suppliers')
        .insert({
          supplier_code: code,
          supplier_name: supplierName.trim(),
          company_name: companyName.trim() || null,
          phone: supplierPhone.trim() || null,
          email: supplierEmail.trim() || null,
          gstin: gstin.trim().toUpperCase() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          payment_terms: paymentTerms.trim() || null,
        });

      if (insertError) throw insertError;

      setSuccess('Supplier added successfully.');
      setSupplierName('');
      setCompanyName('');
      setSupplierPhone('');
      setSupplierEmail('');
      setGstin('');
      setAddress('');
      setCity('');
      setPaymentTerms('Net 30 days');
      await loadData();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to add supplier.'
      );
    } finally {
      setSaving(false);
    }
  };

  const createOrder = async () => {
    resetMessages();

    const qty = Number(orderQuantity);
    const cost = Number(unitCost);

    if (!supplierId || !itemId) {
      setError('Select a supplier and an inventory item.');
      return;
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Enter an order quantity greater than zero.');
      return;
    }

    if (!Number.isFinite(cost) || cost < 0) {
      setError('Enter a valid purchase rate.');
      return;
    }

    setSaving(true);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'create_purchase_order',
        {
          p_supplier_id: Number(supplierId),
          p_expected_date: expectedDate || null,
          p_notes: orderNotes.trim() || null,
          p_items: [
            {
              item_id: Number(itemId),
              quantity: qty,
              unit_cost: cost,
            },
          ],
        }
      );

      if (rpcError) throw rpcError;

      setSuccess(
        `Purchase order ${data.po_number} created. Total: ${money(data.subtotal)}. Stock has not changed yet.`
      );

      setSupplierId('');
      setItemId('');
      setOrderQuantity('');
      setUnitCost('');
      setExpectedDate('');
      setOrderNotes('');
      await loadData();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to create purchase order.'
      );
    } finally {
      setSaving(false);
    }
  };

  const receiveGoods = async () => {
    resetMessages();

    const qty = Number(receiveQuantity);

    if (!lineId || !Number.isFinite(qty) || qty <= 0) {
      setError('Select a purchase line and enter a valid received quantity.');
      return;
    }

    if (qty > remainingQuantity) {
      setError(`Only ${remainingQuantity} units remain to be received.`);
      return;
    }

    const confirmed = window.confirm(
      `Confirm receipt of ${qty} ${selectedLine?.inventory_items?.unit ?? 'units'}? Inventory stock will increase.`
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'receive_purchase_order_item',
        {
          p_purchase_order_item_id: Number(lineId),
          p_quantity: qty,
          p_reference: receiptReference.trim() || null,
          p_notes: receiptNotes.trim() || null,
        }
      );

      if (rpcError) throw rpcError;
      if (!data?.success) throw new Error('Receipt was not confirmed.');

      setSuccess(
        `Goods received: ${data.receipt_number}. Stock increased from ${data.quantity_before} to ${data.quantity_after}.`
      );

      setLineId('');
      setReceiveQuantity('');
      setReceiptReference('');
      setReceiptNotes('');
      await loadData();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to receive goods.'
      );
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof Truck }[] = [
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'orders', label: 'Purchase Orders', icon: ClipboardList },
    { id: 'receive', label: 'Receive Goods', icon: PackageCheck },
    { id: 'history', label: 'Purchase History', icon: History },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Supplier & Purchase Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage suppliers, purchase orders, receipts and stock updates.
            </p>
          </div>

          <button
            onClick={() => void loadData()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-slate-500">Active Suppliers</p>
            <p className="mt-2 text-2xl font-bold">
              {suppliers.filter((supplier) => supplier.is_active).length}
            </p>
          </div>
          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-slate-500">Purchase Orders</p>
            <p className="mt-2 text-2xl font-bold">{orders.length}</p>
          </div>
          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-slate-500">Goods Receipts</p>
            <p className="mt-2 text-2xl font-bold">{receipts.length}</p>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto border-b">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                resetMessages();
                setTab(id);
              }}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${
                tab === id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span className="whitespace-pre-wrap">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border bg-white p-10 text-center text-slate-500">
            Loading purchasing data...
          </div>
        ) : (
          <>
            {tab === 'suppliers' && (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,400px)_1fr]">
                <section className="h-fit rounded-xl border bg-white p-5">
                  <h2 className="mb-4 font-semibold">Add Supplier</h2>
                  <div className="space-y-3">
                    <input
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder="Supplier name *"
                      className="w-full rounded-lg border p-3"
                    />
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Company name"
                      className="w-full rounded-lg border p-3"
                    />
                    <input
                      value={supplierPhone}
                      onChange={(e) => setSupplierPhone(e.target.value)}
                      placeholder="Phone number"
                      className="w-full rounded-lg border p-3"
                    />
                    <input
                      type="email"
                      value={supplierEmail}
                      onChange={(e) => setSupplierEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full rounded-lg border p-3"
                    />
                    <input
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      placeholder="GSTIN"
                      className="w-full rounded-lg border p-3"
                    />
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Address"
                      rows={2}
                      className="w-full rounded-lg border p-3"
                    />
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="w-full rounded-lg border p-3"
                    />
                    <input
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      placeholder="Payment terms"
                      className="w-full rounded-lg border p-3"
                    />
                    <button
                      onClick={() => void addSupplier()}
                      disabled={saving}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 p-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                    >
                      <Plus size={18} />
                      {saving ? 'Saving...' : 'Add Supplier'}
                    </button>
                  </div>
                </section>

                <section className="overflow-hidden rounded-xl border bg-white">
                  <div className="border-b p-5">
                    <h2 className="font-semibold">Supplier Directory</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Supplier</th>
                          <th className="px-4 py-3">Contact</th>
                          <th className="px-4 py-3">GSTIN</th>
                          <th className="px-4 py-3">Payment Terms</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {suppliers.map((supplier) => (
                          <tr key={supplier.id}>
                            <td className="px-4 py-4">
                              <p className="font-medium">{supplier.supplier_name}</p>
                              <p className="text-xs text-slate-500">
                                {supplier.company_name || supplier.supplier_code}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <p>{supplier.phone || '—'}</p>
                              <p className="text-xs text-slate-500">
                                {supplier.email || ''}
                              </p>
                            </td>
                            <td className="px-4 py-4">{supplier.gstin || '—'}</td>
                            <td className="px-4 py-4">
                              {supplier.payment_terms || '—'}
                            </td>
                          </tr>
                        ))}
                        {suppliers.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-500">
                              No suppliers yet. Add your first supplier.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {tab === 'orders' && (
              <div className="space-y-6">
                <section className="rounded-xl border bg-white p-5 md:p-6">
                  <h2 className="mb-5 font-semibold">Create Purchase Order</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">Supplier *</label>
                      <select
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        className="w-full rounded-lg border p-3"
                      >
                        <option value="">Select supplier</option>
                        {suppliers.filter((s) => s.is_active).map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.supplier_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Inventory Item *</label>
                      <select
                        value={itemId}
                        onChange={(e) => {
                          const value = e.target.value;
                          setItemId(value);
                          const item = items.find((entry) => String(entry.id) === value);
                          setUnitCost(
                            item ? String(item.purchase_price ?? 0) : ''
                          );
                        }}
                        className="w-full rounded-lg border p-3"
                      >
                        <option value="">Select material</option>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.sku} — {item.product_name} ({item.unit})
                          </option>
                        ))}
                      </select>
                      {selectedItem && (
                        <p className="mt-1 text-xs text-slate-500">
                          Current stock: {selectedItem.quantity} {selectedItem.unit}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Order Quantity *</label>
                      <input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={orderQuantity}
                        onChange={(e) => setOrderQuantity(e.target.value)}
                        className="w-full rounded-lg border p-3"
                        placeholder="Quantity"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Unit Purchase Cost (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={unitCost}
                        onChange={(e) => setUnitCost(e.target.value)}
                        className="w-full rounded-lg border p-3"
                        placeholder="Cost per unit"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Expected Delivery</label>
                      <input
                        type="date"
                        value={expectedDate}
                        onChange={(e) => setExpectedDate(e.target.value)}
                        className="w-full rounded-lg border p-3"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Order Total</label>
                      <div className="rounded-lg border bg-slate-50 p-3 font-semibold">
                        {money(orderTotal)}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium">Notes</label>
                      <textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border p-3"
                        placeholder="Purchase details"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => void createOrder()}
                    disabled={saving || !suppliers.length || !items.length}
                    className="mt-5 flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                  >
                    <Plus size={18} />
                    {saving ? 'Creating...' : 'Create Purchase Order'}
                  </button>
                  <p className="mt-3 text-xs text-slate-500">
                    Creating a purchase order does not change inventory stock.
                  </p>
                </section>

                <section className="overflow-hidden rounded-xl border bg-white">
                  <div className="border-b p-5">
                    <h2 className="font-semibold">Purchase Orders</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-3">PO Number</th>
                          <th className="px-4 py-3">Supplier</th>
                          <th className="px-4 py-3">Order Date</th>
                          <th className="px-4 py-3">Expected</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {orders.map((order) => (
                          <tr key={order.id}>
                            <td className="px-4 py-4 font-medium">{order.po_number}</td>
                            <td className="px-4 py-4">
                              {order.suppliers?.supplier_name ?? 'Supplier'}
                            </td>
                            <td className="px-4 py-4">{order.order_date}</td>
                            <td className="px-4 py-4">{order.expected_date || '—'}</td>
                            <td className="px-4 py-4">{money(order.subtotal)}</td>
                            <td className="px-4 py-4">
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">
                                {order.status.replaceAll('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {orders.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-500">
                              No purchase orders created yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {tab === 'receive' && (
              <section className="max-w-3xl rounded-xl border bg-white p-5 md:p-7">
                <div className="mb-5">
                  <h2 className="font-semibold">Receive Goods Against Purchase Order</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Partial receipts are supported. Received quantity cannot exceed the outstanding order quantity.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Purchase Order Item *</label>
                    <select
                      value={lineId}
                      onChange={(e) => {
                        setLineId(e.target.value);
                        setReceiveQuantity('');
                      }}
                      className="w-full rounded-lg border p-3"
                    >
                      <option value="">Select outstanding order item</option>
                      {lines.filter((line) => {
                        const status = line.purchase_orders?.status;
                        const remaining =
                          Number(line.ordered_quantity) - Number(line.received_quantity);
                        return remaining > 0 && status !== 'CANCELLED';
                      }).map((line) => {
                        const remaining =
                          Number(line.ordered_quantity) - Number(line.received_quantity);
                        return (
                          <option key={line.id} value={line.id}>
                            {line.purchase_orders?.po_number ?? `PO item ${line.id}`}
                            {' — '}
                            {line.inventory_items?.product_name ?? `Item ${line.item_id}`}
                            {' — Remaining: '}
                            {remaining} {line.inventory_items?.unit ?? ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {selectedLine && (
                    <div className="rounded-lg border bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Outstanding quantity</p>
                      <p className="mt-1 text-xl font-bold">
                        {remainingQuantity} {selectedLine.inventory_items?.unit ?? ''}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Ordered: {selectedLine.ordered_quantity} · Already received: {selectedLine.received_quantity}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Supplier: {selectedLine.purchase_orders?.suppliers?.supplier_name ?? '—'}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium">Received Quantity *</label>
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      max={remainingQuantity}
                      value={receiveQuantity}
                      onChange={(e) => setReceiveQuantity(e.target.value)}
                      className="w-full rounded-lg border p-3"
                      placeholder="Quantity received today"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Delivery Challan / Invoice Reference</label>
                    <input
                      value={receiptReference}
                      onChange={(e) => setReceiptReference(e.target.value)}
                      className="w-full rounded-lg border p-3"
                      placeholder="Supplier challan number"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Notes</label>
                    <textarea
                      value={receiptNotes}
                      onChange={(e) => setReceiptNotes(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border p-3"
                      placeholder="Condition of goods, delivery notes..."
                    />
                  </div>

                  <button
                    onClick={() => void receiveGoods()}
                    disabled={saving || !lineId}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                  >
                    <PackageCheck size={18} />
                    {saving ? 'Recording Receipt...' : 'Confirm Goods Receipt & Increase Stock'}
                  </button>
                </div>
              </section>
            )}

            {tab === 'history' && (
              <section className="overflow-hidden rounded-xl border bg-white">
                <div className="border-b p-5">
                  <h2 className="font-semibold">Goods Receipt History</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Latest 200 receipts with stock balance changes.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Receipt</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Purchase Order</th>
                        <th className="px-4 py-3">Material</th>
                        <th className="px-4 py-3">Quantity</th>
                        <th className="px-4 py-3">Stock Before → After</th>
                        <th className="px-4 py-3">Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {receipts.map((receipt) => (
                        (receipt.goods_receipt_items ?? []).map((line, index) => (
                          <tr key={`${receipt.id}-${index}`}>
                            <td className="px-4 py-4 font-medium">{receipt.receipt_number}</td>
                            <td className="px-4 py-4">
                              {new Date(receipt.received_at).toLocaleString()}
                            </td>
                            <td className="px-4 py-4">
                              <p>{receipt.purchase_orders?.po_number ?? '—'}</p>
                              <p className="text-xs text-slate-500">
                                {receipt.purchase_orders?.suppliers?.supplier_name ?? ''}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              {line.inventory_items?.product_name ?? 'Material'}
                            </td>
                            <td className="px-4 py-4 font-semibold text-green-700">
                              +{line.quantity} {line.inventory_items?.unit ?? ''}
                            </td>
                            <td className="px-4 py-4">
                              {line.quantity_before} → {line.quantity_after}
                            </td>
                            <td className="px-4 py-4">{receipt.reference || '—'}</td>
                          </tr>
                        ))
                      ))}
                      {receipts.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">
                            No goods receipts recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
