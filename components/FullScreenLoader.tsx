"use client"
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// Advanced Full Screen Loader with Coin Flip Animation
export default function FullScreenLoader() {
    const [progress, setProgress] = useState(0)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval)
                    return 100
                }
                return prev + Math.random() * 15 // Faster increment
            })
        }, 30) // Faster interval
        return () => clearInterval(interval)
    }, [])

    if (!mounted) return null

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white/90 backdrop-blur-xl">
            <style jsx>{`
                @keyframes coin-flip {
                    0% { transform: rotateY(0deg); }
                    100% { transform: rotateY(360deg); }
                }
                .animate-coin-flip {
                    animation: coin-flip 3s infinite linear;
                    transform-style: preserve-3d;
                }
            `}</style>

            {/* Background Gradient Mesh */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 via-transparent to-blue-50 opacity-50 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center gap-10">
                {/* 3D Coin Logo */}
                <div className="relative w-40 h-40 perspective-[1000px]">
                    <div className="w-full h-full rounded-full shadow-[0_20px_50px_rgba(59,130,246,0.3)] animate-coin-flip bg-white ring-8 ring-white/50 overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/โลโก้เทคนิคบุรีรัมย์.jpg"
                            alt="Logo"
                            className="w-full h-full object-cover p-1"
                        />
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent opacity-0 animate-pulse"></div>
                    </div>
                </div>

                {/* Text Content */}
                <div className="text-center space-y-3">
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter drop-shadow-sm">
                        วิทยาลัยเทคนิคบุรีรัมย์
                    </h1>
                    <div className="flex items-center justify-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce delay-0"></div>
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce delay-150"></div>
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce delay-300"></div>
                        <span className="text-blue-600 font-bold uppercase tracking-widest text-xs">
                            System Loading
                        </span>
                    </div>
                </div>

                {/* Advanced Progress Bar */}
                <div className="w-80 h-1.5 bg-slate-200 rounded-full overflow-hidden relative">
                    <div
                        className="absolute h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.8)] transition-all duration-200 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-10 text-[10px] text-slate-400 font-mono">
                SECURE CONNECTION ESTABLISHED
            </div>
        </div>,
        document.body
    )
}
