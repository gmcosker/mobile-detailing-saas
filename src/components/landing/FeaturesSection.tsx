'use client'

import { motion } from 'framer-motion'
import { DollarSign, Shield, FileText } from 'lucide-react'

const features = [
  {
    icon: DollarSign,
    title: "Stop Losing Money",
    highlight: "Automated Reminders & Secure Payments.",
    description: "Stop worrying about no-shows and awkward payment conversations. We send automated reminders to your clients and make it easy to get paid directly in the app."
  },
  {
    icon: Shield,
    title: "Protect Your Business",
    highlight: "Time-Stamped Before-and-After Photos.",
    description: "Never face another dispute over pre-existing damage. Our app lets you take time-stamped photos that are automatically saved to each client's file, giving you undeniable proof of your work."
  },
  {
    icon: FileText,
    title: "Ditch the Paperwork",
    highlight: "Simple, Professional Booking.",
    description: "Get your own custom booking link that shows your real-time availability. Your clients can book and pay in one place, so you can throw away the spreadsheets and messy notes for good."
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
}

export default function FeaturesSection() {
  return (
    <section className="py-24 lg:py-32 relative">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/20 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-8 lg:gap-12"
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className="group relative"
            >
              <div className="card-gradient p-8 lg:p-10 rounded-2xl border border-border/50 shadow-xl hover:border-primary/30 transition-all duration-500 h-full">
                {/* Icon */}
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                
                {/* Title */}
                <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                  {feature.title}
                </h3>
                
                {/* Content */}
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">{feature.highlight}</strong>{' '}
                  {feature.description}
                </p>
              </div>
              
              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}


