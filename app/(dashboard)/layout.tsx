import { getCurrentUser } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50 text-slate-900 font-sans">
      <Sidebar currentUser={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <img
              src="/logodanibro.svg"
              alt="Danibrothers"
              className="h-7 w-auto object-contain hidden sm:block"
            />
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                Retail POS & Inventory
              </span>
            </div>
            <span className="text-slate-200 hidden sm:inline">|</span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-full border border-emerald-200/60 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Database Connected
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">{user.fullName}</p>
              <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">
                {user.role}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs border-2 border-white ring-1 ring-slate-200">
              {user.fullName.charAt(0)}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/40 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
