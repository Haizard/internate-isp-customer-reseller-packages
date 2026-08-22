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

/* Fallback cover images by category */
const COVER_MAP: Record<string, string> = {
  "mikrotik": "https://images.unsplash.com/photo-1580894742597-87bc870ddb17?w=600&q=80",
  "getting-started": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80",
  "reseller-tips": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
  "network-security": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80",
};
const DEFAULT_COVER = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80";

/* Sample data when DB is empty */
const SAMPLE_CATEGORIES: BlogCategory[] = [
  { id: "sc1", name: "Getting Started", slug: "getting-started", _count: { posts: 1 } },
  { id: "sc2", name: "MikroTik", slug: "mikrotik", _count: { posts: 1 } },
  { id: "sc3", name: "Reseller Tips", slug: "reseller-tips", _count: { posts: 1 } },
  { id: "sc4", name: "Network Security", slug: "network-security", _count: { posts: 1 } },
];

const SAMPLE_POSTS: BlogPost[] = [
  {
    id: "sp1",
    title: "How to Set Up Your First WiFi Hotspot with NetMaster",
    slug: "setup-first-wifi-hotspot-netmaster",
    excerpt: "A complete step-by-step guide to setting up your first WiFi hotspot and selling vouchers in under 30 minutes.",
    coverImage: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80",
    published: true,
    author: "NetMaster Team",
    tags: "getting started,wifi hotspot,voucher",
    category: { name: "Getting Started", slug: "getting-started" },
    createdAt: "2026-08-20T10:00:00Z",
  },
  {
    id: "sp2",
    title: "MikroTik RouterOS v7: The Complete Beginner Guide",
    slug: "mikrotik-routeros-v7-beginner-guide",
    excerpt: "Understand MikroTik RouterOS v7 — from WinBox to hotspots, queues, and firewall rules.",
    coverImage: "https://images.unsplash.com/photo-1580894742597-87bc870ddb17?w=800&q=80",
    published: true,
    author: "NetMaster Team",
    tags: "mikrotik,routeros,v7,beginner",
    category: { name: "MikroTik", slug: "mikrotik" },
    createdAt: "2026-08-18T10:00:00Z",
  },
  {
    id: "sp3",
    title: "5 Pricing Strategies That Triple Your Reseller Revenue",
    slug: "pricing-strategies-triple-reseller-revenue",
    excerpt: "Proven pricing strategies that WiFi resellers use to maximize revenue.",
    coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    published: true,
    author: "NetMaster Team",
    tags: "pricing,revenue,strategy,reseller",
    category: { name: "Reseller Tips", slug: "reseller-tips" },
    createdAt: "2026-08-15T10:00:00Z",
  },
  {
    id: "sp4",
    title: "How to Secure Your WiFi Network: A Reseller's Guide",
    slug: "secure-wifi-network-resellers-guide",
    excerpt: "Essential security measures every WiFi reseller must implement.",
    coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
    published: true,
    author: "NetMaster Team",
    tags: "security,firewall,mikrotik,wifi",
    category: { name: "Network Security", slug: "network-security" },
    createdAt: "2026-08-12T10:00:00Z",
  },
];

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
        const postsList = Array.isArray(postsData) ? postsData : [];
        const catsList = Array.isArray(catsData) ? catsData : [];
        setPosts(postsList.length > 0 ? postsList : SAMPLE_POSTS);
        setCategories(catsList.length > 0 ? catsList : SAMPLE_CATEGORIES);
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

  function getCover(post: BlogPost): string {
    if (post.coverImage) return post.coverImage;
    if (post.category?.slug && COVER_MAP[post.category.slug]) return COVER_MAP[post.category.slug];
    return DEFAULT_COVER;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Header with networking background */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628]/92 via-[#0d1f3c]/88 to-[#0a1628]/95" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          <span className="text-sm font-semibold text-[var(--accent-blue)] uppercase tracking-widest">Our Blog</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mt-3 mb-4">
            Learn, Build & <span className="bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-teal)] bg-clip-text text-transparent">Grow</span>
          </h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto">
            Tutorials, guides, and insights for internet resellers and network operators.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--bg-base)] to-transparent" />
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-20 -mt-6 relative z-10">
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
            <div className="w-20 h-20 rounded-3xl bg-[var(--glass-surface)] mx-auto flex items-center justify-center text-4xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No posts yet</h3>
            <p className="text-[var(--text-secondary)]">Check back soon — we&apos;re working on great content!</p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featured && (
              <Link href={`/blog/${featured.slug}`} className="block mb-12">
                <div className="glass rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-500 group grid md:grid-cols-2">
                  <div className="h-64 md:h-auto relative overflow-hidden">
                    <img
                      src={getCover(featured)}
                      alt={featured.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      {featured.category && (
                        <span className="inline-flex px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider">
                          {featured.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-8 md:p-10 flex flex-col justify-center">
                    <span className="text-xs font-bold text-[var(--accent-blue)] uppercase tracking-widest mb-2">Featured</span>
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
                      <div className="h-48 overflow-hidden relative">
                        <img
                          src={getCover(post)}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        {post.category && (
                          <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs font-bold">
                            {post.category.name}
                          </span>
                        )}
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-blue)] transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4 flex-1">
                          {post.excerpt || ""}
                        </p>
                        <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] pt-3 border-t border-[var(--hairline)]">
                          <span>{new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                          {post.author && <span className="font-medium">{post.author}</span>}
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
