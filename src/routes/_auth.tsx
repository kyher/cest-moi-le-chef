import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '#/lib/session'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/sign-in' })
    }
    return { session }
  },
  component: () => <Outlet />,
})
