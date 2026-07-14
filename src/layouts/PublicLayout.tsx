import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { RouteFallback } from '@/app/RouteFallback'

export function PublicLayout() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Outlet />
    </Suspense>
  )
}
