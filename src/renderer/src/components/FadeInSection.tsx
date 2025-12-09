import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface FadeInSectionProps {
  children: ReactNode
  delay?: number
}

export const FadeInSection = ({ children, delay = 0 }: FadeInSectionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.8,
        delay: delay,
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      {children}
    </motion.div>
  )
}
