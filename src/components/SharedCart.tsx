import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export type SharedCartItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  stock_quantity: number;
  website_cart_limit?: number;
  quantity: number;
};

type CartContextValue = {
  items: SharedCartItem[];
  count: number;
  subtotal: number;
  addItem: (item: Omit<SharedCartItem, 'quantity'>) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  openCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const money = (n: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 2,
}).format(n);

export function SharedCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<SharedCartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', company: '', projectType: '', projectLocation: '', message: '' });

  const addItem = useCallback((item: Omit<SharedCartItem, 'quantity'>) => {
    setError(''); setSuccess('');
    const limit = Math.min(Number(item.stock_quantity) || 0, Number(item.website_cart_limit ?? item.stock_quantity) || 0);
    if (!item.id || limit < 1) {
      setError(`${item.name}: stock or website cart limit is unavailable. Please enquire.`);
      setIsOpen(true); return;
    }
    setItems(current => {
      const existing = current.find(x => x.id === item.id);
      const nextQty = (existing?.quantity || 0) + 1;
      if (nextQty > limit) {
        setError(`Maximum available quantity for ${item.name} is ${limit}.`);
        return current;
      }
      if (existing) return current.map(x => x.id === item.id ? { ...x, ...item, quantity: nextQty } : x);
      return [...current, { ...item, quantity: 1 }];
    });
    setIsOpen(true);
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    setError('');
    setItems(current => {
      const item = current.find(x => x.id === id);
      if (!item) return current;
      if (quantity <= 0) return current.filter(x => x.id !== id);
      const limit = Math.min(Number(item.stock_quantity) || 0, Number(item.website_cart_limit ?? item.stock_quantity) || 0);
      if (quantity > limit) {
        setError(`Maximum available quantity for ${item.name} is ${limit}.`);
        return current;
      }
      return current.map(x => x.id === id ? { ...x, quantity } : x);
    });
  }, []);

  const removeItem = useCallback((id: string) => setItems(current => current.filter(x => x.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const count = items.reduce((sum, x) => sum + x.quantity, 0);
  const subtotal = items.reduce((sum, x) => sum + x.quantity * x.price, 0);
  const value = useMemo(() => ({ items, count, subtotal, addItem, setQuantity, removeItem, clear, openCart: () => setIsOpen(true) }),
    [items, count, subtotal, addItem, setQuantity, removeItem, clear]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(''); setSuccess('');
    if (!customer.name.trim() || !customer.phone.trim()) {
      setError('Name and phone number are required.'); return;
    }
    if (!items.length) { setError('Add at least one product to the cart.'); return; }
    if (busy) return;
    setBusy(true);
    const reference = `SRL-${Date.now().toString().slice(-8)}`;
    try {
      // Revalidate every product against current published stock and price before creating the lead.
      const ids = items.map(x => x.id);
      const { data, error: productError } = await supabase.from('products')
        .select('id,name,category,price,unit,stock_quantity,website_cart_limit,is_published')
        .in('id', ids).eq('is_published', true);
      if (productError) throw productError;
      for (const item of items) {
        const latest = (data || []).find((p: any) => String(p.id) === item.id) as any;
        if (!latest) throw new Error(`${item.name} is no longer published. Remove it and try again.`);
        const limit = Math.min(Number(latest.stock_quantity) || 0, Number(latest.website_cart_limit ?? latest.stock_quantity) || 0);
        if (item.quantity > limit) throw new Error(`${item.name} availability changed. Maximum available quantity is ${limit}.`);
      }
      const verified = items.map(item => {
        const p = (data || []).find((row: any) => String(row.id) === item.id) as any;
        const price = Math.max(0, Number(p.price) || 0);
        return { ...item, name: String(p.name || item.name), category: String(p.category || item.category), price, unit: String(p.unit || item.unit) };
      });
      const verifiedSubtotal = verified.reduce((sum, x) => sum + x.price * x.quantity, 0);
      const lines = verified.map((x, i) =>
        `${i + 1}. ${x.name}\nCategory: ${x.category}\nProduct ID: ${x.id}\nQuantity: ${x.quantity} ${x.unit}(s)\nUnit price: ${money(x.price)}\nLine total: ${money(x.price * x.quantity)}`
      ).join('\n\n');
      const message = [
        'COMMON WEBSITE CART ENQUIRY — INTERIOR / AUTOMATION / ELEVATORS',
        `Reference: ${reference}`,
        `Company: ${customer.company.trim() || 'Not provided'}`,
        `Project location: ${customer.projectLocation.trim() || 'Not provided'}`,
        `Cart subtotal at verified displayed prices: ${money(verifiedSubtotal)}`,
        '', 'SELECTED PRODUCTS:', lines, '',
        `Project type: ${customer.projectType.trim() || 'Mixed product enquiry'}`,
        `Additional requirements: ${customer.message.trim() || 'Not provided'}`,
        'This is an enquiry, not a confirmed purchase. Final price, taxes and stock must be confirmed by SRL Infra Developers.'
      ].join('\n');
      const { error: leadError } = await supabase.from('leads').insert({
        reference_code: reference,
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email.trim() || null,
        company: customer.company.trim() || null,
        project_type: customer.projectType.trim() || 'Mixed Product Enquiry',
        message,
        source: 'WEBSITE',
        status: 'NEW',
      });
      if (leadError) throw leadError;
      setItems([]); setCustomer({ name: '', phone: '', email: '', company: '', projectType: '', projectLocation: '', message: '' });
      setSuccess(`Enquiry submitted successfully. Reference: ${reference}`);
    } catch (e: any) {
      setError(e?.message || 'Could not submit enquiry. Please try again.');
    } finally { setBusy(false); }
  }

  return <CartContext.Provider value={value}>
    {children}
    <button type="button" onClick={() => setIsOpen(true)} aria-label="Open common cart"
      className="fixed bottom-5 right-5 z-[120] flex items-center gap-2 rounded-full bg-[#C5832B] px-5 py-3 font-bold text-white shadow-xl hover:bg-[#A66B1E]">
      <ShoppingCart className="h-5 w-5" /> Cart <span className="rounded-full bg-white px-2 py-0.5 text-xs text-neutral-900">{count}</span>
    </button>
    {isOpen && <div className="fixed inset-0 z-[150] flex justify-end bg-black/50" onClick={() => setIsOpen(false)}>
      <section role="dialog" aria-modal="true" aria-label="Common product cart" onClick={e => e.stopPropagation()}
        className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl">
        <header className="sticky top-0 flex items-center justify-between border-b bg-white p-5">
          <div><h2 className="text-xl font-bold">Your Common Cart</h2><p className="text-sm text-neutral-500">Interior · Automation · Elevators</p></div>
          <button type="button" onClick={() => setIsOpen(false)} aria-label="Close cart"><X /></button>
        </header>
        <div className="space-y-3 p-5">
          {items.length === 0 ? <p className="rounded-xl bg-neutral-50 p-6 text-center text-neutral-500">Your cart is empty. Add products from any section.</p> :
            items.map(item => <div key={item.id} className="flex items-center gap-3 rounded-xl border p-3">
              <div className="min-w-0 flex-1"><p className="font-semibold">{item.name}</p><p className="text-xs text-neutral-500">{item.category} · {money(item.price)} / {item.unit}</p><p className="mt-1 font-bold">{money(item.price * item.quantity)}</p></div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setQuantity(item.id, item.quantity - 1)} className="rounded border p-2" aria-label={`Decrease ${item.name}`}><Minus size={15}/></button>
                <span className="min-w-5 text-center">{item.quantity}</span>
                <button type="button" onClick={() => setQuantity(item.id, item.quantity + 1)} className="rounded border p-2" aria-label={`Increase ${item.name}`}><Plus size={15}/></button>
                <button type="button" onClick={() => removeItem(item.id)} className="rounded border p-2 text-red-600" aria-label={`Remove ${item.name}`}><Trash2 size={15}/></button>
              </div>
            </div>)}
          <div className="flex justify-between border-t pt-4 text-lg font-bold"><span>Estimated subtotal</span><span>{money(subtotal)}</span></div>
          <p className="text-xs text-neutral-500">Final price, taxes and stock are confirmed by SRL Infra Developers after reviewing your enquiry.</p>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {success && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</p>}
        </div>
        <form onSubmit={submit} className="space-y-3 border-t p-5">
          <h3 className="font-bold">One enquiry for all selected products</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input required placeholder="Full name *" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} className="rounded-lg border p-3"/>
            <input required placeholder="Phone number *" value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} className="rounded-lg border p-3"/>
            <input type="email" placeholder="Email" value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} className="rounded-lg border p-3"/>
            <input placeholder="Company" value={customer.company} onChange={e => setCustomer({ ...customer, company: e.target.value })} className="rounded-lg border p-3"/>
            <input placeholder="Project type (optional)" value={customer.projectType} onChange={e => setCustomer({ ...customer, projectType: e.target.value })} className="rounded-lg border p-3"/>
            <input placeholder="Project location" value={customer.projectLocation} onChange={e => setCustomer({ ...customer, projectLocation: e.target.value })} className="rounded-lg border p-3"/>
          </div>
          <textarea placeholder="Additional requirements" rows={3} value={customer.message} onChange={e => setCustomer({ ...customer, message: e.target.value })} className="w-full rounded-lg border p-3"/>
          <button disabled={busy || items.length === 0} className="w-full rounded-xl bg-[#C5832B] p-4 font-bold text-white disabled:opacity-50">{busy ? 'Submitting…' : 'Submit one enquiry'}</button>
        </form>
      </section>
    </div>}
  </CartContext.Provider>;
}

export function useSharedCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useSharedCart must be used inside SharedCartProvider');
  return context;
}
