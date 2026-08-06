import { useLocalStorageState } from '@/hooks/useLocalStorageState'

interface WidgetLayoutState {
  order: string[]
  collapsed: string[]
}

export function useDashboardWidgets(storageKey: string, defaultOrder: string[]) {
  const [state, setState] = useLocalStorageState<WidgetLayoutState>(storageKey, { order: defaultOrder, collapsed: [] })

  const order = state.order.filter((id) => defaultOrder.includes(id))
  const missing = defaultOrder.filter((id) => !order.includes(id))
  const resolvedOrder = [...order, ...missing]

  function isCollapsed(id: string) {
    return state.collapsed.includes(id)
  }

  function toggleCollapse(id: string) {
    setState((prev) => ({
      ...prev,
      collapsed: prev.collapsed.includes(id) ? prev.collapsed.filter((c) => c !== id) : [...prev.collapsed, id],
    }))
  }

  function move(id: string, direction: -1 | 1) {
    setState((prev) => {
      const current = prev.order.filter((i) => defaultOrder.includes(i))
      const withMissing = [...current, ...defaultOrder.filter((i) => !current.includes(i))]
      const index = withMissing.indexOf(id)
      const swapWith = index + direction
      if (swapWith < 0 || swapWith >= withMissing.length) return prev
      const next = [...withMissing]
      ;[next[index], next[swapWith]] = [next[swapWith], next[index]]
      return { ...prev, order: next }
    })
  }

  function reset() {
    setState({ order: defaultOrder, collapsed: [] })
  }

  return {
    order: resolvedOrder,
    isCollapsed,
    toggleCollapse,
    moveUp: (id: string) => move(id, -1),
    moveDown: (id: string) => move(id, 1),
    reset,
  }
}
