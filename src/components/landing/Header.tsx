'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export default function Header() {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="py-4 px-6 md:px-12 fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-xl z-50 border-b border-border/50"
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">DF</span>
          </div>
          <span className="text-xl font-bold text-foreground">DetailFlow</span>
        </Link>
        <Button variant="nav" size="default" asChild>
          <Link href="/login">Get Started Free</Link>
        </Button>
      </div>
    </motion.header>
  )
}


