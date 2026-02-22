import { useEffect, useState } from 'react'

let toastTimeout: ReturnType<typeof setTimeout> | null = null
let setGlobalToast: ((msg: string | null) => void) | null = null

export function showToast(msg: string) {
  if (setGlobalToast) {
    setGlobalToast(msg)
    if (toastTimeout) clearTimeout(toastTimeout)
    toastTimeout = setTimeout(() => setGlobalToast?.(null), 2500)
  }
}

export function Toast() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setGlobalToast = setMessage
    return () => { setGlobalToast = null }
  }, [])

  if (!message) return null

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-duke text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-lg animate-node-in">
      {message}
    </div>
  )
}
