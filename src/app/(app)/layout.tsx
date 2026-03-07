import Nav from '@/components/layout/Nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="md:pl-52 pb-20 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-8 md:px-8 md:py-10">
          {children}
        </div>
      </main>
    </div>
  )
}
