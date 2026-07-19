"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  fallback?: string
  width?: number
  height?: number
}

export function LazyImage({ src, alt, className, fallback = "/placeholder.svg", width, height }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: "100px" }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden", className)}>
      {isInView ? (
        <img
          src={hasError ? fallback : src}
          alt={alt}
          width={width}
          height={height}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      ) : null}
      {(!isLoaded || !isInView) && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
    </div>
  )
}
