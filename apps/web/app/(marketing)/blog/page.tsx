"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  published: boolean;
  author?: string;
  tags?: string;
  category?: { name: string; slug: string } | null;
  createdAt: string;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  _count?: { posts: number };
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [postsData, catsData] = await Promise.all([
          api.get<BlogPost[]>("/blog/posts").catch(() => []),
          api.get<BlogCategory[]>("/blog/categories").catch(() => []),
        ]);
        setPosts(Array.isArray(postsData) ? postsData : []);
        setCategories(Array.isArray(catsData) ? catsData : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = selectedCategory
    ? posts.filter(p => p.category?.slug === selectedCategory && p.published)
    : posts.filter(p => p.published);

  return (
    <div className="px-4 md:px-8 py-12 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--text)] mb-2">Blog</h1>
        <p className="text-lg text-[var(--text-muted)]">Tutorials, guides, and news about internet reselling</p>
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
              {cat.name} {cat._count ? `(${cat._count.posts})` : ""}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
              <div className="h-40 bg-[var(--bg)] rounded-lg mb-4" />
              <div className="h-4 bg-[var(--bg)] rounded w-1/4 mb-2" />
              <div className="h-6 bg-[var(--bg)] rounded w-3/4 mb-2" />
              <div className="h-4 bg-[var(--bg)] rounded w-full" />
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
          <p className="text-[var(--text-muted)] text-lg">No blog posts yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 hover:shadow-lg hover:border-[var(--accent)]/30 transition-all cursor-pointer h-full flex flex-col">
                {post.coverImage && (
                  <div className="w-full h-40 rounded-lg bg-[var(--bg)] mb-4 overflow-hidden">
                    <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                )}
                {post.category && (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-semibold mb-2 self-start">
                    {post.category.name}
                  </span>
                )}
                <h2 className="text-lg font-bold text-[var(--text)] mb-2 line-clamp-2">{post.title}</h2>
                <p className="text-sm text-[var(--text-muted)] line-clamp-3 mb-3 flex-1">{post.excerpt || ""}</p>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-auto">
                  {post.author && <span>By {post.author}</span>}
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  {post.tags && post.tags.length > 0 && (
                    <>
                      <span>·</span>
                      <span>{post.tags.split(",").slice(0, 2).join(", ")}</span>
                    </>
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
