import { ReactNode } from 'react';
import { Shield, LogOut, User, Settings, Key } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">TrustGuard AI</h1>
                <p className="text-xs text-slate-400">Deepfake Detection System</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {profile && (
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 rounded-lg">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-white">{profile.full_name || profile.email}</p>
                    {profile.organization && (
                      <p className="text-xs text-slate-400">{profile.organization}</p>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}
