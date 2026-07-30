import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { ImageSlot } from '@/components/ui/ImageSlot'
import type { BlogPost } from '@/data/blogPosts'
import { cn } from '@/lib/cn'

interface BlogPostCardProps {
  post: BlogPost
  featured?: boolean
}

export function BlogPostCard({ post, featured = false }: BlogPostCardProps) {
  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-3xl border border-neutral-200/70 bg-white shadow-soft transition-shadow duration-300 hover:shadow-premium',
        featured && 'lg:grid lg:grid-cols-2 lg:items-stretch',
      )}
    >
      <div className="overflow-hidden">
        <div className="h-full transition-transform duration-500 group-hover:scale-105">
          <ImageSlot
            alt={post.title}
            label={post.category}
            icon={post.icon}
            aspectRatio={featured ? 'wide' : 'video'}
            rounded="3xl"
            className={cn('rounded-b-none border-none', featured && 'h-full lg:rounded-r-none lg:rounded-bl-3xl')}
          />
        </div>
      </div>
      <div className={cn('flex flex-1 flex-col gap-3 p-7', featured && 'justify-center lg:p-10')}>
        <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-widest text-primary-600">
          <span>{post.category}</span>
          <span className="h-1 w-1 rounded-full bg-neutral-300" aria-hidden />
          <span className="flex items-center gap-1 normal-case tracking-normal text-neutral-400">
            <Clock className="size-3.5" />
            {post.readingTime}
          </span>
        </div>
        <h3
          className={cn(
            'font-display font-medium leading-snug text-neutral-900',
            featured ? 'text-2xl sm:text-3xl' : 'text-lg',
          )}
        >
          {post.title}
        </h3>
        <p className={cn('leading-relaxed text-neutral-500', featured ? 'text-base' : 'text-sm')}>
          {post.excerpt}
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
          <span className="font-medium text-neutral-700">{post.author}</span>
          <span aria-hidden>&middot;</span>
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </time>
        </div>
      </div>
    </motion.article>
  )
}
