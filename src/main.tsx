import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { scan } from 'react-scan'
import { ThemeProvider } from '@/components/theme-provider'
import AppRoutes from './App'
import './index.css'

const queryClient = new QueryClient()

declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__:
    import('@tanstack/react-query').QueryClient
  }
}

// This code is for all users
window.__TANSTACK_QUERY_CLIENT__ = queryClient

scan({
  enabled: true,
})
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
