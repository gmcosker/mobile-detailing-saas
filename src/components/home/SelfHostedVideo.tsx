'use client'

import { useEffect, useRef } from 'react'

interface SelfHostedVideoProps {
  videoSrc: string
  className?: string
}

export default function SelfHostedVideo({ videoSrc, className = '' }: SelfHostedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Set video properties
    video.muted = true
    video.loop = true
    video.playsInline = true
    video.autoplay = true

    // Ensure video plays
    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log('Autoplay prevented:', error)
      })
    }

    // Handle video end to restart seamlessly
    const handleEnded = () => {
      video.currentTime = 0
      video.play()
    }

    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  return (
    <video
      ref={videoRef}
      src={videoSrc}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        pointerEvents: 'none',
        userSelect: 'none'
      }}
      playsInline
      muted
      loop
      autoPlay
    />
  )
}

