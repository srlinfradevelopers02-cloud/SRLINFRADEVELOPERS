
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Package,
  RefreshCw,
  ArrowDownToLine,
  History,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

type Project = {
  id: number;
  project_code: string;
  project_name: string;
};

type InventoryItem = {
  id: number;
  sku: string;
  product_name: string;
  category: string;
  unit: string;
  quantity: number;
};

type Movement = {
  id: number;
  project_id: number | null;
  item_id: number;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reference: string | null;
  notes: string | null;
  created_at: string;
  movement_type: string;
  projects: {
    project_name: string;
    project_code: string;
  } | null;
  inventory_items: {
    product_name: string;
    sku: string;
    unit: string;
  } | null;
};

export default function ProjectMaterials() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);

  const [projectId, setProjectId] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState<'issue' | 'history'>('issue');

  const selectedItem = items.find(
    (item) => String(item.id) === itemId
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [projectResult, itemResult, movementResult] =
        await Promise.all([
          supabase
            .from('projects')
            .select('id, project_code, project_name')
            .order('project_name'),

          supabase
            .from('inventory_items')
            .select('id, sku, product_name, category, unit, quantity')
            .eq('is_active', true)
            .order('product_name'),

          supabase
            .from('stock_movements')
            .select(`
              id,
              project_id,
              item_id,
              quantity,
              quantity_before,
              quantity_after,
              reference,
              notes,
              created_at,
              movement_type,
              projects(project_name, project_code),
              inventory_items(product_name, sku, unit)
            `)
            .not('project_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(200),
        ]);

      if (projectResult.error) throw projectResult.error;
      if (itemResult.error) throw itemResult.error;
      if (movementResult.error) throw movementResult.error;

      setProjects((projectResult.data ?? []) as Project[]);
      setItems((itemResult.data ?? []) as InventoryItem[]);
      setMovements((movementResult.data ?? []) as unknown as Movement[]);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to load project materials.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const issueMaterial = async () => {
    setError('');
    setSuccess('');

    const amount = Number(quantity);

    if (!projectId || !itemId) {
      setError('Please select a project and a material.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid issue quantity greater than zero.');
      return;
    }

    if (selectedItem && amount > Number(selectedItem.quantity)) {
      setError(
        `Insufficient stock. Available: ${selectedItem.quantity} ${selectedItem.unit}.`
      );
      return;
    }

    const confirmed = window.confirm(
      `Issue ${amount} ${selectedItem?.unit ?? 'units'} of ` +
      `${selectedItem?.product_name ?? 'this material'} to the selected project?`
    );

    if (!confirmed) return;

    setIssuing(true);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'issue_project_material',
        {
          p_project_id: Number(projectId),
          p_item_id: Number(itemId),
          p_quantity: amount,
          p_reference: reference.trim() || null,
          p_notes: notes.trim() || null,
        }
      );

      if (rpcError) throw rpcError;

      if (!data?.success) {
        throw new Error('The stock issue was not confirmed.');
      }

      setSuccess(
        `Material issued successfully. Remaining stock: ` +
        `${data.quantity_after} ${selectedItem?.unit ?? ''}.`
      );

      setQuantity('');
      setReference('');
      setNotes('');

      await loadData();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to issue material.'
      );
    } finally {
      setIssuing(false);
    }
  };

  const projectName = (id: number | null) => {
    return projects.find((project) => project.id === id)?.project_name
      ?? 'Project';
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Project Materials
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Issue inventory materials and track project-wise stock usage.
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
            <p className="text-sm text-slate-500">Projects</p>
            <p className="mt-2 text-2xl font-bold">{projects.length}</p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-slate-500">Active Materials</p>
            <p className="mt-2 text-2xl font-bold">{items.length}</p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-slate-500">Recorded Project Issues</p>
            <p className="mt-2 text-2xl font-bold">{movements.length}</p>
          </div>
        </div>

        <div className="flex gap-2 border-b">
          <button
            onClick={() => setTab('issue')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${
              tab === 'issue'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500'
            }`}
          >
            <ArrowDownToLine size={17} />
            Issue Material
          </button>

          <button
            onClick={() => setTab('history')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${
              tab === 'history'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500'
            }`}
          >
            <History size={17} />
            Issue History
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span className="whitespace-pre-wrap">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            {success}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border bg-white p-10 text-center text-slate-500">
            Loading project materials...
          </div>
        ) : tab === 'issue' ? (
          <section className="max-w-3xl rounded-xl border bg-white p-5 md:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-3 text-blue-700">
                <Package size={24} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">
                  Issue Material to Project
                </h2>
                <p className="text-sm text-slate-500">
                  Stock updates automatically after a successful issue.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Select Project *
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                >
                  <option value="">Choose a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.project_code} — {project.project_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Select Material *
                </label>
                <select
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                >
                  <option value="">Choose a material</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sku} — {item.product_name} ({item.category})
                    </option>
                  ))}
                </select>
              </div>

              {selectedItem && (
                <div className="rounded-lg border bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Available stock</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {selectedItem.quantity} {selectedItem.unit}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    SKU: {selectedItem.sku}
                  </p>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Issue Quantity *
                </label>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  max={selectedItem?.quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity to issue"
                  className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                />
                {selectedItem && (
                  <p className="mt-1 text-xs text-slate-500">
                    Unit: {selectedItem.unit}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Reference Number
                </label>
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. MI-2026-001 or delivery challan"
                  className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Purpose, site location or additional details"
                  className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={() => void issueMaterial()}
                disabled={issuing || !projects.length || !items.length}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowDownToLine size={18} />
                {issuing ? 'Processing Issue...' : 'Issue Material & Deduct Stock'}
              </button>

              <p className="text-xs leading-5 text-slate-500">
                Only authenticated Admin and Manager accounts authorized by
                the database function can issue materials. The database
                validates available stock before deducting it.
              </p>
            </div>
          </section>
        ) : (
          <section className="overflow-hidden rounded-xl border bg-white">
            <div className="border-b p-5">
              <h2 className="font-semibold">Project Material Issue History</h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest 200 project-linked stock movements.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Project</th>
                    <th className="px-5 py-4">Material</th>
                    <th className="px-5 py-4">Issued</th>
                    <th className="px-5 py-4">Before</th>
                    <th className="px-5 py-4">Remaining</th>
                    <th className="px-5 py-4">Reference / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {movements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4">
                        {new Date(movement.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium">
                          {movement.projects?.project_name ??
                            projectName(movement.project_id)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {movement.projects?.project_code ?? ''}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium">
                          {movement.inventory_items?.product_name ??
                            `Item #${movement.item_id}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {movement.inventory_items?.sku ?? ''}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-red-700">
                        -{movement.quantity}{' '}
                        {movement.inventory_items?.unit ?? ''}
                      </td>
                      <td className="px-5 py-4">
                        {movement.quantity_before}
                      </td>
                      <td className="px-5 py-4 font-semibold text-green-700">
                        {movement.quantity_after}
                      </td>
                      <td className="max-w-[220px] px-5 py-4">
                        <p>{movement.reference || '—'}</p>
                        <p className="mt-1 break-words text-xs text-slate-500">
                          {movement.notes || ''}
                        </p>
                      </td>
                    </tr>
                  ))}

                  {movements.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        No project material issues recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
