import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { blogCategories, blogPosts, type BlogCategory } from '@/data/blogPosts'
import { BlogPostCard } from '@/sections/blog/BlogPostCard'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'
import { cn } from '@/lib/cn'

const POSTS_PER_PAGE = 6

type CategoryFilter = 'All' | BlogCategory

export function BlogBrowser() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('All')
  const [page, setPage] = useState(1)

  const featuredPost = blogPosts.find((post) => post.featured)
  const remainingPosts = blogPosts.filter((post) => post !== featuredPost)

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return remainingPosts.filter((post) => {
      const matchesCategory = category === 'All' || post.category === category
      const matchesQuery =
        !normalizedQuery ||
        post.title.toLowerCase().includes(normalizedQuery) ||
        post.excerpt.toLowerCase().includes(normalizedQuery)
      return matchesCategory && matchesQuery
    })
  }, [query, category, remainingPosts])

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const pagePosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE,
  )

  function updateCategory(next: CategoryFilter) {
    setCategory(next)
    setPage(1)
  }

  function updateQuery(next: string) {
    setQuery(next)
    setPage(1)
  }

  return (
    <>
      {featuredPost && (
        <section className="bg-neutral-50 pb-16">
          <Container>
            <motion.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={fadeUp}>
              <BlogPostCard post={featuredPost} featured />
            </motion.div>
          </Container>
        </section>
      )}

      <section className="bg-white py-20">
        <Container>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => updateQuery(event.target.value)}
                placeholder="Search articles..."
                className="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-11 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-50"
              />
            </div>

            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {(['All', ...blogCategories] as CategoryFilter[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateCategory(option)}
                  className={cn(
                    'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                    category === option
                      ? 'border-primary-500 bg-primary-500 text-white'
                      : 'border-neutral-200 text-neutral-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {pagePosts.length > 0 ? (
            <motion.div
              key={`${category}-${query}-${currentPage}`}
              variants={staggerContainer(0.08)}
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
            >
              {pagePosts.map((post) => (
                <motion.div key={post.slug} variants={fadeUp}>
                  <BlogPostCard post={post} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <p className="mt-16 text-center text-sm text-neutral-500">
              No articles match your search yet — try a different keyword or category.
            </p>
          )}

          {totalPages > 1 && (
            <div className="mt-14 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="flex size-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:border-primary-300 hover:text-primary-700 disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  aria-label={`Go to page ${pageNumber}`}
                  aria-current={pageNumber === currentPage}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full text-sm font-medium transition-colors',
                    pageNumber === currentPage
                      ? 'bg-primary-500 text-white'
                      : 'text-neutral-600 hover:bg-primary-50 hover:text-primary-700',
                  )}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="flex size-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:border-primary-300 hover:text-primary-700 disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </Container>
      </section>
    </>
  )
}
