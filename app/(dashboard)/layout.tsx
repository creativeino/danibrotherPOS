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
    <div className="flex h-screen overflow-hidden bg-white text-slate-900 font-sans">
      <Sidebar currentUser={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/logodanibro.svg"
              alt="Danibrothers"
              className="h-7 w-auto object-contain hidden sm:block"
            />
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Retail POS & Inventory
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Database Connected
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900">{user.fullName}</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                {user.role}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-200">
              {user.fullName.charAt(0)}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-white p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
