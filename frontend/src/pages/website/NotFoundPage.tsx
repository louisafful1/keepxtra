import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Seo } from '@/components/Seo'

export default function NotFoundPage() {
  return (
    <>
      <Seo
        title="Page Not Found"
        description="The page you are looking for does not exist."
        path="/404"
        noIndex
      />
      <section className="flex min-h-[70vh] items-center bg-neutral-50 pt-32">
        <Container className="flex flex-col items-center gap-6 text-center">
          <span className="font-display text-8xl font-medium text-neutral-200">404</span>
          <h1 className="text-3xl font-medium text-neutral-900">Page not found</h1>
          <p className="max-w-md text-neutral-500">
            The page you&apos;re looking for doesn&apos;t exist or has moved.
          </p>
          <Button to="/">Back to Home</Button>
        </Container>
      </section>
    </>
  )
}
