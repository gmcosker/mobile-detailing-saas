'use client'

import { ReactNode } from 'react'

interface MobilePhoneFrameProps {
  children: ReactNode
}

export default function MobilePhoneFrame({ children }: MobilePhoneFrameProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center p-8 py-12">
      {/* Phone Frame */}
      <div className="relative">
        {/* Phone Bezel/Chassis */}
        <div className="relative bg-black rounded-[3rem] p-2 shadow-2xl">
          {/* Screen Bezel */}
          <div className="bg-gray-900 rounded-[2.5rem] p-1">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10"></div>
            
            {/* Status Bar */}
            <div className="absolute top-2 left-0 right-0 z-20 px-6 pt-1">
              <div className="flex items-center justify-between text-white text-xs font-medium">
                <div className="flex items-center gap-1">
                  <span>9:41</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M17.778 8.222a7.966 7.966 0 01-1.293 9.122 7.966 7.966 0 01-9.122 1.293A7.966 7.966 0 013.222 8.222a7.966 7.966 0 011.293-9.122 7.966 7.966 0 019.122-1.293 7.966 7.966 0 011.293 9.122zM11.707 6.293a1 1 0 00-1.414 0L8 8.586 6.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Screen Content */}
            <div className="bg-white rounded-[2.25rem] overflow-hidden relative" style={{ width: '375px', height: '812px' }}>
              <div className="w-full h-full overflow-y-auto px-2 py-3" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="w-full h-full [&>div]:min-h-0 [&>div]:h-full [&>div]:rounded-none">
                  {children}
                </div>
              </div>
            </div>
            
            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full"></div>
          </div>
        </div>
        
        {/* Phone Shadow */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent rounded-[3rem] pointer-events-none"></div>
      </div>
    </div>
  )
}

