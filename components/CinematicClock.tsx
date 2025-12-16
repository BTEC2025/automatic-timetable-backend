'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface CinematicClockProps {
    variant?: 'default' | 'card';
}

export default function CinematicClock({ variant = 'default' }: CinematicClockProps) {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    if (!time) return null; // Prevent hydration mismatch

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatSeconds = (date: Date) => {
        return date.getSeconds().toString().padStart(2, '0');
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Style Configuration based on variant
    const isCard = variant === 'card';
    const containerClasses = isCard
        ? "bg-slate-900 shadow-xl rounded-2xl px-6 py-3 border border-slate-800 flex flex-col items-end"
        : "flex flex-col items-end pointer-events-none select-none z-50";

    // In card mode, force white text (ignore Light Mode completely for inner content)
    // In default mode, use adaptive colors
    const timeColorClass = isCard
        ? "text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
        : "text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-600 dark:from-white dark:to-white/60 drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]";

    const secondsColorClass = isCard
        ? "text-blue-400/80"
        : "text-blue-600 dark:text-blue-400/80";

    const dateColorClass = isCard
        ? "text-blue-200/60"
        : "text-slate-500 dark:text-blue-200/60";

    return (
        <div className={containerClasses}>
            <div className="flex items-baseline gap-2">
                <span className={cn("text-5xl md:text-6xl font-bold font-mono tracking-tighter", timeColorClass)}>
                    {formatTime(time)}
                </span>
                <span className={cn("text-xl md:text-2xl font-mono font-medium", secondsColorClass)}>
                    {formatSeconds(time)}
                </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
                <div className="h-[1px] w-8 bg-blue-500/50"></div>
                <p className={cn("text-sm md:text-base uppercase tracking-[0.2em] font-medium", dateColorClass)}>
                    {formatDate(time)}
                </p>
            </div>
        </div>
    );
}
