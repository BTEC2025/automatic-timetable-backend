import AppSidebar from '@/components/AppSidebar';

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <AppSidebar role="student" />
            <main className="flex-1 overflow-auto bg-slate-50">
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
