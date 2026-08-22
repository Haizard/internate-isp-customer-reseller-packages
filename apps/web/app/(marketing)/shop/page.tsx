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
      } catch {
        // ignore
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = selectedCategory
    ? products.filter(p => p.category?.slug === selectedCategory)
    : products;

  const featured = filtered.filter(p => p.featured);
  const regular = filtered.filter(p => !p.featured);

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <section className="relative py-16 md:py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 left-1/3 w-[400px] h-[400px] rounded-full bg-[var(--accent-green)] opacity-[0.05] blur-[100px]" />
          <div className="absolute -bottom-20 right-0 w-[300px] h-[300px] rounded-full bg-[var(--accent-blue)] opacity-[0.04] blur-[100px]" />
        </div>
        <div className="relative max-w-6xl mx-auto text-center">
          <span className="text-sm font-semibold text-[var(--accent-green)] uppercase tracking-widest">Router Store</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] mt-3 mb-4">
            Compatible <span className="text-gradient">Hardware</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
            MikroTik routers pre-configured for the NetMaster platform. Plug in and start selling.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-20">
        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10 justify-center">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                !selectedCategory
                  ? "bg-[var(--accent-blue)] text-white shadow-md shadow-[var(--accent-blue)]/20"
                  : "glass text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              All Routers
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  selectedCategory === cat.slug
                    ? "bg-[var(--accent-blue)] text-white shadow-md shadow-[var(--accent-blue)]/20"
                    : "glass text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {cat.name}
                {cat._count ? ` · ${cat._count.products}` : ""}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse glass rounded-3xl overflow-hidden">
                <div className="h-56 bg-[var(--glass-surface-subtle)]" />
                <div className="p-6 space-y-3">
                  <div className="h-3 bg-[var(--glass-surface-subtle)] rounded-full w-1/4" />
                  <div className="h-5 bg-[var(--glass-surface-subtle)] rounded-full w-3/4" />
                  <div className="h-4 bg-[var(--glass-surface-subtle)] rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No products yet</h3>
            <p className="text-[var(--text-secondary)]">Check back soon — we&apos;re adding new routers!</p>
          </div>
        ) : (
          <>
            {/* Featured Products */}
            {featured.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-orange)]/15 flex items-center justify-center">
                    <span className="text-sm">⭐</span>
                  </div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Featured Routers</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {featured.map((product) => (
                    <Link key={product.id} href={`/shop/${product.slug}`}>
                      <div className="glass rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 group grid sm:grid-cols-2">
                        {product.imageUrl ? (
                          <div className="h-48 sm:h-auto bg-gradient-to-br from-[var(--accent-blue)]/5 to-[var(--accent-purple)]/5 flex items-center justify-center overflow-hidden">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        ) : (
                          <div className="h-48 sm:h-auto bg-gradient-to-br from-[var(--accent-blue)]/5 to-[var(--accent-purple)]/5 flex items-center justify-center">
                            <span className="text-5xl opacity-20">📡</span>
                          </div>
                        )}
                        <div className="p-6 flex flex-col justify-center">
                          {product.category && (
                            <span className="inline-flex self-start px-2.5 py-0.5 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-xs font-bold uppercase tracking-wider mb-3">
                              {product.category.name}
                            </span>
                          )}
                          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent-blue)] transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">
                            {product.description?.slice(0, 80) || ""}
                          </p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold text-gradient">{(product.price / 100).toLocaleString()} TZS</span>
                            {product.comparePrice && product.comparePrice > product.price && (
                              <span className="text-sm text-[var(--text-tertiary)] line-through">{(product.comparePrice / 100).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* All Products Grid */}
            {regular.length > 0 && (
              <div>
                {featured.length > 0 && (
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-[var(--accent-blue)]/15 flex items-center justify-center">
                      <span className="text-sm">🛒</span>
                    </div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">All Routers</h2>
                  </div>
                )}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {regular.map((product) => (
                    <Link key={product.id} href={`/shop/${product.slug}`}>
                      <article className="glass rounded-2xl overflow-hidden hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group h-full flex flex-col">
                        {product.imageUrl ? (
                          <div className="h-48 overflow-hidden bg-gradient-to-br from-[var(--glass-surface-subtle)] to-transparent">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        ) : (
                          <div className="h-48 bg-gradient-to-br from-[var(--accent-blue)]/5 to-[var(--accent-purple)]/5 flex items-center justify-center">
                            <span className="text-5xl opacity-20">📡</span>
                          </div>
                        )}
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 mb-2">
                            {product.category && (
                              <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-xs font-bold">
                                {product.category.name}
                              </span>
                            )}
                            {product.stock > 0 ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-green)]/10 text-[var(--accent-green)] text-xs font-bold">
                                In Stock
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-red)]/10 text-[var(--accent-red)] text-xs font-bold">
                                Out of Stock
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent-blue)] transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4 flex-1">
                            {product.description?.slice(0, 80) || ""}
                          </p>
                          <div className="flex items-center justify-between pt-3 border-t border-[var(--hairline)]">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-extrabold text-gradient">{(product.price / 100).toLocaleString()} TZS</span>
                              {product.comparePrice && product.comparePrice > product.price && (
                                <span className="text-xs text-[var(--text-tertiary)] line-through">{(product.comparePrice / 100).toLocaleString()}</span>
                              )}
                            </div>
                            <span className="text-sm font-semibold text-[var(--accent-blue)] opacity-0 group-hover:opacity-100 transition-opacity">
                              View →
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="glass rounded-3xl p-10 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-[var(--accent-green)] opacity-[0.08] blur-[60px]" />
            <div className="relative">
              <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mb-3">
                Need a custom router configuration?
              </h3>
              <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                Contact us for bulk orders, pre-configured devices, or enterprise deployments.
              </p>
              <Link
                href="/register"
                className="inline-flex px-8 py-3 rounded-2xl bg-[var(--grad-blue)] text-white font-bold shadow-lg shadow-[var(--accent-blue)]/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
