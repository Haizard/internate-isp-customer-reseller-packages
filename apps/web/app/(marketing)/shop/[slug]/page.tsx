"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useApi } from "@/lib/useApi";

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  comparePrice?: number;
  imageUrl?: string;
  specs?: string;
  features?: string;
  stock: number;
  published: boolean;
  featured: boolean;
  linkedBlogIds?: string;
  category?: { id: string; name: string; slug: string };
  createdAt: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
}

export default function ProductPage() {
  const params = useParams();
  const { data: product, loading, error } = useApi<Product>(`/products/${params.slug}`);
  const { data: allPosts } = useApi<BlogPost[]>("/blog/posts?all=true", []);

  const linkedBlogs = product?.linkedBlogIds && allPosts
    ? allPosts.filter((p: BlogPost) => product.linkedBlogIds!.split(",").includes(p.id))
    : [];

  function parseSpecs(specs?: string): Record<string, string> {
    if (!specs) return {};
    const result: Record<string, string> = {};
    specs.split("\n").forEach(line => {
      const idx = line.indexOf(":");
      if (idx > 0) {
        result[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      }
    });
    return result;
  }

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-12 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--surface)] rounded w-1/3" />
          <div className="grid gap-8 md:grid-cols-2">
            <div className="h-80 bg-[var(--surface)] rounded-2xl" />
            <div className="space-y-4">
              <div className="h-6 bg-[var(--surface)] rounded w-3/4" />
              <div className="h-4 bg-[var(--surface)] rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="px-4 md:px-8 py-12 max-w-5xl mx-auto text-center">
        <p className="text-[var(--text-muted)] text-lg">{error || "Product not found"}</p>
        <Link href="/shop" className="text-[var(--accent)] mt-4 inline-block hover:underline">← Back to Shop</Link>
      </div>
    );
  }

  const specs = parseSpecs(product.specs);
  const features = product.features ? product.features.split(",").map(f => f.trim()).filter(Boolean) : [];

  return (
    <div className="px-4 md:px-8 py-12 max-w-5xl mx-auto">
      <Link href="/shop" className="text-[var(--accent)] text-sm font-semibold mb-6 inline-block hover:underline">← Back to Shop</Link>

      <div className="grid gap-8 md:grid-cols-2 mb-12">
        {/* Image */}
        <div>
          {product.imageUrl ? (
            <div className="w-full h-80 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center overflow-hidden">
              <img src={product.imageUrl} alt={product.name} className="object-contain h-full p-4" />
            </div>
          ) : (
            <div className="w-full h-80 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
              <span className="text-[var(--text-muted)]">No image</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.category && (
            <Link href={`/shop?category=${product.category.slug}`} className="inline-block px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-semibold mb-3 hover:bg-[var(--accent)]/20 transition-all">
              {product.category.name}
            </Link>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] mb-2">{product.name}</h1>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl font-bold text-[var(--accent)]">{(product.price / 100).toLocaleString()} TZS</span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-lg text-[var(--text-muted)] line-through">{(product.comparePrice / 100).toLocaleString()} TZS</span>
            )}
          </div>

          {product.description && (
            <p className="text-[var(--text-muted)] mb-4">{product.description}</p>
          )}

          <div className="flex items-center gap-3 mb-6">
            {product.stock > 0 ? (
              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold">In Stock ({product.stock} available)</span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold">Out of Stock</span>
            )}
            {product.featured && (
              <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold">Featured</span>
            )}
          </div>

          {product.stock > 0 && (
            <button className="w-full py-3 bg-[var(--accent)] text-white rounded-xl font-medium hover:opacity-90 transition-all">
              Contact to Purchase
            </button>
          )}
        </div>
      </div>

      {/* Features */}
      {features.length > 0 && (
        <div className="mb-8 p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
          <h2 className="text-lg font-bold text-[var(--text)] mb-3">Features</h2>
          <div className="flex flex-wrap gap-2">
            {features.map(f => (
              <span key={f} className="px-3 py-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] text-sm">{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* Specs */}
      {Object.keys(specs).length > 0 && (
        <div className="mb-8 p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
          <h2 className="text-lg font-bold text-[var(--text)] mb-4">Specifications</h2>
          <div className="space-y-2">
            {Object.entries(specs).map(([key, value]) => (
              <div key={key} className="flex justify-between py-2 border-b border-[var(--border)] last:border-0">
                <span className="text-sm text-[var(--text-muted)]">{key}</span>
                <span className="text-sm font-semibold text-[var(--text)]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Description */}
      {product.description && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[var(--text)] mb-4">Description</h2>
          <div className="text-[var(--text)] leading-relaxed whitespace-pre-wrap">{product.description}</div>
        </div>
      )}

      {/* Linked Blog Posts — Cross-linking */}
      {linkedBlogs.length > 0 && (
        <div className="mt-12 p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
          <h2 className="text-xl font-bold text-[var(--text)] mb-4">📖 Related Articles</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">Learn more about this product in our blog</p>
          <div className="grid gap-4 md:grid-cols-2">
            {linkedBlogs.map((blog) => (
              <Link key={blog.id} href={`/blog/${blog.slug}`} className="flex gap-4 p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--accent)] transition-all group">
                {blog.coverImage ? (
                  <img src={blog.coverImage} alt="" className="w-20 h-20 rounded-lg object-cover bg-[var(--surface)]" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-[var(--bg)] flex items-center justify-center text-[var(--text-muted)] text-xs">📖</div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors truncate">{blog.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] line-clamp-2 mt-1">{blog.excerpt || "Read more..."}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
