'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Clock, MapPin, BookOpen, User, Calendar, Sparkles } from 'lucide-react';

interface ScheduleItem {
    _id: string;
    startTime: string; // "HH:mm"
    endTime: string;
    subject: string;
    room: string;
    teacherId?: { name: string };
    studentGroup?: string;
}

export default function LiveSchedule({ initialSchedule }: { initialSchedule: ScheduleItem[] }) {
    const [now, setNow] = useState<Date | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setNow(new Date());
        setMounted(true);
        const timer = setInterval(() => setNow(new Date()), 1000 * 60);
        return () => clearInterval(timer);
    }, []);

    if (!mounted || !now) return null;

    const parseTime = (timeStr: string) => {
        const d = new Date();
        const [hours, minutes] = timeStr.split(':');
        d.setHours(parseInt(hours), parseInt(minutes), 0);
        return d;
    };

    const currentTime = now.getTime();

    const currentClass = initialSchedule.find(s => {
        const start = parseTime(s.startTime).getTime();
        const end = parseTime(s.endTime).getTime();
        return currentTime >= start && currentTime < end;
    });

    const nextClass = initialSchedule.find(s => {
        const start = parseTime(s.startTime).getTime();
        return start > currentTime;
    });

    return (
        <div className="space-y-8 animate-fade-in text-slate-900 dark:text-white">
            {/* Header Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CURRENTLY HAPPENING CARD */}
                <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 shadow-2xl border border-blue-200 dark:border-blue-900 group hover:shadow-blue-500/20 transition-all duration-500">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock className="w-48 h-48 -mr-10 -mt-10" />
                    </div>
                    {/* Animated Gradient Background on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/5 group-hover:to-cyan-500/5 transition-all duration-500"></div>

                    <div className="relative p-8 z-10">
                        <h2 className="text-xs font-bold text-blue-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            Happening Now
                        </h2>

                        {currentClass ? (
                            <div className="space-y-6">
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 leading-tight mb-2">
                                        {currentClass.subject}
                                    </h1>
                                    <div className="flex items-center gap-2 text-xl text-slate-500 dark:text-slate-400 font-medium">
                                        <Clock className="w-5 h-5 text-blue-500" />
                                        {currentClass.startTime} - {currentClass.endTime}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-2xl font-bold border border-blue-100 dark:border-blue-800">
                                        <MapPin className="w-4 h-4" />
                                        {currentClass.room}
                                    </div>
                                    {currentClass.teacherId && (
                                        <div className="flex items-center gap-2 px-5 py-2.5 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-2xl font-bold border border-sky-100 dark:border-sky-800">
                                            <User className="w-4 h-4" />
                                            {typeof currentClass.teacherId === 'object' ? currentClass.teacherId.name : 'Unknown Teacher'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-2">
                                    <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-400 dark:text-slate-500">Free Time</p>
                                    <p className="text-slate-400/80 text-sm">No class in session right now.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* UP NEXT CARD */}
                <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 text-white shadow-2xl border border-slate-700 group hover:shadow-purple-500/20 transition-all duration-500">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <BookOpen className="w-48 h-48 -mr-10 -mt-10 text-indigo-400" />
                    </div>

                    <div className="relative p-8 z-10">
                        <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Up Next
                        </h2>

                        {nextClass ? (
                            <div className="space-y-6">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-2">
                                        {nextClass.subject}
                                    </h1>
                                    <p className="text-lg text-indigo-200/80 font-medium">Starts at {nextClass.startTime}</p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-2xl font-bold backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors">
                                        <MapPin className="w-4 h-4" />
                                        {nextClass.room}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="p-4 bg-white/5 rounded-full mb-2">
                                    <Calendar className="w-8 h-8 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-500">All Done Today</p>
                                    <p className="text-slate-600 text-sm">See you tomorrow!</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* TIMELINE VISUALIZER - Anime Tech Style */}
            <div className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-3">
                        <span className="w-1.5 h-8 bg-blue-600 rounded-full"></span>
                        Today's Timeline
                    </h3>
                    <div className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                        LIVE SYNC ACTIVE
                    </div>
                </div>

                <div className="relative h-64 w-full bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm overflow-hidden flex items-center">

                    {/* Grid Lines */}
                    <div className="absolute inset-0 z-0 opacity-30 pointer-events-none bg-[linear-gradient(90deg,transparent_49px,rgba(0,0,0,0.05)_50px)] dark:bg-[linear-gradient(90deg,transparent_49px,rgba(255,255,255,0.05)_50px)] bg-[length:50px_100%]"></div>

                    {/* Time Markers */}
                    {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(hour => (
                        <div key={hour} className="absolute h-full border-l border-slate-300/30 dark:border-slate-600/30 text-[10px] font-mono font-bold text-slate-400 pl-1.5 pt-2 z-0"
                            style={{ left: `${(hour - 8) * 10}%` }}>
                            {hour}:00
                        </div>
                    ))}

                    {/* Classes */}
                    {initialSchedule.map((item) => {
                        const startHour = parseInt(item.startTime.split(':')[0]) + parseInt(item.startTime.split(':')[1]) / 60;
                        const endHour = parseInt(item.endTime.split(':')[0]) + parseInt(item.endTime.split(':')[1]) / 60;
                        const duration = endHour - startHour;

                        const left = (startHour - 8) * 10;
                        const width = duration * 10;

                        const isNow = currentClass?._id === item._id;

                        return (
                            <div
                                key={item._id}
                                className={cn(
                                    "absolute top-12 bottom-4 rounded-xl flex flex-col p-4 shadow-sm transition-all duration-500 hover:scale-105 cursor-pointer z-10 overflow-hidden group border",
                                    isNow
                                        ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-2xl shadow-blue-500/40 border-blue-400 z-20 ring-4 ring-blue-500/10"
                                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-gray-200 border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-1"
                                )}
                                style={{ left: `${left}%`, width: `${width}%` }}
                                title={`${item.subject} (${item.room})`}
                            >
                                {/* Anime Shine Effect on Hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1s_ease-in-out_infinite]"></div>

                                <div className="flex justify-between items-start mb-1 relative z-10">
                                    <div className={cn(
                                        "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider",
                                        isNow ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-900 text-slate-500"
                                    )}>
                                        {item.room}
                                    </div>
                                    {isNow && <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" />}
                                </div>

                                <h3 className={cn("text-sm md:text-base font-bold leading-tight line-clamp-2 relative z-10", isNow ? "text-white" : "text-slate-800 dark:text-white")}>
                                    {item.subject}
                                </h3>

                                <div className="mt-auto relative z-10">
                                    <p className={cn("text-[10px] font-medium opacity-80", isNow ? "text-blue-100" : "text-slate-500 dark:text-slate-400")}>
                                        {item.startTime} - {item.endTime}
                                    </p>
                                </div>
                            </div>
                        );
                    })}

                    {/* Current Time Indicator - Anime Style Laser Line */}
                    {(() => {
                        const currentHour = now.getHours() + now.getMinutes() / 60;
                        if (currentHour >= 8 && currentHour <= 18) {
                            return (
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none transition-all duration-[60000ms] linear shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                                    style={{ left: `${(currentHour - 8) * 10}%` }}
                                >
                                    <div className="absolute top-0 -ml-[5px] w-3 h-3 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,1)] animate-ping"></div>
                                    <div className="absolute top-0 -ml-[5px] w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-md"></div>

                                    <div className="absolute bottom-0 -ml-[5px] w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-md"></div>
                                </div>
                            )
                        }
                        return null;
                    })()}
                </div>
            </div>
        </div>
    )
}
