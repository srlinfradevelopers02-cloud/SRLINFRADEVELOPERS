
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  CheckCircle2,
  Clock3,
  Loader2,
  PackagePlus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Category = 'INTERIOR' | 'AUTOMATION' | 'ELEVATORS' | 'OTHER';
type MovementType = 'RECEIVE' | 'ISSUE' | 'ADJUSTMENT';

type InventoryItem = {
  id: number;
  sku: string;
  product_name: string;
  category: Category;
  unit: string;
  quantity: number;
  minimum_stock: number;
  purchase_price: number;
  selling_price: number;
  supplier_name: string | null;
  supplier_phone: string | null;
  storage_location: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Movement = {
  id: number;
  item_id: number;
  movement_type: MovementType;
  quantity: number;
  unit_cost: number;
  quantity_before: number;
  quantity_after: number;
  reference: string | null;
  notes: string | null;
  performed_by: string | null;
  created_at: string;
};

type StaffProfile = {
  id: string;
  full_name: string;
  role: string;
  department?: string;
};

const CATEGORIES: Category[] = [
  'INTERIOR',
  'AUTOMATION',
  'ELEVATORS',
  'OTHER',
];

const UNITS = [
  'PCS',
  'BOX',
  'SHEET',
  'SQFT',
  'SQM',
  'METER',
  'KG',
  'LITER',
  'SET',
  'ROLL',
  'PAIR',
];

const EMPTY_PRODUCT = {
  sku: '',
  product_name: '',
  category: 'INTERIOR' as Category,
  unit: 'PCS',
  minimum_stock: '5',
  purchase_price: '0',
  selling_price: '0',
  supplier_name: '',
  supplier_phone: '',
  storage_location: '',
  description: '',
};

const EMPTY_MOVEMENT = {
  item_id: '',
  movement_type: 'RECEIVE' as MovementType,
  quantity: '',
  unit_cost: '0',
  reference: '',
  notes: '',
};

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

const cardClass =
  'rounded-xl border border-slate-200 bg-white p-4 shadow-sm';

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  ) {
    return String(error.message);
  }

  return 'An unexpected error occurred.';
}

