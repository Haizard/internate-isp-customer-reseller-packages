"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useApi } from "@/lib/useApi";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  author?: string;
  tags?: string;
  linkedProductIds?: string;
  published: boolean;
  category?: { id: string; name: string; slug: string };
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string;
  description?: string;
}

export default function BlogPostPage() {
  const params = useParams();
  const { data: post, loading, error } = useApi<BlogPost>(`/blog/posts/${params.slug}`);
  const { data: linkedProductsData } = useApi<Product[]>("/products?all=true", []);

  const linkedProducts = post?.linkedProductIds && linkedProductsData
    ? linkedProductsData.filter((p: Product) => post.linkedProductIds!.split(",").includes(p.id))
    : [];

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-12 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--surface)] rounded w-1/3" />
          <div className="h-4 bg-[var(--surface)] rounded w-1/4" />
          <div className="h-64 bg-[var(--surface)] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="px-4 md:px-8 py-12 max-w-4xl mx-auto text-center">
        <p className="text-[var(--text-muted)] text-lg">{error || "Post not found"}</p>
        <Link href="/blog" className="text-[var(--accent)] mt-4 inline-block hover:underline">← Back to Blog</Link>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-12 max-w-4xl mx-auto">
      <Link href="/blog" className="text-[var(--accent)] text-sm font-semibold mb-6 inline-block hover:underline">← Back to Blog</Link>

      {post.category && (
        <Link href={`/blog?category=${post.category.slug}`} className="inline-block px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-semibold mb-3 hover:bg-[var(--accent)]/20 transition-all">
          {post.category.name}
        </Link>
      )}

      <h1 className="text-3xl md:text-4xl font-bold text-[var(--text)] mb-3">{post.title}</h1>
      <div className="flex items-center gap-3 text-sm text-[var(--text-muted)] mb-6">
        {post.author && <span>By {post.author}</span>}
        <span>{new Date(post.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
      </div>

      {post.coverImage && (
        <div className="w-full h-64 md:h-96 rounded-2xl bg-[var(--surface)] mb-8 overflow-hidden border border-[var(--border)]">
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      {post.excerpt && (
        <p className="text-lg text-[var(--text-muted)] mb-6 font-medium italic border-l-4 border-[var(--accent)] pl-4">{post.excerpt}</p>
      )}

      <article className="prose prose-lg max-w-none mb-12">
        <div className="text-[var(--text)] leading-relaxed whitespace-pre-wrap">{post.content}</div>
      </article>

      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {post.tags.split(",").map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-muted)]">{tag.trim()}</span>
          ))}
        </div>
      )}

      {/* Linked Products — Cross-linking */}
      {linkedProducts.length > 0 && (
        <div className="mt-12 p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
          <h2 className="text-xl font-bold text-[var(--text)] mb-4">🛒 Related Products</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {linkedProducts.map((product) => (
              <Link key={product.id} href={`/shop/${product.slug}`} className="flex gap-4 p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--accent)] transition-all group">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-20 h-20 rounded-lg object-cover bg-[var(--surface)]" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-[var(--bg)] flex items-center justify-center text-[var(--text-muted)] text-xs">No img</div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors truncate">{product.name}</h3>
                  <p className="text-sm text-[var(--text-muted)] line-clamp-2 mt-1">{product.description?.slice(0, 80)}</p>
                  <p className="text-sm font-bold text-[var(--accent)] mt-1">{(product.price / 100).toLocaleString()} TZS</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
