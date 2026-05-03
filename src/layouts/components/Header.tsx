import { UserMenu } from './UserMenu'

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-2 md:hidden">
        <span className="text-lg font-semibold">AutoCore</span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <UserMenu />
      </div>
    </header>
  )
}
