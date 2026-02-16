import { useState } from "react"

export function useAirtablePagination(initialPageSize = 50) {
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(initialPageSize)

  return {
    pageIndex,
    pageSize,
    setPageIndex,
    setPageSize,
  }
}
