import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface FadeInSectionProps {
  children: ReactNode
  delay?: number
}

export const FadeInSection = ({ children, delay = 0 }: FadeInSectionProps) => {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: shouldReduceMotion ? 0.2 : 0.4,
        delay: shouldReduceMotion ? 0 : delay,
        ease: 'easeOut'
      }}
    >
      {children}
    </motion.div>
  )
}
