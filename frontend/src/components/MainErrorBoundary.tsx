import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'

/**
 * Router-level fallback for the website. Deliberately avoids the shared layout
 * and animation imports so it still renders when a lazy page chunk — or the
 * layout itself — fails to load.
 */
export function MainErrorBoundary() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404

  return (
    <section className="flex min-h-screen items-center bg-neutral-50 px-6">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        <span className="font-display text-8xl font-medium text-neutral-200">
          {notFound ? '404' : 'Oops'}
        </span>
        <h1 className="text-3xl font-medium text-neutral-900">
          {notFound ? 'Page not found' : 'Something went wrong'}
        </h1>
        <p className="max-w-md text-neutral-500">
          {notFound
            ? "The page you're looking for doesn't exist or has moved."
            : 'We hit an unexpected error while loading this page. Please try again in a moment.'}
        </p>
        <Link
          to="/"
          reloadDocument
          className="inline-flex items-center justify-center rounded-xl bg-primary-700 px-7 py-4 text-base font-semibold text-white shadow-glow transition-colors duration-300 hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
        >
          Return Home
        </Link>
      </div>
    </section>
  )
}
