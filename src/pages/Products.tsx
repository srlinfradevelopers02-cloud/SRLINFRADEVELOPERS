
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Search, ShoppingCart, Plus, Minus, X, Trash2 } from 'lucide-react';
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

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState<Record<string, number>>({});

  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const [customer, setCustomer] = useState<Customer>(emptyCustomer);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load published products and cart limits from Supabase.
  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError('');

      const { data, error: queryError } = await supabase
        .from('products')
        .select(
          'id, name, description, category, price, unit, stock_quantity, website_cart_limit, image_urls'
        )
        .eq('is_published', true)
        .order('name', { ascending: true });

      if (!active) return;

      if (queryError) {
        console.error('Failed to load products:', queryError);
        setError(
          'Products could not be loaded. Please refresh the page and try again.'
        );
        setProducts([]);
      } else {
        setProducts(
          (data ?? []).map((item: any) => ({
            id: String(item.id),
            name: item.name ?? '',
            description: item.description ?? '',
            category: item.category ?? 'Other',
            price: Number(item.price) || 0,
            unit: item.unit ?? 'piece',
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

  const categories = useMemo(
    () => [
      'All',
      ...new Set(products.map((product) => product.category)),
    ],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query);

      return (
        matchesSearch &&
        (category === 'All' || product.category === category)
      );
    });
  }, [products, search, category]);

  const selectedProducts = products.filter(
    (product) => (cart[product.id] || 0) > 0
  );

  const cartCount = Object.values(cart).reduce(
    (total, quantity) => total + quantity,
    0
  );

  const cartTotal = selectedProducts.reduce(
    (total, product) =>
      total + product.price * cart[product.id],
    0
  );

  // The cart is limited by BOTH available website stock and admin limit.
  function updateQuantity(id: string, change: number) {
    const product = products.find((item) => item.id === id);
    if (!product) return;

    const maxAllowed = Math.min(
      product.stock_quantity,
      product.website_cart_limit
    );

    setCart((current) => {
      const next = (current[id] || 0) + change;
      const updated = { ...current };

      if (next <= 0) {
        delete updated[id];
      } else if (next <= maxAllowed) {
        updated[id] = next;
      } else {
        return current;
      }

      return updated;
    });
  }

  function updateCustomer(field: keyof Customer, value: string) {
    setCustomer((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCheckout() {
    if (selectedProducts.length === 0) {
      setSubmitError('Please add products to your cart first.');
      return;
    }

    setSubmitError('');
    setShowCart(false);
    setShowCheckout(true);
  }

  // Save customer details and cart information as a CRM lead.
  async function submitEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    const name = customer.name.trim();
    const phone = customer.phone.trim();

    if (!name || !phone) {
      setSubmitError('Name and phone number are required.');
      return;
    }

    if (selectedProducts.length === 0) {
      setSubmitError('Your cart is empty. Please select a product.');
      return;
    }

    // Validate cart quantities again before submitting the enquiry.
    const invalidProduct = selectedProducts.find((product) => {
      const maxAllowed = Math.min(
        product.stock_quantity,
        product.website_cart_limit
      );

      return (
        cart[product.id] <= 0 ||
        cart[product.id] > maxAllowed
      );
    });

    if (invalidProduct) {
      setSubmitError(
        `The quantity for ${invalidProduct.name} exceeds its current cart limit. Please review your cart.`
      );
      setShowCheckout(false);
      setShowCart(true);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const referenceCode = `SRL-${Date.now().toString().slice(-8)}`;

    const productDetails = selectedProducts
      .map((product, index) => {
        const quantity = cart[product.id];

        return [
          `${index + 1}. ${product.name}`,
          `Product ID: ${product.id}`,
          `Quantity: ${quantity} ${product.unit}(s)`,
          `Admin website cart limit: ${product.website_cart_limit}`,
          `Available website stock: ${product.stock_quantity}`,
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
      'IMPORTANT: This is an enquiry, not a confirmed purchase. Prices, taxes, stock and final quotation must be confirmed by SRL Infra Developers.',
    ].join('\n');

    try {
      const { error: insertError } = await supabase
        .from('leads')
        .insert({
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

      if (insertError) throw insertError;

      setSuccessMessage(
        `Your enquiry has been submitted successfully. Reference: ${referenceCode}`
      );

      setCart({});
      setCustomer(emptyCustomer);
      setShowCheckout(false);
      setShowCart(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to submit website enquiry:', err);

      const message =
        err instanceof Error ? err.message : 'Unknown error';

      setSubmitError(
        `We could not submit your enquiry. ${message}`
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
              SRL Infra Developers
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
              Interior Products
            </h1>
            <p className="mt-2 text-slate-600">
              Discover materials for your next project.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSubmitError('');
              setShowCart(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
          >
            <ShoppingCart size={20} />
            Cart ({cartCount})
          </button>
        </header>

        {/* SUCCESS MESSAGE */}
        {successMessage && (
          <div
            role="status"
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            <p>{successMessage}</p>
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* SEARCH AND CATEGORY */}
        <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="flex items-center gap-3 rounded-xl border bg-white px-4">
            <Search size={20} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products, materials..."
              className="w-full py-3 outline-none"
              aria-label="Search products"
            />
          </div>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-xl border bg-white px-4 py-3"
            aria-label="Filter by category"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {/* LOAD ERROR */}
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="ml-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        <p className="mb-4 text-sm text-slate-500">
          {loading
            ? 'Loading products...'
            : `${filteredProducts.length} products`}
        </p>

        {/* PRODUCT GRID */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-80 animate-pulse rounded-2xl border bg-white"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => {
              const image = product.image_urls?.[0];
              const maxAllowed = Math.min(
                product.stock_quantity,
                product.website_cart_limit
              );
              const quantityInCart = cart[product.id] || 0;
              const unavailable = maxAllowed <= 0;

              return (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="flex h-56 items-center justify-center overflow-hidden bg-slate-100">
                    {image ? (
                      <img
                        src={image}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                      />
                    ) : (
                      <span className="text-5xl text-slate-400">
                        ▧
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      {product.category}
                    </p>

                    <h2 className="mt-2 text-lg font-bold text-slate-900">
                      {product.name}
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                      {product.description ||
                        'Contact us for product details.'}
                    </p>

                    <p className="mt-3 text-sm text-slate-500">
                      {unavailable
                        ? product.stock_quantity <= 0
                          ? 'Currently unavailable'
                          : 'Not available for cart requests'
                        : `Available: ${product.stock_quantity} ${product.unit}(s)`}
                    </p>

                    {!unavailable && (
                      <p className="mt-1 text-xs text-slate-500">
                        Maximum cart quantity: {maxAllowed} {product.unit}(s)
                      </p>
                    )}

                    <div className="mt-5 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xl font-bold text-slate-900">
                          {money(product.price)}
                        </p>
                        <p className="text-xs text-slate-500">
                          per {product.unit}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={
                          unavailable ||
                          quantityInCart >= maxAllowed
                        }
                        onClick={() => updateQuantity(product.id, 1)}
                        className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {quantityInCart ? 'Add More' : 'Add to Cart'}
                      </button>
                    </div>

                    {quantityInCart > 0 && (
                      <div className="mt-4 flex items-center justify-between rounded-lg bg-blue-50 p-3">
                        <span className="text-sm text-blue-900">
                          In cart: {quantityInCart} {product.unit}(s)
                        </span>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            aria-label={`Decrease ${product.name} quantity`}
                            onClick={() =>
                              updateQuantity(product.id, -1)
                            }
                          >
                            <Minus size={18} />
                          </button>

                          <span>{quantityInCart}</span>

                          <button
                            type="button"
                            aria-label={`Increase ${product.name} quantity`}
                            disabled={quantityInCart >= maxAllowed}
                            onClick={() =>
                              updateQuantity(product.id, 1)
                            }
                            className="disabled:opacity-40"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !error && filteredProducts.length === 0 && (
          <p className="rounded-xl bg-white p-10 text-center text-slate-500">
            No published products found. Try another search or category.
          </p>
        )}

        {/* CART DRAWER */}
        {showCart && (
          <div
            className="fixed inset-0 z-50 flex justify-end bg-black/40"
            onClick={() => setShowCart(false)}
          >
            <section
              className="h-full w-full max-w-md overflow-y-auto bg-white p-6"
              onClick={(event) => event.stopPropagation()}
              aria-label="Shopping cart"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Your Cart</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {cartCount} item(s) selected
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCart(false)}
                  aria-label="Close cart"
                  className="rounded-lg p-2 hover:bg-slate-100"
                >
                  <X />
                </button>
              </div>

              {selectedProducts.length === 0 ? (
                <p className="mt-8 rounded-xl bg-slate-50 p-5 text-slate-500">
                  Your cart is empty. Add products to continue.
                </p>
              ) : (
                <>
                  <div className="mt-6 space-y-4">
                    {selectedProducts.map((product) => {
                      const maxAllowed = Math.min(
                        product.stock_quantity,
                        product.website_cart_limit
                      );

                      return (
                        <div
                          key={product.id}
                          className="flex justify-between gap-3 border-b pb-4"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold">
                              {product.name}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {money(product.price)} / {product.unit}
                            </p>

                            <div className="mt-3 flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(product.id, -1)
                                }
                                aria-label={`Decrease ${product.name} quantity`}
                                className="rounded-md border p-1.5"
                              >
                                <Minus size={16} />
                              </button>

                              <span>{cart[product.id]}</span>

                              <button
                                type="button"
                                disabled={cart[product.id] >= maxAllowed}
                                onClick={() =>
                                  updateQuantity(product.id, 1)
                                }
                                aria-label={`Increase ${product.name} quantity`}
                                className="rounded-md border p-1.5 disabled:opacity-40"
                              >
                                <Plus size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setCart((current) => {
                                    const updated = { ...current };
                                    delete updated[product.id];
                                    return updated;
                                  });
                                }}
                                aria-label={`Remove ${product.name}`}
                                className="ml-1 text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <strong className="whitespace-nowrap">
                            {money(product.price * cart[product.id])}
                          </strong>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-8 flex justify-between text-lg font-bold">
                    <span>Indicative subtotal</span>
                    <span>{money(cartTotal)}</span>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Final prices, taxes and availability will be confirmed
                    by SRL Infra Developers.
                  </p>

                  {submitError && (
                    <p
                      role="alert"
                      className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                    >
                      {submitError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={openCheckout}
                    className="mt-5 w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
                  >
                    Checkout — Submit Enquiry
                  </button>
                </>
              )}
            </section>
          </div>
        )}

        {/* CUSTOMER CHECKOUT / ENQUIRY FORM */}
        {showCheckout && (
          <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/50 p-3 sm:p-5">
            <div className="mx-auto my-4 max-w-3xl rounded-2xl bg-white p-5 shadow-xl sm:my-8 sm:p-8">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
                    SRL Infra Developers
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    Product Enquiry
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Share your details. Our team will contact you to confirm
                    product pricing and availability.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowCheckout(false);
                    setSubmitError('');
                  }}
                  aria-label="Close enquiry form"
                  className="rounded-lg p-2 hover:bg-slate-100"
                >
                  <X />
                </button>
              </div>

              {/* ORDER SUMMARY */}
              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900">
                  Selected products ({cartCount} item(s))
                </h3>

                <div className="mt-3 space-y-3">
                  {selectedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3 text-sm last:border-0"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="mt-1 text-slate-500">
                          Qty: {cart[product.id]} {product.unit}(s)
                        </p>
                      </div>

                      <span className="font-semibold">
                        {money(product.price * cart[product.id])}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex justify-between font-bold">
                  <span>Indicative subtotal</span>
                  <span>{money(cartTotal)}</span>
                </div>
              </div>

              <form onSubmit={submitEnquiry} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Full name *
                    <input
                      required
                      autoComplete="name"
                      maxLength={120}
                      value={customer.name}
                      onChange={(event) =>
                        updateCustomer('name', event.target.value)
                      }
                      placeholder="Enter your full name"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-600"
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Phone number *
                    <input
                      required
                      type="tel"
                      autoComplete="tel"
                      maxLength={20}
                      value={customer.phone}
                      onChange={(event) =>
                        updateCustomer('phone', event.target.value)
                      }
                      placeholder="Enter your phone number"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-600"
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Email address
                    <input
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                      value={customer.email}
                      onChange={(event) =>
                        updateCustomer('email', event.target.value)
                      }
                      placeholder="you@example.com"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-600"
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Company name
                    <input
                      autoComplete="organization"
                      maxLength={150}
                      value={customer.company}
                      onChange={(event) =>
                        updateCustomer('company', event.target.value)
                      }
                      placeholder="Company name (optional)"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-600"
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Project type
                    <select
                      value={customer.projectType}
                      onChange={(event) =>
                        updateCustomer('projectType', event.target.value)
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-600"
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

                  <label className="block text-sm font-medium text-slate-700">
                    Project location
                    <input
                      maxLength={250}
                      value={customer.projectLocation}
                      onChange={(event) =>
                        updateCustomer('projectLocation', event.target.value)
                      }
                      placeholder="City or project address"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-600"
                    />
                  </label>
                </div>

                <label className="block text-sm font-medium text-slate-700">
                  Additional requirements
                  <textarea
                    rows={3}
                    maxLength={3000}
                    value={customer.message}
                    onChange={(event) =>
                      updateCustomer('message', event.target.value)
                    }
                    placeholder="Tell us about your requirements..."
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-600"
                  />
                </label>

                {submitError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    {submitError}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setShowCheckout(false);
                      setShowCart(true);
                      setSubmitError('');
                    }}
                    className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 disabled:opacity-50"
                  >
                    Back to cart
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || selectedProducts.length === 0}
                    className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting
                      ? 'Submitting enquiry...'
                      : 'Submit Enquiry'}
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  Submitting this form sends your contact details and selected
                  products to SRL Infra Developers for follow-up. This is an
                  enquiry, not a confirmed purchase or online payment.
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