function money(value: number | string | null | undefined): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function dateTime(value: string): string {
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [currentStaff, setCurrentStaff] = useState<StaffProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');

  const [activeTab, setActiveTab] = useState<'ITEMS' | 'HISTORY'>('ITEMS');
  const [showProductForm, setShowProductForm] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);

  const [productForm, setProductForm] = useState({ ...EMPTY_PRODUCT });
  const [editingProduct, setEditingProduct] = useState<InventoryItem | null>(null);
  const [movementForm, setMovementForm] = useState({ ...EMPTY_MOVEMENT });

  const role = currentStaff?.role?.toUpperCase();
  const canManage = role === 'ADMIN' || role === 'MANAGER';
  const isAdmin = role === 'ADMIN';

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('Please sign in to access inventory.');

      const { data: profile, error: profileError } = await supabase
        .from('staff')
        .select('id,full_name,role,department,is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Active staff profile not found.');

      setCurrentStaff(profile as StaffProfile);

      const [itemsResult, movementResult] = await Promise.all([
        supabase
          .from('inventory_items')
          .select('*')
          .order('product_name', { ascending: true }),

        supabase
          .from('stock_movements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200),
      ]);

      if (itemsResult.error) throw itemsResult.error;
      if (movementResult.error) throw movementResult.error;

      setItems((itemsResult.data || []) as InventoryItem[]);
      setMovements((movementResult.data || []) as Movement[]);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !q ||
        item.product_name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (item.supplier_name || '').toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === 'ALL' || item.category === categoryFilter;

      const lowStock = Number(item.quantity) <= Number(item.minimum_stock);

      const matchesStock =
        stockFilter === 'ALL' ||
        (stockFilter === 'LOW' && lowStock) ||
        (stockFilter === 'AVAILABLE' && !lowStock);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [items, search, categoryFilter, stockFilter]);

  const stats = useMemo(() => {
    const activeItems = items.filter((item) => item.is_active);

    return {
      products: activeItems.length,
      lowStock: activeItems.filter(
        (item) => Number(item.quantity) <= Number(item.minimum_stock),
      ).length,
      totalUnits: activeItems.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0,
      ),
      inventoryValue: activeItems.reduce(
        (total, item) =>
          total + Number(item.quantity || 0) * Number(item.purchase_price || 0),
        0,
      ),
    };
  }, [items]);

  function startNewProduct() {
    setEditingProduct(null);
    setProductForm({ ...EMPTY_PRODUCT });
    setError('');
    setSuccess('');
    setShowProductForm(true);
  }

  function startEditProduct(item: InventoryItem) {
    setEditingProduct(item);
    setProductForm({
      sku: item.sku,
      product_name: item.product_name,
      category: item.category,
      unit: item.unit,
      minimum_stock: String(item.minimum_stock),
      purchase_price: String(item.purchase_price),
      selling_price: String(item.selling_price),
      supplier_name: item.supplier_name || '',
      supplier_phone: item.supplier_phone || '',
      storage_location: item.storage_location || '',
      description: item.description || '',
    });
    setError('');
    setSuccess('');
    setShowProductForm(true);
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!canManage) {
      setError('Only Admin or Manager can manage inventory products.');
      return;
    }

    const minimumStock = Number(productForm.minimum_stock);
    const purchasePrice = Number(productForm.purchase_price);
    const sellingPrice = Number(productForm.selling_price);

    if (
      !productForm.sku.trim() ||
      !productForm.product_name.trim()
    ) {
      setError('SKU and product name are required.');
      return;
    }

    if (
      !Number.isFinite(minimumStock) ||
      minimumStock < 0 ||
      !Number.isFinite(purchasePrice) ||
      purchasePrice < 0 ||
      !Number.isFinite(sellingPrice) ||
      sellingPrice < 0
    ) {
      setError('Stock threshold and prices must be valid non-negative numbers.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        sku: productForm.sku.trim(),
        product_name: productForm.product_name.trim(),
        category: productForm.category,
        unit: productForm.unit,
        minimum_stock: minimumStock,
        purchase_price: purchasePrice,
        selling_price: sellingPrice,
        supplier_name: productForm.supplier_name.trim() || null,
        supplier_phone: productForm.supplier_phone.trim() || null,
        storage_location: productForm.storage_location.trim() || null,
        description: productForm.description.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (editingProduct) {
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update(payload)
          .eq('id', editingProduct.id);

        if (updateError) throw updateError;

        setSuccess('Product details updated. Stock quantity was not changed.');
      } else {
        const { error: insertError } = await supabase
          .from('inventory_items')
          .insert({
            ...payload,
            quantity: 0,
            created_by: currentStaff?.id || null,
          });

        if (insertError) throw insertError;

        setSuccess('Product added. Record an opening stock receipt to add quantity.');
      }

      setShowProductForm(false);
      await loadData();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setSaving(false);
    }
  }

  function startMovement(item?: InventoryItem, type?: MovementType) {
    setMovementForm({
      ...EMPTY_MOVEMENT,
      item_id: item ? String(item.id) : '',
      movement_type: type || 'RECEIVE',
      unit_cost: item ? String(item.purchase_price) : '0',
    });

    setError('');
    setSuccess('');
    setShowMovementForm(true);
  }

  async function saveMovement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!canManage) {
      setError('Only Admin or Manager can record stock movements.');
      return;
    }

    const itemId = Number(movementForm.item_id);
    const quantity = Number(movementForm.quantity);
    const unitCost = Number(movementForm.unit_cost);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      setError('Select a product.');
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    if (!Number.isFinite(unitCost) || unitCost < 0) {
      setError('Unit cost cannot be negative.');
      return;
    }

    setSaving(true);

    try {
      const { error: rpcError } = await supabase.rpc('manage_stock', {
        p_item_id: itemId,
        p_movement_type: movementForm.movement_type,
        p_quantity: quantity,
        p_unit_cost: unitCost,
        p_reference: movementForm.reference.trim() || null,
        p_notes: movementForm.notes.trim() || null,
      });

      if (rpcError) throw rpcError;

      setShowMovementForm(false);
      setSuccess(
        movementForm.movement_type === 'RECEIVE'
          ? 'Stock received successfully.'
          : movementForm.movement_type === 'ISSUE'
            ? 'Stock issued successfully.'
            : 'Stock balance adjusted successfully.',
      );

      await loadData();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setSaving(false);
    }
  }

  async function deactivateProduct(item: InventoryItem) {
    if (!isAdmin) {
      setError('Only Admin can deactivate a product.');
      return;
    }

    if (Number(item.quantity) > 0) {
      setError('This product has remaining stock. Issue or adjust stock before deactivating.');
      return;
    }

    if (!window.confirm(`Deactivate "${item.product_name}"?`)) return;

    setError('');
    setSuccess('');

    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', item.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess('Product deactivated.');
    await loadData();
  }

  function itemName(itemId: number): string {
    const item = items.find((product) => product.id === itemId);
    return item ? `${item.sku} — ${item.product_name}` : `Item #${itemId}`;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="h-7 w-7 text-blue-700" />
              <h1 className="text-2xl font-bold text-slate-900">
                Stock & Inventory
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Manage interior materials, automation products and elevators.
            </p>
            {currentStaff && (
              <p className="mt-2 text-xs text-slate-500">
                {currentStaff.full_name} · {currentStaff.role}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => startMovement()}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                >
                  <ArrowDownToLine className="h-4 w-4" />
                  Stock Movement
                </button>

                <button
                  type="button"
                  onClick={startNewProduct}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  <PackagePlus className="h-4 w-4" />
                  Add Product
                </button>
              </>
            )}
          </div>
        </header>

        {/* Notifications */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-words">{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              className="ml-auto"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess('')}
              className="ml-auto"
              aria-label="Dismiss success"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            { label: 'Active Products', value: stats.products, icon: Boxes },
            { label: 'Low Stock', value: stats.lowStock, icon: AlertCircle },
            {
              label: 'Total Units',
              value: stats.totalUnits.toLocaleString('en-IN'),
              icon: PackagePlus,
            },
            {
              label: 'Stock Value',
              value: money(stats.inventoryValue),
              icon: CheckCircle2,
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div key={stat.label} className={cardClass}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500 sm:text-sm">
                    {stat.label}
                  </p>
                  <Icon className="h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-3 break-words text-xl font-bold text-slate-900 sm:text-2xl">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('ITEMS')}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${
              activeTab === 'ITEMS'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500'
            }`}
          >
            Products
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${
              activeTab === 'HISTORY'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500'
            }`}
          >
            Stock History
          </button>
        </div>

        {activeTab === 'ITEMS' && (
          <section className={`${cardClass} space-y-4`}>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  className={`${inputClass} pl-9`}
                  placeholder="Search SKU, product or supplier..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search inventory"
                />
              </div>

              <select
                className={inputClass}
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                aria-label="Filter category"
              >
                <option value="ALL">All categories</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                className={inputClass}
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value)}
                aria-label="Filter stock level"
              >
                <option value="ALL">All stock levels</option>
                <option value="LOW">Low stock</option>
                <option value="AVAILABLE">Stock above minimum</option>
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading inventory...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-16 text-center">
                <Boxes className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="mt-3 font-semibold text-slate-800">
                  No inventory products found
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {canManage
                    ? 'Add a product to start tracking stock.'
                    : 'Inventory products will appear here when available.'}
                </p>
                {canManage && (
                  <button
                    type="button"
                    onClick={startNewProduct}
                    className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Add your first product
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                      <th className="px-3 py-3 font-semibold">Product</th>
                      <th className="px-3 py-3 font-semibold">Category</th>
                      <th className="px-3 py-3 font-semibold">Stock</th>
                      <th className="px-3 py-3 font-semibold">Min. stock</th>
                      <th className="px-3 py-3 font-semibold">Purchase</th>
                      <th className="px-3 py-3 font-semibold">Selling</th>
                      <th className="px-3 py-3 font-semibold">Supplier</th>
                      <th className="px-3 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredItems.map((item) => {
                      const lowStock =
                        Number(item.quantity) <= Number(item.minimum_stock);

                      return (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                        >
                          <td className="px-3 py-4">
                            <p className="font-semibold text-slate-900">
                              {item.product_name}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {item.sku}
                            </p>
                            {item.storage_location && (
                              <p className="mt-1 text-xs text-slate-500">
                                Location: {item.storage_location}
                              </p>
                            )}
                          </td>

                          <td className="px-3 py-4">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {item.category}
                            </span>
                          </td>

                          <td className="px-3 py-4">
                            <p
                              className={`font-bold ${
                                lowStock ? 'text-red-600' : 'text-slate-900'
                              }`}
                            >
                              {Number(item.quantity).toLocaleString('en-IN')}{' '}
                              {item.unit}
                            </p>
                            {lowStock && (
                              <p className="mt-1 text-xs text-red-600">
                                Low stock
                              </p>
                            )}
                          </td>

                          <td className="px-3 py-4 text-slate-600">
                            {Number(item.minimum_stock)} {item.unit}
                          </td>

                          <td className="px-3 py-4 text-slate-700">
                            {money(item.purchase_price)}
                          </td>

                          <td className="px-3 py-4 text-slate-700">
                            {money(item.selling_price)}
                          </td>

                          <td className="px-3 py-4 text-slate-600">
                            <p>{item.supplier_name || '—'}</p>
                            {item.supplier_phone && (
                              <p className="mt-1 text-xs text-slate-400">
                                {item.supplier_phone}
                              </p>
                            )}
                          </td>

                          <td className="px-3 py-4">
                            {canManage ? (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => startMovement(item, 'RECEIVE')}
                                  title="Receive stock"
                                  className="rounded-lg border border-green-200 p-2 text-green-700 hover:bg-green-50"
                                >
                                  <ArrowDownToLine className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => startMovement(item, 'ISSUE')}
                                  title="Issue stock"
                                  className="rounded-lg border border-orange-200 p-2 text-orange-700 hover:bg-orange-50"
                                >
                                  <ArrowUpFromLine className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => startEditProduct(item)}
                                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                >
                                  Edit
                                </button>

                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => void deactivateProduct(item)}
                                    disabled={!item.is_active}
                                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
                                  >
                                    Deactivate
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">
                                View only
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && (
              <p className="text-xs text-slate-400">
                Showing {filteredItems.length} of {items.length} products.
              </p>
            )}
          </section>
        )}

        {activeTab === 'HISTORY' && (
          <section className={`${cardClass} space-y-4`}>
            <div>
              <h2 className="font-semibold text-slate-900">
                Stock movement history
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest 200 stock movements.
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
              </div>
            ) : movements.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                No stock movements recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                      <th className="px-3 py-3">Date</th>
                      <th className="px-3 py-3">Product</th>
                      <th className="px-3 py-3">Movement</th>
                      <th className="px-3 py-3">Quantity</th>
                      <th className="px-3 py-3">Before</th>
                      <th className="px-3 py-3">After</th>
                      <th className="px-3 py-3">Reference / Notes</th>
                    </tr>
                  </thead>

                  <tbody>
                    {movements.map((movement) => (
                      <tr
                        key={movement.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="whitespace-nowrap px-3 py-4 text-slate-600">
                          {dateTime(movement.created_at)}
                        </td>

                        <td className="px-3 py-4 font-medium text-slate-800">
                          {itemName(movement.item_id)}
                        </td>

                        <td className="px-3 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              movement.movement_type === 'RECEIVE'
                                ? 'bg-green-100 text-green-700'
                                : movement.movement_type === 'ISSUE'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {movement.movement_type}
                          </span>
                        </td>

                        <td className="px-3 py-4 font-semibold text-slate-800">
                          {Number(movement.quantity).toLocaleString('en-IN')}
                        </td>

                        <td className="px-3 py-4 text-slate-600">
                          {Number(movement.quantity_before).toLocaleString('en-IN')}
                        </td>

                        <td className="px-3 py-4 font-semibold text-slate-800">
                          {Number(movement.quantity_after).toLocaleString('en-IN')}
                        </td>

                        <td className="px-3 py-4">
                          <p className="text-slate-700">
                            {movement.reference || '—'}
                          </p>
                          {movement.notes && (
                            <p className="mt-1 max-w-xs whitespace-pre-wrap text-xs text-slate-500">
                              {movement.notes}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Product modal */}
      {showProductForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-6">
          <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingProduct ? 'Edit Product' : 'Add Inventory Product'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  New products start with zero stock.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowProductForm(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close product form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveProduct} className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    SKU / Product code *
                  </label>
                  <input
                    className={inputClass}
                    required
                    maxLength={80}
                    value={productForm.sku}
                    onChange={(event) =>
                      setProductForm({ ...productForm, sku: event.target.value })
                    }
                    placeholder="e.g. INT-PNL-001"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Product name *
                  </label>
                  <input
                    className={inputClass}
                    required
                    maxLength={200}
                    value={productForm.product_name}
                    onChange={(event) =>
                      setProductForm({
                        ...productForm,
                        product_name: event.target.value,
                      })
                    }
                    placeholder="e.g. Polygranite Sheet"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Category
                  </label>
                  <select
                    className={inputClass}
                    value={productForm.category}
                    onChange={(event) =>
                      setProductForm({
                        ...productForm,
                        category: event.target.value as Category,
                      })
                    }
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Unit
                  </label>
                  <select
                    className={inputClass}
                    value={productForm.unit}
                    onChange={(event) =>
                      setProductForm({ ...productForm, unit: event.target.value })
                    }
                  >
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Minimum stock alert
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    className={inputClass}
                    value={productForm.minimum_stock}
                    onChange={(event) =>
                      setProductForm({
                        ...productForm,
                        minimum_stock: event.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Purchase price (₹ / unit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    value={productForm.purchase_price}
                    onChange={(event) =>
                      setProductForm({
                        ...productForm,
                        purchase_price: event.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Selling price (₹ / unit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    value={productForm.selling_price}
                    onChange={(event) =>
                      setProductForm({
                        ...productForm,
                        selling_price: event.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Supplier name
                  </label>
                  <input
                    className={inputClass}
                    maxLength={200}
                    value={productForm.supplier_name}
                    onChange={(event) =>
                      setProductForm({
                        ...productForm,
                        supplier_name: event.target.value,
                      })
                    }
                    placeholder="Supplier / vendor"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Supplier phone
                  </label>
                  <input
                    className={inputClass}
                    maxLength={30}
                    value={productForm.supplier_phone}
                    onChange={(event) =>
                      setProductForm({
                        ...productForm,
                        supplier_phone: event.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Storage location
                  </label>
                  <input
                    className={inputClass}
                    maxLength={200}
                    value={productForm.storage_location}
                    onChange={(event) =>
                      setProductForm({
                        ...productForm,
                        storage_location: event.target.value,
                      })
                    }
                    placeholder="Warehouse / rack"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  maxLength={3000}
                  className={inputClass}
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      description: event.target.value,
                    })
                  }
                />
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowProductForm(false)}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving
                    ? 'Saving...'
                    : editingProduct
                      ? 'Save Product'
                      : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock movement modal */}
      {showMovementForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-6">
          <div className="my-auto w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Record Stock Movement
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Every movement is recorded in the stock history.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowMovementForm(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close stock movement form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveMovement} className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Product *
                </label>
                <select
                  className={inputClass}
                  required
                  value={movementForm.item_id}
                  onChange={(event) => {
                    const selected = items.find(
                      (item) => item.id === Number(event.target.value),
                    );

                    setMovementForm({
                      ...movementForm,
                      item_id: event.target.value,
                      unit_cost: selected
                        ? String(selected.purchase_price)
                        : movementForm.unit_cost,
                    });
                  }}
                >
                  <option value="">Select product</option>
                  {items
                    .filter((item) => item.is_active)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.sku} — {item.product_name} (Available: {item.quantity} {item.unit})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Movement type *
                </label>
                <select
                  className={inputClass}
                  value={movementForm.movement_type}
                  onChange={(event) =>
                    setMovementForm({
                      ...movementForm,
                      movement_type: event.target.value as MovementType,
                    })
                  }
                >
                  <option value="RECEIVE">Receive stock — add quantity</option>
                  <option value="ISSUE">Issue stock — deduct quantity</option>
                  <option value="ADJUSTMENT">Adjust stock — set actual balance</option>
                </select>
                {movementForm.movement_type === 'ADJUSTMENT' && (
                  <p className="mt-1 text-xs text-amber-700">
                    For adjustment, enter the new total stock balance, not the difference.
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {movementForm.movement_type === 'ADJUSTMENT'
                      ? 'New total stock balance *'
                      : 'Quantity *'}
                  </label>
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    required
                    className={inputClass}
                    value={movementForm.quantity}
                    onChange={(event) =>
                      setMovementForm({
                        ...movementForm,
                        quantity: event.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Unit cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    value={movementForm.unit_cost}
                    onChange={(event) =>
                      setMovementForm({
                        ...movementForm,
                        unit_cost: event.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Reference
                </label>
                <input
                  className={inputClass}
                  maxLength={200}
                  value={movementForm.reference}
                  onChange={(event) =>
                    setMovementForm({
                      ...movementForm,
                      reference: event.target.value,
                    })
                  }
                  placeholder="Purchase invoice, project code, issue slip..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Notes
                </label>
                <textarea
                  rows={3}
                  maxLength={3000}
                  className={inputClass}
                  value={movementForm.notes}
                  onChange={(event) =>
                    setMovementForm({
                      ...movementForm,
                      notes: event.target.value,
                    })
                  }
                  placeholder="Reason for receipt, issue or adjustment..."
                />
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowMovementForm(false)}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Saving...' : 'Save Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
