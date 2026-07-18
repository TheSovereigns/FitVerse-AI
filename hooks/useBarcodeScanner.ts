"use client"

import { useState, useEffect, useCallback } from "react"

interface OpenFoodFactsProduct {
  code: string
  product_name: string
  brands: string
  image_url: string
  nutriscore_grade: string
  nutriments: {
    energy_kcal_100g: number
    proteins_100g: number
    carbohydrates_100g: number
    fat_100g: number
    fiber_100g: number
    sugars_100g: number
    salt_100g: number
    saturated_fat_100g: number
  }
  serving_size: string
  categories: string
  ingredients_text: string
}

interface ScannedProduct {
  barcode: string
  name: string
  brand: string
  image: string
  nutriscore: string
  per100g: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    sugars: number
    salt: number
    saturatedFat: number
  }
  servingSize: string
  categories: string
  ingredients: string
  scannedAt: string
}

interface ScanHistoryItem {
  barcode: string
  name: string
  scannedAt: string
  score: number
  image: string
}

const OFF_CACHE_KEY = "off_barcode_cache"

function getCache(): Record<string, OpenFoodFactsProduct> {
  try {
    const cached = localStorage.getItem(OFF_CACHE_KEY)
    return cached ? JSON.parse(cached) : {}
  } catch {
    return {}
  }
}

function setCache(code: string, product: OpenFoodFactsProduct) {
  try {
    const cache = getCache()
    cache[code] = product
    const keys = Object.keys(cache)
    if (keys.length > 200) {
      keys.slice(0, 50).forEach((k) => delete cache[k])
    }
    localStorage.setItem(OFF_CACHE_KEY, JSON.stringify(cache))
  } catch {}
}

export function useBarcodeScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [lastResult, setLastResult] = useState<ScannedProduct | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("barcodeScanHistory")
      if (saved) setScanHistory(JSON.parse(saved))
    } catch {}
  }, [])

  const lookupBarcode = useCallback(async (barcode: string): Promise<ScannedProduct | null> => {
    setError(null)
    setIsScanning(true)

    try {
      const cache = getCache()
      let data: OpenFoodFactsProduct | null = cache[barcode] || null

      if (!data) {
        const res = await fetch(
          `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
          { signal: AbortSignal.timeout(10000) }
        )
        const json = await res.json()

        if (json.status !== 1 || !json.product) {
          setError("Produto nao encontrado na base de dados")
          setIsScanning(false)
          return null
        }

        data = json.product
        setCache(barcode, data!)
      }

      const n = data!.nutriments || {}
      const product: ScannedProduct = {
        barcode,
        name: data!.product_name || "Produto Desconhecido",
        brand: data!.brands || "",
        image: data!.image_url || "",
        nutriscore: data!.nutriscore_grade || "",
        per100g: {
          calories: Math.round(n.energy_kcal_100g || 0),
          protein: Math.round(n.proteins_100g || 0),
          carbs: Math.round(n.carbohydrates_100g || 0),
          fat: Math.round(n.fat_100g || 0),
          fiber: Math.round(n.fiber_100g || 0),
          sugars: Math.round(n.sugars_100g || 0),
          salt: Math.round((n.salt_100g || 0) * 10) / 10,
          saturatedFat: Math.round(n.saturated_fat_100g || 0),
        },
        servingSize: data!.serving_size || "100g",
        categories: data!.categories || "",
        ingredients: data!.ingredients_text || "",
        scannedAt: new Date().toISOString(),
      }

      setLastResult(product)

      const historyItem: ScanHistoryItem = {
        barcode,
        name: product.name,
        scannedAt: product.scannedAt,
        score: calculateScore(product),
        image: product.image,
      }

      setScanHistory((prev) => {
        const updated = [historyItem, ...prev.filter((h) => h.barcode !== barcode)].slice(0, 100)
        localStorage.setItem("barcodeScanHistory", JSON.stringify(updated))
        return updated
      })

      return product
    } catch (e: any) {
      if (e.name === "TimeoutError") {
        setError("Tempo esgotado. Verifique sua internet.")
      } else {
        setError("Erro ao buscar produto")
      }
      return null
    } finally {
      setIsScanning(false)
    }
  }, [])

  const calculateScore = (product: ScannedProduct): number => {
    let score = 50
    const n = product.per100g
    if (n.protein > 10) score += 10
    if (n.fiber > 3) score += 10
    if (n.sugars < 5) score += 10
    if (n.salt < 1) score += 5
    if (n.fat < 10) score += 5
    if (n.sugars > 15) score -= 15
    if (n.salt > 2) score -= 10
    if (n.fat > 20) score -= 10
    const grade = product.nutriscore
    if (grade === "a") score += 15
    else if (grade === "b") score += 8
    else if (grade === "d") score -= 10
    else if (grade === "e") score -= 20
    return Math.max(0, Math.min(100, score))
  }

  const clearHistory = useCallback(() => {
    setScanHistory([])
    localStorage.removeItem("barcodeScanHistory")
  }, [])

  return {
    isScanning,
    lastResult,
    error,
    scanHistory,
    lookupBarcode,
    clearHistory,
    setLastResult,
  }
}
