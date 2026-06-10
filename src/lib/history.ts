export type TxType = 'swap' | 'supply' | 'borrow' | 'stake' | 'unstake'
export type TxStatus = 'success' | 'error' | 'pending'

export interface TxRecord {
  id: string
  type: TxType
  status: TxStatus
  tokenIn?: string
  tokenOut?: string
  amountIn: string
  amountOut?: string
  timestamp: number
  txHash?: string
  explorerUrl?: string
}

const KEY = 'arc-defi-history'

export function loadHistory(): TxRecord[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch { return [] }
}

export function addHistory(tx: Omit<TxRecord, 'id' | 'timestamp'>) {
  const history = loadHistory()
  const record: TxRecord = { ...tx, id: Date.now().toString(), timestamp: Date.now() }
  localStorage.setItem(KEY, JSON.stringify([record, ...history].slice(0, 50)))
  return record
}

export function clearHistory() {
  localStorage.removeItem(KEY)
}
