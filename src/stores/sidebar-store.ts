import { create } from 'zustand'

const SIDEBAR_COOKIE_NAME = 'sidebar_state'
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

interface SidebarState {
  open: boolean
  openMobile: boolean
  isMobile: boolean
  onOpenChange?: (open: boolean) => void
}

interface SidebarActions {
  setIsMobile: (isMobile: boolean) => void
  setOnOpenChange: (onOpenChange?: (open: boolean) => void) => void
  setOpen: (value: boolean | ((prev: boolean) => boolean)) => void
  setOpenMobile: (value: boolean | ((prev: boolean) => boolean)) => void
  toggleSidebar: () => void
}

type SidebarStore = SidebarState & SidebarActions

function persistSidebarCookie(open: boolean) {
  if (typeof document === 'undefined')
    return
  document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
}

export const useSidebarStore = create<SidebarStore>((set, get) => ({
  open: true,
  openMobile: false,
  isMobile: false,
  onOpenChange: undefined,

  setIsMobile: isMobile => set({ isMobile }),

  setOnOpenChange: onOpenChange => set({ onOpenChange }),

  setOpen: (value) => {
    const current = get().open
    const next = typeof value === 'function' ? value(current) : value
    get().onOpenChange?.(next)
    set({ open: next })
    persistSidebarCookie(next)
  },

  setOpenMobile: (value) => {
    const current = get().openMobile
    const next = typeof value === 'function' ? value(current) : value
    set({ openMobile: next })
  },

  toggleSidebar: () => {
    const { isMobile, open, openMobile } = get()
    if (isMobile) {
      set({ openMobile: !openMobile })
      return
    }

    const next = !open
    get().onOpenChange?.(next)
    set({ open: next })
    persistSidebarCookie(next)
  },
}))
