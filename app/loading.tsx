import Image from 'next/image';

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-slate-900 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse-slow"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center">
                {/* Logo with Ripple */}
                <div className="relative mb-12">
                    <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-[pulse-ring_3s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
                    <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-[pulse-ring_3s_cubic-bezier(0.4,0,0.6,1)_infinite_1.5s]"></div>

                    <div className="relative w-40 h-40 bg-white/10 backdrop-blur-md rounded-full shadow-2xl border border-white/20 flex items-center justify-center p-6">
                        <div className="relative w-full h-full animate-float">
                            <Image
                                src="/โลโก้เทคนิคบุรีรัมย์.jpg"
                                alt="Buriram Technical College Logo"
                                fill
                                className="object-contain drop-shadow-xl"
                                priority
                            />
                        </div>
                    </div>
                </div>

                {/* Text and Loader */}
                <div className="flex flex-col items-center space-y-6 animate-slide-up">
                    <div className="text-center space-y-1">
                        <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">
                            Automatic Timetable
                        </h2>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                            Buriram Technical College
                        </p>
                    </div>

                    {/* Shimmer Progress Bar */}
                    <div className="h-1.5 w-64 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </div>

                    <p className="text-xs text-slate-400 font-medium">Developed by Competition Team</p>
                </div>
            </div>
        </div>
    );
}
