import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ChevronLeft, ChevronRight, GitCompare, Home, Moon, Shuffle, Sun } from 'lucide-react'
import { useState } from 'react'
import { ThemeProvider, useTheme } from '#/context/theme'
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

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { theme, toggle } = useTheme()

  return (
    <aside
      className={`${collapsed ? 'w-14' : 'w-52'} shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col transition-all duration-200 overflow-hidden`}
    >
      <div className="h-[45px] flex items-center border-b border-gray-200 dark:border-gray-700 px-4 overflow-hidden">
        {!collapsed && (
          <span className="font-bold text-gray-900 dark:text-white text-sm tracking-tight whitespace-nowrap">
            Useful Tooling
          </span>
        )}
      </div>

      <nav className="flex-1 p-2 flex flex-col gap-0.5 overflow-hidden">
        {navItems.map(({ to, label, Icon, exact }) => (
          <Link
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors ${collapsed ? 'justify-center px-0' : ''}`}
            activeProps={{
              className: `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ${collapsed ? 'justify-center px-0' : ''}`,
            }}
            activeOptions={exact ? { exact: true } : undefined}
          >
            <Icon size={15} className="shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">{label}</span>}
          </Link>
        ))}
      </nav>

      <div
        className={`p-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-1 ${collapsed ? 'flex-col' : 'justify-between'}`}
      >
        <button
          type="button"
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>
    </aside>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-950">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* prevent dark-mode flash on load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <Layout>{children}</Layout>
        </ThemeProvider>
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[{ name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> }]}
        />
        <Scripts />
      </body>
    </html>
  )
}
