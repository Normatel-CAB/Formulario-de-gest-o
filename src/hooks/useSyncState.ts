import { useEffect, useState } from 'react'
import { subscribeSync, type SyncState } from '../lib/sync'

export function useSyncState() {
  const [state, setState] = useState<SyncState>({ syncing: false, pending: 0, lastSyncAt: null, online: navigator.onLine })

  useEffect(() => {
    return subscribeSync(setState)
  }, [])

  return state
}
