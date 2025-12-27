'use client'

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export default function HeroSection() {
  const handleCTAClick = () => {
    window.location.href = 'https://sendfox.com/lp/3l485l'
  }

  return (
    <section className="relative pt-32 pb-20 overflow-hidden min-h-[90vh] flex items-center">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center center' }}
        >
          <source src="/videos/detailing-broll.mp4" type="video/mp4" />
        </video>
        {/* Dark translucent overlay */}
        <div className="absolute inset-0 bg-background/75 backdrop-blur-[2px]" />
      </div>
      
      {/* Gradient glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-glow-pulse pointer-events-none z-[1]" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Content */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight">
              The One App to Run Your Entire{' '}
              <span className="text-gradient">
                Mobile Detailing Business
              </span>
            </h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-lg md:text-xl text-foreground/90 font-medium"
            >
              Tired of chasing down clients, juggling calendars, and dealing with no-shows?
            </motion.p>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4 text-muted-foreground max-w-xl mx-auto"
            >
              Your time is money. Our app handles the chaos of your business so you can focus on what you do best—making cars look incredible.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <Button 
                variant="hero" 
                size="xl"
                onClick={handleCTAClick}
                className="glow-primary"
              >
                Receive Free Guide
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}


