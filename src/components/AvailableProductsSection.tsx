
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  ArrowRight,
  Package,
  Trash2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  unit: string;
  price: number;
  stock_quantity: number;
  website_cart_limit: number;
  image_urls: string[] | null;
};

type Customer = {
  name: string;
  phone: string;
  email: string;
  company: string;
  projectType: string;
  projectLocation: string;
  message: string;
};

const emptyCustomer: Customer = {
  name: '',
  phone: '',
  email: '',
  company: '',
  projectType: '',
  projectLocation: '',
  message: '',
};

const money = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);

export function AvailableProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customer, setCustomer] = useState<Customer>(emptyCustomer);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoading(true);
      setLoadError('');

      const { data, error } = await supabase
        .from('products')
        .select(
          'id,name,category,description,unit,price,stock_quantity,website_cart_limit,image_urls'
        )
        .eq('is_published', true)
        .order('name', { ascending: true });

      if (!active) return;

      if (error) {
        console.error('Homepage products failed to load:', error);
        setLoadError('Products could not be loaded. Please try again later.');
      } else {
        setProducts(
          (data ?? []).map((item: any) => ({
            id: String(item.id),
            name: item.name ?? '',
            category: item.category ?? 'Other',
            description: item.description ?? '',
            unit: item.unit ?? 'piece',
            price: Math.max(0, Number(item.price) || 0),
            stock_quantity: Math.max(
              0,
              Number(item.stock_quantity) || 0
            ),
            website_cart_limit: Math.max(
              0,
              Number(item.website_cart_limit) || 0
            ),
            image_urls: item.image_urls ?? [],
          }))
        );
      }

      setLoading(false);
    }

    void loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const featuredProducts = useMemo(
    () => products.slice(0, 8),
    [products]
  );

  const selectedProducts = products.filter(
    (product) => (cart[product.id] || 0) > 0
  );

  const cartCount = Object.values(cart).reduce(
    (total, quantity) => total + quantity,
    0
  );

  const cartTotal = selectedProducts.reduce(
    (total, product) => total + product.price * cart[product.id],
    0
  );

  function changeQuantity(product: Product, change: number) {
    const maxAllowed = Math.min(
      product.stock_quantity,
      product.website_cart_limit
    );

    setCart((current) => {
      const nextQuantity = (current[product.id] || 0) + change;
      const updated = { ...current };

      if (nextQuantity <= 0) {
        delete updated[product.id];
      } else if (nextQuantity <= maxAllowed) {
        updated[product.id] = nextQuantity;
      }

      return updated;
    });
  }

  function updateCustomer(field: keyof Customer, value: string) {
    setCustomer((current) => ({ ...current, [field]: value }));
  }

  function startCheckout() {
    setFormError('');

    if (selectedProducts.length === 0) {
      setFormError('Please add a product to your cart first.');
      return;
    }

    setCartOpen(false);
    setCheckoutOpen(true);
  }

  async function submitEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    const name = customer.name.trim();
    const phone = customer.phone.trim();

    if (!name || !phone) {
      setFormError('Name and phone number are required.');
      return;
    }

    if (selectedProducts.length === 0) {
      setFormError('Your cart is empty.');
      return;
    }

    // Recheck stock and cart limits before submitting.
    for (const selected of selectedProducts) {
      const { data, error } = await supabase
        .from('products')
        .select('name,stock_quantity,website_cart_limit,is_published')
        .eq('id', selected.id)
        .maybeSingle();

      if (error || !data || !data.is_published) {
        setFormError(
          `${selected.name} is no longer available. Please refresh the page.`
        );
        return;
      }

      const maxAllowed = Math.min(
        Math.max(0, Number(data.stock_quantity) || 0),
        Math.max(0, Number(data.website_cart_limit) || 0)
      );

      if (cart[selected.id] > maxAllowed) {
        setFormError(
          `The available quantity for ${data.name} has changed. Please review your cart.`
        );
        return;
      }
    }

    setSubmitting(true);
    setFormError('');

    const referenceCode = `SRL-${Date.now().toString().slice(-8)}`;

    const productDetails = selectedProducts
      .map((product, index) => {
        const quantity = cart[product.id];

        return [
          `${index + 1}. ${product.name}`,
          `Product ID: ${product.id}`,
          `Quantity: ${quantity} ${product.unit}(s)`,
          `Displayed unit price: ${money(product.price)}`,
          `Displayed line total: ${money(product.price * quantity)}`,
        ].join('\n');
      })
      .join('\n\n');

    const enquiryMessage = [
      'PUBLIC WEBSITE PRODUCT ENQUIRY',
      `Reference: ${referenceCode}`,
      `Company: ${customer.company.trim() || 'Not provided'}`,
      `Project location: ${customer.projectLocation.trim() || 'Not provided'}`,
      `Cart subtotal at displayed prices: ${money(cartTotal)}`,
      '',
      'SELECTED PRODUCTS:',
      productDetails,
      '',
      `Additional requirements: ${customer.message.trim() || 'Not provided'}`,
      '',
      'This is an enquiry, not a confirmed purchase. Final prices, taxes, stock and quotation must be confirmed by SRL Infra Developers.',
    ].join('\n');

    try {
      const { error } = await supabase.from('leads').insert({
        reference_code: referenceCode,
        name,
        phone,
        email: customer.email.trim() || null,
        company: customer.company.trim() || null,
        project_type: customer.projectType.trim() || null,
        message: enquiryMessage,
        source: 'WEBSITE',
        status: 'NEW',
      });

      if (error) throw error;

      setSuccess(
        `Your enquiry was submitted successfully. Reference: ${referenceCode}`
      );
      setCart({});
      setCustomer(emptyCustomer);
      setCheckoutOpen(false);
      setCartOpen(false);
    } catch (error) {
      console.error('Homepage product enquiry failed:', error);
      setFormError(
        error instanceof Error
          ? `Enquiry failed: ${error.message}`
          : 'Enquiry could not be submitted. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="available-products"
      className="bg-[#F8F7F4] py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#C47D2B]">
              SRL INFRA DEVELOPERS · PRODUCT COLLECTION
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
              Explore Our Products
            </h2>
            <p className="mt-3 leading-relaxed text-neutral-600">
              Discover interior materials and architectural products for
              your next project. Select products and send your enquiry
              directly to our team.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormError('');
              setCartOpen(true);
            }}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 font-semibold text-white transition hover:bg-[#C47D2B]"
          >
            <ShoppingCart size={19} />
            Cart ({cartCount})
          </button>
        </div>

        {success && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            {success}
            <button
              type="button"
              onClick={() => setSuccess('')}
              className="ml-3 font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {loadError && (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
            {loadError}
          </p>
        )}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-80 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        ) : !loadError && featuredProducts.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center">
            <Package className="mx-auto mb-3 text-neutral-400" size={36} />
            <h3 className="font-bold text-neutral-900">
              Products coming soon
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              Please contact our team for product information.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => {
              const image = product.image_urls?.[0];
              const maxAllowed = Math.min(
                product.stock_quantity,
                product.website_cart_limit
              );
              const quantity = cart[product.id] || 0;
              const unavailable = maxAllowed <= 0;

              return (
                <article
                  key={product.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex h-52 items-center justify-center overflow-hidden bg-white">
                    {image ? (
                      <img
                        src={image}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-contain p-3 transition duration-300 hover:scale-105"
                      />
                    ) : (
                      <Package size={42} className="text-neutral-300" />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#C47D2B]">
                      {product.category}
                    </p>

                    <h3 className="mt-2 text-lg font-bold text-neutral-900">
                      {product.name}
                    </h3>

                    <p className="mt-2 line-clamp-2 min-h-10 text-sm text-neutral-600">
                      {product.description || 'Contact us for product details.'}
                    </p>

                    <p className="mt-3 text-xs text-neutral-500">
                      {unavailable
                        ? 'Currently unavailable'
                        : `Available: ${product.stock_quantity} ${product.unit}(s)`}
                    </p>

                    <p className="mt-3 text-lg font-bold text-neutral-900">
                      {money(product.price)}
                      <span className="ml-1 text-xs font-normal text-neutral-500">
                        / {product.unit}
                      </span>
                    </p>

                    {quantity > 0 ? (
                      <div className="mt-4 flex items-center justify-between rounded-lg bg-[#FAF5ED] p-2">
                        <button
                          type="button"
                          aria-label={`Decrease ${product.name}`}
                          onClick={() => changeQuantity(product, -1)}
                          className="rounded-md border bg-white p-2"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="text-sm font-semibold">
                          {quantity} in cart
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${product.name}`}
                          disabled={quantity >= maxAllowed}
                          onClick={() => changeQuantity(product, 1)}
                          className="rounded-md border bg-white p-2 disabled:opacity-40"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={unavailable}
                        onClick={() => changeQuantity(product, 1)}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-3 py-3 text-sm font-semibold text-white transition hover:bg-[#C47D2B] disabled:cursor-not-allowed disabled:bg-neutral-300"
                      >
                        <Plus size={17} />
                        Add to Cart
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-900 px-6 py-3 font-semibold text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
          >
            View All Products <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {cartOpen && (
        <div
          className="fixed inset-0 z-[80] flex justify-end bg-black/50"
          onClick={() => setCartOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            className="h-full w-full max-w-md overflow-y-auto bg-white p-5 sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">Your Cart</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {cartCount} item(s) selected
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
                className="rounded-lg p-2 hover:bg-neutral-100"
              >
                <X />
              </button>
            </div>

            {selectedProducts.length === 0 ? (
              <p className="mt-8 rounded-xl bg-neutral-50 p-5 text-neutral-600">
                Your cart is empty. Add products to continue.
              </p>
            ) : (
              <>
                <div className="mt-6 space-y-4">
                  {selectedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex justify-between gap-3 border-b pb-4"
                    >
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="mt-1 text-sm text-neutral-500">
                          {money(product.price)} / {product.unit}
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <button
                            type="button"
                            aria-label={`Decrease ${product.name}`}
                            onClick={() => changeQuantity(product, -1)}
                            className="rounded border p-1.5"
                          >
                            <Minus size={16} />
                          </button>
                          <span>{cart[product.id]}</span>
                          <button
                            type="button"
                            aria-label={`Increase ${product.name}`}
                            disabled={
                              cart[product.id] >=
                              Math.min(
                                product.stock_quantity,
                                product.website_cart_limit
                              )
                            }
                            onClick={() => changeQuantity(product, 1)}
                            className="rounded border p-1.5 disabled:opacity-40"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${product.name}`}
                            onClick={() =>
                              setCart((current) => {
                                const updated = { ...current };
                                delete updated[product.id];
                                return updated;
                              })
                            }
                            className="text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <strong className="whitespace-nowrap">
                        {money(product.price * cart[product.id])}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-between text-lg font-bold">
                  <span>Indicative subtotal</span>
                  <span>{money(cartTotal)}</span>
                </div>

                <p className="mt-2 text-xs text-neutral-500">
                  This is an enquiry, not a confirmed purchase. Final pricing
                  and availability will be confirmed by our team.
                </p>

                <button
                  type="button"
                  onClick={startCheckout}
                  className="mt-6 w-full rounded-xl bg-[#C47D2B] px-5 py-3 font-semibold text-white hover:bg-[#A96720]"
                >
                  Checkout — Submit Enquiry
                </button>
              </>
            )}

            {formError && (
              <p role="alert" className="mt-4 text-sm text-red-600">
                {formError}
              </p>
            )}
          </section>
        </div>
      )}

      {checkoutOpen && (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/50 p-3 sm:p-5">
          <div className="mx-auto my-4 max-w-3xl rounded-2xl bg-white p-5 shadow-xl sm:my-8 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#C47D2B]">
                  SRL Infra Developers
                </p>
                <h3 className="mt-2 text-2xl font-bold">Product Enquiry</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Enter your details and our team will contact you.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close enquiry form"
                onClick={() => {
                  setCheckoutOpen(false);
                  setFormError('');
                }}
                className="rounded-lg p-2 hover:bg-neutral-100"
              >
                <X />
              </button>
            </div>

            <div className="mt-6 rounded-xl bg-neutral-50 p-4">
              <h4 className="font-semibold">Selected products</h4>
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="mt-3 flex justify-between gap-3 border-b border-neutral-200 pb-3 text-sm last:border-0"
                >
                  <span>
                    {product.name} × {cart[product.id]} {product.unit}(s)
                  </span>
                  <strong>
                    {money(product.price * cart[product.id])}
                  </strong>
                </div>
              ))}
              <div className="mt-3 flex justify-between font-bold">
                <span>Indicative subtotal</span>
                <span>{money(cartTotal)}</span>
              </div>
            </div>

            <form onSubmit={submitEnquiry} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  Full name *
                  <input
                    required
                    maxLength={120}
                    autoComplete="name"
                    value={customer.name}
                    onChange={(e) => updateCustomer('name', e.target.value)}
                    className="mt-1 w-full rounded-lg border p-3"
                    placeholder="Your name"
                  />
                </label>

                <label className="text-sm font-medium">
                  Phone number *
                  <input
                    required
                    type="tel"
                    maxLength={20}
                    autoComplete="tel"
                    value={customer.phone}
                    onChange={(e) => updateCustomer('phone', e.target.value)}
                    className="mt-1 w-full rounded-lg border p-3"
                    placeholder="Your phone number"
                  />
                </label>

                <label className="text-sm font-medium">
                  Email
                  <input
                    type="email"
                    maxLength={254}
                    autoComplete="email"
                    value={customer.email}
                    onChange={(e) => updateCustomer('email', e.target.value)}
                    className="mt-1 w-full rounded-lg border p-3"
                    placeholder="you@example.com"
                  />
                </label>

                <label className="text-sm font-medium">
                  Company
                  <input
                    maxLength={150}
                    value={customer.company}
                    onChange={(e) => updateCustomer('company', e.target.value)}
                    className="mt-1 w-full rounded-lg border p-3"
                    placeholder="Company name"
                  />
                </label>

                <label className="text-sm font-medium">
                  Project type
                  <select
                    value={customer.projectType}
                    onChange={(e) =>
                      updateCustomer('projectType', e.target.value)
                    }
                    className="mt-1 w-full rounded-lg border bg-white p-3"
                  >
                    <option value="">Select project type</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Office">Office</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Banquet Hall">Banquet Hall</option>
                    <option value="Interior Design">Interior Design</option>
                    <option value="Automation">Automation</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label className="text-sm font-medium">
                  Project location
                  <input
                    maxLength={250}
                    value={customer.projectLocation}
                    onChange={(e) =>
                      updateCustomer('projectLocation', e.target.value)
                    }
                    className="mt-1 w-full rounded-lg border p-3"
                    placeholder="City or address"
                  />
                </label>
              </div>

              <label className="block text-sm font-medium">
                Additional requirements
                <textarea
                  rows={3}
                  maxLength={3000}
                  value={customer.message}
                  onChange={(e) => updateCustomer('message', e.target.value)}
                  className="mt-1 w-full rounded-lg border p-3"
                  placeholder="Tell us about your project..."
                />
              </label>

              {formError && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setCheckoutOpen(false);
                    setCartOpen(true);
                    setFormError('');
                  }}
                  className="rounded-lg border px-5 py-3 font-semibold disabled:opacity-50"
                >
                  Back to cart
                </button>
                <button
                  type="submit"
                  disabled={submitting || selectedProducts.length === 0}
                  className="rounded-lg bg-neutral-900 px-6 py-3 font-semibold text-white hover:bg-[#C47D2B] disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Enquiry'}
                </button>
              </div>
              <p className="text-xs text-neutral-500">
                Submitting sends your details and selected products to SRL
                Infra Developers. This is an enquiry, not an online payment.
              </p>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
