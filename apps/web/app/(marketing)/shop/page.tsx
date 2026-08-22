"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  comparePrice?: number;
  imageUrl?: string;
  stock: number;
  featured: boolean;
  category?: { name: string; slug: string } | null;
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [prodsData, catsData] = await Promise.all([
          api.get<Product[]>("/products").catch(() => []),
          api.get<ProductCategory[]>("/products/categories").catch(() => []),
        ]);
        setProducts(Array.isArray(prodsData) ? prodsData : []);
        setCategories(Array.isArray(catsData) ? catsData : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = selectedCategory
    ? products.filter(p => p.category?.slug === selectedCategory)
    : products;

  return (
    <div className="px-4 md:px-8 py-12 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--text)] mb-2">Router Store</h1>
        <p className="text-lg text-[var(--text-muted)]">Compatible routers for the NetMaster platform</p>
      </div>

      {/* Category Filters */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              !selectedCategory ? "bg-[var(--accent)] text-white" : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                selectedCategory === cat.slug ? "bg-[var(--accent)] text-white" : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {cat.name} {cat._count ? `(${cat._count.products})` : ""}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
              <div className="h-48 bg-[var(--bg)] rounded-lg mb-4" />
              <div className="h-6 bg-[var(--bg)] rounded w-3/4 mb-2" />
              <div className="h-4 bg-[var(--bg)] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-[var(--text-muted)] text-lg">{error}</p>
          <button onClick={() => window.location.reload()} className="text-[var(--accent)] mt-4 hover:underline">Try again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--text-muted)] text-lg">No products available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link key={p.id} href={`/shop/${p.slug}`}>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 hover:shadow-lg hover:border-[var(--accent)]/30 transition-all cursor-pointer h-full flex flex-col">
                {p.imageUrl ? (
                  <div className="w-full h-48 rounded-lg bg-[var(--bg)] mb-4 flex items-center justify-center overflow-hidden">
                    <img src={p.imageUrl} alt={p.name} className="object-contain h-full p-2" />
                  </div>
                ) : (
                  <div className="w-full h-48 rounded-lg bg-[var(--bg)] mb-4 flex items-center justify-center">
                    <span className="text-4xl">📦</span>
                  </div>
                )}
                {p.category && (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-semibold mb-2 self-start">
                    {p.category.name}
                  </span>
                )}
                <h2 className="text-lg font-bold text-[var(--text)] mb-1">{p.name}</h2>
                <p className="text-sm text-[var(--text-muted)] mb-3 line-clamp-2 flex-1">{p.description?.slice(0, 100) || ""}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[var(--accent)]">{(p.price / 100).toLocaleString()} TZS</span>
                    {p.comparePrice && p.comparePrice > p.price && (
                      <span className="text-sm text-[var(--text-muted)] line-through">{(p.comparePrice / 100).toLocaleString()} TZS</span>
                    )}
                  </div>
                  {p.stock > 0 ? (
                    <span className="text-xs font-semibold text-green-400">In Stock</span>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">Out of Stock</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
