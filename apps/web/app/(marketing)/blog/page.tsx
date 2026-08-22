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
      } catch {
        // ignore
      }
      setLoading(false);
    }
    load();
  }, []);

  const published = posts.filter(p => p.published);
  const filtered = selectedCategory
    ? published.filter(p => p.category?.slug === selectedCategory)
    : published;

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <section className="relative py-16 md:py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 right-0 w-[400px] h-[400px] rounded-full bg-[var(--accent-blue)] opacity-[0.05] blur-[100px]" />
          <div className="absolute -bottom-20 left-0 w-[300px] h-[300px] rounded-full bg-[var(--accent-purple)] opacity-[0.04] blur-[100px]" />
        </div>
        <div className="relative max-w-6xl mx-auto text-center">
          <span className="text-sm font-semibold text-[var(--accent-blue)] uppercase tracking-widest">Our Blog</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] mt-3 mb-4">
            Learn, Build & <span className="text-gradient">Grow</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
            Tutorials, guides, and insights for internet resellers and network operators.
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
              All Posts
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
                {cat._count ? ` · ${cat._count.posts}` : ""}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid gap-8 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="glass rounded-3xl overflow-hidden">
                  <div className="h-56 bg-[var(--glass-surface-subtle)]" />
                  <div className="p-6 space-y-3">
                    <div className="h-3 bg-[var(--glass-surface-subtle)] rounded-full w-1/4" />
                    <div className="h-6 bg-[var(--glass-surface-subtle)] rounded-full w-3/4" />
                    <div className="h-4 bg-[var(--glass-surface-subtle)] rounded-full w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No posts yet</h3>
            <p className="text-[var(--text-secondary)]">Check back soon — we&apos;re working on great content!</p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featured && (
              <Link href={`/blog/${featured.slug}`} className="block mb-12">
                <div className="glass rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-500 group grid md:grid-cols-2">
                  {featured.coverImage ? (
                    <div className="h-64 md:h-auto relative overflow-hidden">
                      <img
                        src={featured.coverImage}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  ) : (
                    <div className="h-64 md:h-auto bg-gradient-to-br from-[var(--accent-blue)]/10 to-[var(--accent-purple)]/10 flex items-center justify-center">
                      <span className="text-6xl opacity-30">📖</span>
                    </div>
                  )}
                  <div className="p-8 md:p-10 flex flex-col justify-center">
                    {featured.category && (
                      <span className="inline-flex self-start px-3 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-xs font-bold uppercase tracking-wider mb-4">
                        {featured.category.name}
                      </span>
                    )}
                    <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] mb-3 group-hover:text-[var(--accent-blue)] transition-colors">
                      {featured.title}
                    </h2>
                    <p className="text-[var(--text-secondary)] leading-relaxed mb-4 line-clamp-3">
                      {featured.excerpt || "Read this post to learn more..."}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-[var(--text-tertiary)]">
                      {featured.author && <span>By {featured.author}</span>}
                      <span>·</span>
                      <span>{new Date(featured.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Post Grid */}
            {rest.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <article className="glass rounded-2xl overflow-hidden hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group h-full flex flex-col">
                      {post.coverImage ? (
                        <div className="h-48 overflow-hidden">
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-[var(--accent-blue)]/5 to-[var(--accent-purple)]/5 flex items-center justify-center">
                          <span className="text-4xl opacity-20">📖</span>
                        </div>
                      )}
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                          {post.category && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-xs font-bold">
                              {post.category.name}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-blue)] transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4 flex-1">
                          {post.excerpt || ""}
                        </p>
                        <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] pt-3 border-t border-[var(--hairline)]">
                          <span>{new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                          {post.tags && post.tags.split(",").length > 0 && (
                            <span className="text-[var(--accent-blue)] font-medium">
                              {post.tags.split(",")[0].trim()}
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
