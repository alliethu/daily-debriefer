import Nav from '@/components/layout/Nav'
import { isAdmin } from '@/lib/admin'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin()

  return (
    <div className="min-h-screen">
      <Nav isAdmin={admin} />
      <main className="md:pl-60 pb-24 md:pb-0">
        <div className="max-w-3xl mx-auto px-6 py-10 md:px-16 md:py-12">
          {children}
        </div>
      </main>
    </div>
  )
}
