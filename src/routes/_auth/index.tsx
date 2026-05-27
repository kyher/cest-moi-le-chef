import { createFileRoute, useRouter } from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'

export const Route = createFileRoute('/_auth/')({ component: Home })

function Home() {
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    await router.navigate({ to: '/sign-in' })
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
      <p className="mt-4 text-lg">
        Edit <code>src/routes/_auth/index.tsx</code> to get started.
      </p>
      <button
        onClick={handleSignOut}
        className="mt-6 h-9 px-4 text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
      >
        Sign out
      </button>
    </div>
  )
}
