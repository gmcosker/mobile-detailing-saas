'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-border/50">
      {/* Pricing link section */}
      <div className="py-8 text-center">
        <Link
          href="/upgrade"
          className="text-muted-foreground hover:text-primary transition-colors duration-300 underline underline-offset-4"
        >
          View Pricing
        </Link>
      </div>
      
      {/* Copyright */}
      <div className="py-6 border-t border-border/30">
        <div className="container mx-auto px-6 text-center">
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} DetailFlow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}


