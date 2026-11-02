import { useEffect, useMemo, useRef, useState } from 'react';

export type PickableProduct = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  price: number | null;
  unit: string | null;
};

const formatPrice = (value: number | null) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

/*
 * The quotation line's description box with product search.
 * Typing searches the product catalogue; picking a product hands it to
 * onPick so the line can fill in its name, unit and rate. Free text
 * still works for services that are not in the catalogue.
 */
export default function ProductPicker({
  value,
  products,
  onChange,
  onPick,
  placeholder = 'Search product or type a service',
  className = '',
}: {
  value: string;
  products: PickableProduct[];
  onChange: (value: string) => void;
  onPick: (product: PickableProduct) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<DOMRect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // The line-item tables scroll sideways, which would clip a normal
  // dropdown, so the list is placed against the window and closes on
  // scroll or resize.
  const openList = () => {
    setBox(inputRef.current?.getBoundingClientRect() ?? null);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    const close = (event: Event) => {
      // Scrolling the list itself must not close it.
      if (listRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);

    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const matches = useMemo(() => {
    const words = value.trim().toLowerCase().split(/\s+/).filter(Boolean);

    if (words.length === 0) return products.slice(0, 8);

    return products
      .filter((product) => {
        const haystack =
          `${product.name} ${product.category || ''}`.toLowerCase();

        return words.every((word) => haystack.includes(word));
      })
      .slice(0, 8);
  }, [products, value]);

  return (
    <div>
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          openList();
        }}
        onFocus={openList}
        onBlur={() => setOpen(false)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />

      {open && box && matches.length > 0 && (
        <ul
          ref={listRef}
          style={{
            top: box.bottom + 4,
            left: box.left,
            width: Math.max(box.width, 352),
          }}
          className="fixed z-[60] max-h-72 overflow-y-auto rounded-lg border border-black/10 bg-white py-1 shadow-lg"
        >
          {matches.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                // mousedown fires before the input's blur closes the list
                onMouseDown={(event) => {
                  event.preventDefault();
                  onPick(product);
                  setOpen(false);
                }}
                className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {product.name}
                  </span>
                  <span className="block truncate text-xs text-gray-500">
                    {product.category || 'Product'}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-medium">
                    {formatPrice(product.price)}
                  </span>
                  <span className="block text-xs text-gray-500">
                    per {product.unit || 'unit'}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
