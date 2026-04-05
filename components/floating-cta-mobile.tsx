"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "@/lib/i18n"
import { CTAButton } from "@/components/cta-button"

export function FloatingCTAMobile() {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)
  const [hasReachedBottom, setHasReachedBottom] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // Show after 400px scroll
      setIsVisible(scrollY > 400)

      // Hide when reaching bottom (last 200px)
      setHasReachedBottom(scrollY + windowHeight >= documentHeight - 200)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <AnimatePresence>
      {isVisible && !hasReachedBottom && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden"
        >
          <CTAButton
            label={t("cta_floating")}
            href="/auth/login"
            variant="floating"
            size="md"
            dataCta="floating-mobile"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}