
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  unit: string;
  stock_quantity: number;
  website_cart_limit: number;
  image_urls: string[];
  is_published: boolean;
};

const BUCKET = 'product-images';
const MAX_IMAGES = 6;
const MAX_SIZE = 5 * 1024 * 1024;

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900';

export default function ProductCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [limitInputs, setLimitInputs] = useState<Record<string, string>>({});
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [unitInputs, setUnitInputs] = useState<Record<string, string>>({});
  const [stockInputs, setStockInputs] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    setError('');

    const { data, error: queryError } = await supabase
      .from('products')
      .select(
        'id,name,description,category,price,unit,stock_quantity,website_cart_limit,image_urls,is_published'
      )
      .order('name');

    if (queryError) {
      setError(queryError.message);
      return;
    }

    const rows = (data ?? []) as Product[];
    setProducts(rows);

    setLimitInputs(
      Object.fromEntries(
        rows.map((p) => [p.id, String(p.website_cart_limit ?? 0)])
      )
    );
    setPriceInputs(
      Object.fromEntries(rows.map((p) => [p.id, String(p.price ?? 0)]))
    );
    setUnitInputs(
      Object.fromEntries(rows.map((p) => [p.id, p.unit ?? 'piece']))
    );
    setStockInputs(
      Object.fromEntries(
        rows.map((p) => [p.id, String(p.stock_quantity ?? 0)])
      )
    );
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  async function savePricingAndStock(product: Product) {
    setError('');
    setMessage('');

    const price = Number(priceInputs[product.id]);
    const stock = Number(stockInputs[product.id]);
    const unit = (unitInputs[product.id] ?? '').trim();

    if (!Number.isFinite(price) || price < 0) {
      setError('Price must be a valid number greater than or equal to 0.');
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setError('Stock must be a whole number greater than or equal to 0.');
      return;
    }

    if (!unit) {
      setError('Enter a unit such as piece, set, or sq.ft.');
      return;
    }

    const enteredLimit = Number(limitInputs[product.id] ?? 0);

    if (!Number.isInteger(enteredLimit) || enteredLimit < 0) {
      setError('Cart limit must be a whole number greater than or equal to 0.');
      return;
    }

    const safeLimit = Math.min(enteredLimit, stock);

    setBusy(product.id);

    try {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          price,
          unit,
          stock_quantity: stock,
          website_cart_limit: safeLimit,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      setMessage(
        `Saved ${product.name}. Price: ₹${price.toLocaleString('en-IN')} per ${unit}; stock: ${stock}; cart limit: ${safeLimit}.`
      );

      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save product details.'
      );
    } finally {
      setBusy(null);
    }
  }

  async function saveCartLimit(product: Product) {
    setError('');
    setMessage('');

    const limit = Number(limitInputs[product.id]);

    if (!Number.isInteger(limit) || limit < 0) {
      setError('Cart limit must be a whole number greater than or equal to 0.');
      return;
    }

    if (limit > Number(product.stock_quantity)) {
      setError(
        `Cart limit cannot exceed stock (${product.stock_quantity} ${product.unit}). Save stock changes first.`
      );
      return;
    }

    setBusy(product.id);

    try {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          website_cart_limit: limit,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      setMessage(`Cart limit saved for ${product.name}: ${limit}.`);
      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save cart limit.'
      );
    } finally {
      setBusy(null);
    }
  }

  async function uploadImages(product: Product, files: FileList | null) {
    if (!files?.length) return;

    setError('');
    setMessage('');

    const selected = Array.from(files);
    const remaining = MAX_IMAGES - (product.image_urls ?? []).length;

    if (remaining <= 0 || selected.length > remaining) {
      setError(`Maximum ${MAX_IMAGES} images per product.`);
      return;
    }

    for (const file of selected) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Use JPG, PNG, or WebP images only.');
        return;
      }

      if (file.size > MAX_SIZE) {
        setError('Each image must be 5 MB or smaller.');
        return;
      }
    }

    setBusy(product.id);
    const uploadedPaths: string[] = [];

    try {
      const newUrls: string[] = [];

      for (const file of selected) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${product.id}/${crypto.randomUUID()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        uploadedPaths.push(path);

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        newUrls.push(data.publicUrl);
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({
          image_urls: [...(product.image_urls ?? []), ...newUrls],
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      setMessage(`Photos saved for ${product.name}.`);
      await loadProducts();
    } catch (err) {
      if (uploadedPaths.length) {
        await supabase.storage.from(BUCKET).remove(uploadedPaths);
      }

      setError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setBusy(null);
    }
  }

  async function removeImage(product: Product, url: string) {
    if (!window.confirm(`Remove this photo from ${product.name}?`)) return;

    setError('');
    setMessage('');
    setBusy(product.id);

    try {
      const updatedUrls = (product.image_urls ?? []).filter(
        (imageUrl) => imageUrl !== url
      );

      const { error: updateError } = await supabase
        .from('products')
        .update({
          image_urls: updatedUrls,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      const marker = `/storage/v1/object/public/${BUCKET}/`;
      const index = url.indexOf(marker);

      if (index >= 0) {
        const path = decodeURIComponent(url.slice(index + marker.length));

        const { error: removeError } = await supabase.storage
          .from(BUCKET)
          .remove([path]);

        if (removeError) {
          setMessage('Photo unlinked; storage cleanup needs attention.');
        }
      }

      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove photo.');
    } finally {
      setBusy(null);
    }
  }

  async function togglePublished(product: Product) {
    setError('');
    setMessage('');
    setBusy(product.id);

    try {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          is_published: !product.is_published,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      setMessage(
        `${product.name} ${product.is_published ? 'unpublished' : 'published'}.`
      );

      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not update product.'
      );
    } finally {
      setBusy(null);
    }
  }

  const filtered = products.filter((product) =>
    `${product.name} ${product.category}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Product Photos, Pricing & Catalogue
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage website prices, units, stock, cart limits, photos, and product publishing.
          Confirm supplier pricing before publishing final prices.
        </p>
      </div>

      <input
        className={inputClass}
        placeholder="Search product or category..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {message}
        </p>
      )}

      <p className="text-sm text-slate-500">
        Showing {filtered.length} of {products.length} products
      </p>

      {filtered.length === 0 && !error && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No products found. Make sure product records exist in the Supabase products table.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((product) => (
          <article
            key={product.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">{product.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{product.category}</p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs ${
                  product.is_published
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {product.is_published ? 'Published' : 'Hidden'}
              </span>
            </div>

            <div className="mt-4 space-y-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <h4 className="text-sm font-semibold text-slate-800">
                Website Price & Stock
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-medium text-slate-700">
                  Price (₹)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`${inputClass} mt-1`}
                    value={priceInputs[product.id] ?? String(product.price ?? 0)}
                    onChange={(event) =>
                      setPriceInputs((current) => ({
                        ...current,
                        [product.id]: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700">
                  Unit
                  <input
                    type="text"
                    maxLength={30}
                    placeholder="piece, set, sq.ft."
                    className={`${inputClass} mt-1`}
                    value={unitInputs[product.id] ?? product.unit}
                    onChange={(event) =>
                      setUnitInputs((current) => ({
                        ...current,
                        [product.id]: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="col-span-2 block text-xs font-medium text-slate-700">
                  Stock Quantity
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className={`${inputClass} mt-1`}
                    value={stockInputs[product.id] ?? String(product.stock_quantity ?? 0)}
                    onChange={(event) =>
                      setStockInputs((current) => ({
                        ...current,
                        [product.id]: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <button
                type="button"
                disabled={busy === product.id}
                onClick={() => void savePricingAndStock(product)}
                className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy === product.id ? 'Saving…' : 'Save Price & Stock'}
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={`cart-limit-${product.id}`}
                  className="text-sm font-semibold text-slate-800"
                >
                  Website Cart Limit
                </label>
                <span className="text-xs text-slate-500">
                  Stock: {product.stock_quantity} {product.unit}
                </span>
              </div>

              <p className="text-xs text-slate-600">
                The cart limit cannot exceed the available stock.
              </p>

              <div className="flex gap-2">
                <input
                  id={`cart-limit-${product.id}`}
                  type="number"
                  min="0"
                  max={Number(stockInputs[product.id] ?? product.stock_quantity)}
                  step="1"
                  className={`${inputClass} min-w-0`}
                  value={limitInputs[product.id] ?? '0'}
                  onChange={(event) =>
                    setLimitInputs((current) => ({
                      ...current,
                      [product.id]: event.target.value,
                    }))
                  }
                />
                <button
                  type="button"
                  disabled={busy === product.id}
                  onClick={() => void saveCartLimit(product)}
                  className="shrink-0 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy === product.id ? 'Saving…' : 'Save Limit'}
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Current website limit: {product.website_cart_limit}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {(product.image_urls ?? []).map((url, index) => (
                <div key={url} className="relative">
                  <img
                    src={url}
                    alt={`${product.name} ${index + 1}`}
                    className="h-24 w-full rounded-lg border object-cover"
                  />
                  <button
                    type="button"
                    disabled={busy === product.id}
                    onClick={() => void removeImage(product, url)}
                    className="absolute right-1 top-1 rounded bg-white/95 px-2 py-1 text-xs text-red-600 shadow disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs text-slate-500">
              {product.image_urls?.length ?? 0} / {MAX_IMAGES} photos
            </p>

            <label className="mt-3 block cursor-pointer rounded-lg border border-dashed border-slate-300 p-3 text-center text-sm font-medium text-blue-700 hover:bg-blue-50">
              {busy === product.id ? 'Please wait...' : 'Choose photos'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={
                  busy === product.id ||
                  (product.image_urls?.length ?? 0) >= MAX_IMAGES
                }
                className="sr-only"
                onChange={(event) => {
                  void uploadImages(product, event.target.files);
                  event.currentTarget.value = '';
                }}
              />
            </label>

            <button
              type="button"
              disabled={busy === product.id}
              onClick={() => void togglePublished(product)}
              className="mt-3 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {product.is_published ? 'Unpublish product' : 'Publish product'}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
