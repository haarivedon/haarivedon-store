"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Client-side cart (store CR).
 *
 * Held in localStorage, not on the server — there are no customer accounts, and
 * the only moment the cart must be trusted is at checkout, where the API
 * re-prices every line from the database. What we keep here is just enough to
 * render the cart (name, price, image); none of it is trusted for money.
 */
export type CartLine = {
  slug: string;
  name: string;
  /** Whole rupees, for display only. */
  price: number;
  image: string;
  quantity: number;
};

type CartContextValue = {
  items: CartLine[];
  count: number;
  subtotal: number;
  /** Ready once localStorage has been read — guards against an empty flash. */
  hydrated: boolean;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "haarivedon_cart";
const MAX_QTY = 99;

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Read once on mount. Starting empty keeps server and first client render in
  // agreement; the real cart appears right after hydration.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // Syncing from localStorage on mount is the external-store case this rule
      // exempts; starting empty (not a lazy initializer) keeps SSR and the
      // first client render in agreement, so the cart can't cause a mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw) as CartLine[]);
    } catch {
      // Corrupt or unavailable storage — start empty.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore quota / privacy-mode failures.
    }
  }, [items, hydrated]);

  const add = useCallback<CartContextValue["add"]>((line, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.slug === line.slug);
      if (existing) {
        return current.map((item) =>
          item.slug === line.slug
            ? { ...item, quantity: Math.min(MAX_QTY, item.quantity + quantity) }
            : item,
        );
      }
      return [...current, { ...line, quantity: Math.min(MAX_QTY, quantity) }];
    });
  }, []);

  const setQuantity = useCallback<CartContextValue["setQuantity"]>(
    (slug, quantity) => {
      setItems((current) =>
        quantity <= 0
          ? current.filter((item) => item.slug !== slug)
          : current.map((item) =>
              item.slug === slug
                ? { ...item, quantity: Math.min(MAX_QTY, quantity) }
                : item,
            ),
      );
    },
    [],
  );

  const remove = useCallback<CartContextValue["remove"]>((slug) => {
    setItems((current) => current.filter((item) => item.slug !== slug));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    return { items, count, subtotal, hydrated, add, setQuantity, remove, clear };
  }, [items, hydrated, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider.");
  return context;
}
