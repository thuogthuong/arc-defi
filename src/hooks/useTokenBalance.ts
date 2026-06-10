import { useBalance, useAccount } from 'wagmi'
import { TOKENS } from '../lib/config'

// Đọc balance của bất kỳ token nào theo symbol
export function useTokenBalance(symbol: string) {
  const { address } = useAccount()
  const token = TOKENS.find(t => t.symbol === symbol)

  const { data, isLoading, refetch } = useBalance({
    address,
    token: token?.address as `0x${string}` | undefined,
    query: { enabled: !!address && !!token, refetchInterval: 10_000 },
  })

  const raw      = data?.value ?? 0n
  const decimals = data?.decimals ?? token?.decimals ?? 6
  const balance  = Number(raw) / 10 ** decimals

  const formatted = balance.toFixed(2)
  const maxStr    = balance > 0 ? balance.toFixed(6).replace(/\.?0+$/, '') : '0'

  return { balance, formatted, maxStr, isLoading, refetch }
}

// Giữ lại useUSDCBalance để không break import cũ
export function useUSDCBalance() { return useTokenBalance('USDC') }
