import type { Metadata } from 'next';
import { Shield, Server, Zap } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Authentication | Automatic Timetable',
    description: 'Login to your account',
};

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen w-full lg:grid lg:grid-cols-2 relative bg-white overflow-hidden">

            {/* --- LEFT SIDE: BRANDING PANEL (Hidden on mobile) --- */}
            <div className="hidden lg:flex flex-col relative overflow-hidden bg-[#0f172a] text-white p-12 lg:p-16 justify-between">

                {/* Background Effects */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-blue-900/40 to-slate-900 z-0"></div>
                <div className="absolute top-[-20%] right-[-20%] w-[40vw] h-[40vw] bg-blue-500/10 rounded-full blur-[100px] animate-pulse-slow"></div>

                {/* Content Z-Index */}
                <div className="relative z-10 flex flex-col h-full justify-between">
                    {/* Header Logo */}
                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-black/20 ring-4 ring-white/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/โลโก้เทคนิคบุรีรัมย์.jpg"
                                alt="วิทยาลัยเทคนิคบุรีรัมย์"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <span className="text-lg text-white block font-semibold tracking-wide shadow-black/10 drop-shadow-sm">จัดทำโดยทีมวิทยาลัยเทคนิคบุรีรัมย์</span>
                        </div>
                    </div>

                    {/* Main Headline */}
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
                            <Zap className="w-4 h-4 text-blue-400 fill-blue-400" />
                            <span className="text-xs font-semibold text-blue-200 tracking-wider">ระบบ AI อัจฉริยะ</span>
                        </div>
                        <h1 className="text-5xl xl:text-6xl font-bold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
                            ยินดีต้อนรับสู่ <br />
                            <span className="text-blue-500">Digital Campus</span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-md leading-relaxed">
                            ระบบสารสนเทศเพื่อการบริหารจัดการสถานศึกษาที่ทันสมัย เชื่อมโยงข้อมูลการเรียนการสอนแบบ Real-time เพื่อยกระดับคุณภาพการศึกษาไทยสู่มาตรฐานสากล
                        </p>

                        {/* Feature Badges */}
                        <div className="flex gap-4 pt-4">
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <Shield className="w-8 h-8 text-blue-400" />
                                <div>
                                    <div className="text-sm font-bold">เข้าถึงปลอดภัย</div>
                                    <div className="text-xs text-slate-500">มาตรฐาน SSL</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <Server className="w-8 h-8 text-indigo-400" />
                                <div>
                                    <div className="text-sm font-bold">ข้อมูลเรียลไทม์</div>
                                    <div className="text-xs text-slate-500">เชื่อมต่อ Cloud</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Copyright */}
                    <div className="text-xs text-slate-600 font-medium">
                        © 2025 ระบบตารางสอนอัตโนมัติ. สงวนลิขสิทธิ์.
                    </div>
                </div>
            </div>

            {/* --- RIGHT SIDE: LOGIN FORM --- */}
            <div className="relative flex flex-col items-center justify-center p-6 bg-slate-50/50 lg:bg-white text-slate-900">

                {/* Background Pattern - Dot Grid */}
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-70"></div>
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:60px_60px] opacity-30"></div>

                {/* Subtle Decorative Gradient */}
                <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[80px] animate-pulse-slow pointer-events-none"></div>
                <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[80px] animate-pulse-slow pointer-events-none animation-delay-2000"></div>

                {/* Login Content Wrapper - Card Style */}
                <div className="relative w-full max-w-[480px] p-8 md:p-12 space-y-8 animate-slide-up bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5">
                    {children}
                </div>
            </div>
        </div>
    );
}
