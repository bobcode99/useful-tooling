import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { GitCompare, Home, Shuffle } from 'lucide-react'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Useful Tooling' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

const navItems = [
  { to: '/' as const, label: 'Home', Icon: Home, exact: true },
  { to: '/json-diff' as const, label: 'JSON Diff', Icon: GitCompare, exact: false },
  { to: '/random' as const, label: 'Random Number', Icon: Shuffle, exact: false },
]

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="flex h-screen overflow-hidden bg-white">
        <aside className="w-52 shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200">
            <span className="font-bold text-gray-900 text-sm tracking-tight">Useful Tooling</span>
          </div>
          <nav className="flex-1 p-3 flex flex-col gap-0.5">
            {navItems.map(({ to, label, Icon, exact }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                activeProps={{
                  className:
                    'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm bg-blue-50 text-blue-700 font-medium',
                }}
                activeOptions={exact ? { exact: true } : undefined}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 overflow-auto">{children}</main>
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[{ name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> }]}
        />
        <Scripts />
      </body>
    </html>
  )
}
