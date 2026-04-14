import { useState } from 'react';
import { Zap, Mail, Lock, LogIn, UserPlus, User, Store, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';

// ─────────── GOOGLE ICON ───────────
function GoogleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ─────────── AUTH FORM ───────────
export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'seller' | 'buyer'>('buyer');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Mật khẩu phải ít nhất 6 ký tự'); return; }
    setLoading(true); setError(null);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { role } },
        });
        if (error) throw error;
        alert('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.');
      }
    } catch (err: any) {
      const msgs: Record<string, string> = {
        'Invalid login credentials': 'Email hoặc mật khẩu không đúng',
        'User already registered': 'Email này đã được đăng ký',
        'Email not confirmed': 'Vui lòng xác nhận email trước khi đăng nhập',
      };
      setError(msgs[err.message] || err.message);
    } finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
      // Browser will redirect to Google — no further action needed
    } catch (err: any) {
      setError(err.message || 'Không thể đăng nhập bằng Google');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="relative w-full max-w-md bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10 p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-2xl shadow-blue-600/40">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Marketplace Pro</h1>
          <p className="text-blue-200/60 mt-1 text-sm">
            {isLogin ? 'Chào mừng quay lại 👋' : 'Tạo tài khoản mới'}
          </p>
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 disabled:opacity-60 text-gray-800 font-bold py-3.5 rounded-2xl transition-all shadow-lg active:scale-[0.98] text-sm mb-5"
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
          ) : (
            <GoogleIcon className="w-5 h-5" />
          )}
          {googleLoading ? 'Đang chuyển hướng...' : 'Tiếp tục với Google'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs font-medium">hoặc dùng email</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/40" />
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email của bạn"
              className="w-full bg-white/10 border border-white/10 text-white placeholder-white/30 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-sm"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/40" />
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Mật khẩu (tối thiểu 6 ký tự)"
              className="w-full bg-white/10 border border-white/10 text-white placeholder-white/30 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-sm"
            />
          </div>

          {!isLogin && (
            <div className="grid grid-cols-2 gap-3">
              {(['buyer', 'seller'] as const).map(r => (
                <button
                  key={r} type="button" onClick={() => setRole(r)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all text-sm font-bold ${
                    role === r
                      ? 'border-blue-400 bg-blue-500/20 text-blue-200'
                      : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                  }`}
                >
                  {r === 'buyer' ? <User className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                  {r === 'buyer' ? 'Người mua' : 'Người bán'}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-500/15 border border-red-400/30 text-red-200 p-3.5 rounded-2xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <button
            type="submit" disabled={loading || googleLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/30 active:scale-[0.98] text-sm"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isLogin ? (
              <LogIn className="w-5 h-5" />
            ) : (
              <UserPlus className="w-5 h-5" />
            )}
            {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>

        <button
          onClick={() => { setIsLogin(!isLogin); setError(null); }}
          className="mt-5 w-full text-center text-sm text-blue-300/60 hover:text-blue-200 transition-colors"
        >
          {isLogin ? 'Chưa có tài khoản? → Đăng ký miễn phí' : 'Đã có tài khoản? → Đăng nhập'}
        </button>
      </motion.div>
    </div>
  );
}

// ─────────── ROLE SELECTION ───────────
export function RoleSelection({ onSelect }: { onSelect: (r: 'seller' | 'buyer') => void }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelect = async (r: 'seller' | 'buyer') => {
    setLoading(r);
    try {
      const { error } = await supabase.auth.updateUser({ data: { role: r } });
      if (error) throw error;
      onSelect(r);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-2xl text-center"
      >
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-3xl mb-6 shadow-2xl shadow-blue-600/40">
          <Zap className="text-white w-10 h-10" />
        </div>

        <h1 className="text-4xl font-black mb-2 text-white">Bạn muốn làm gì?</h1>
        <p className="text-blue-200/60 mb-10 text-sm">Chọn vai trò để trải nghiệm phù hợp nhất với bạn</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            {
              role: 'buyer' as const,
              icon: User,
              emoji: '🛍️',
              title: 'Tôi muốn mua sắm',
              desc: 'Khám phá hàng nghìn sản phẩm, mua sắm dễ dàng, theo dõi đơn hàng realtime',
              gradient: 'from-blue-600 to-blue-500',
              shadow: 'shadow-blue-600/30',
              ring: 'ring-blue-500/30',
            },
            {
              role: 'seller' as const,
              icon: Store,
              emoji: '🏪',
              title: 'Tôi muốn bán hàng',
              desc: 'Mở gian hàng, quản lý sản phẩm, theo dõi doanh thu và xử lý đơn hàng',
              gradient: 'from-violet-600 to-violet-500',
              shadow: 'shadow-violet-600/30',
              ring: 'ring-violet-500/30',
            },
          ].map(({ role, icon: Icon, emoji, title, desc, gradient, shadow, ring }) => (
            <button
              key={role}
              onClick={() => handleSelect(role)}
              disabled={!!loading}
              className={`group relative p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm text-left transition-all hover:scale-[1.02] active:scale-[0.98] hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:${shadow} disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {/* Icon circle */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-lg ${shadow} transition-transform group-hover:scale-110`}>
                {loading === role ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <span className="text-3xl">{emoji}</span>
                )}
              </div>

              <h3 className="text-xl font-black mb-2 text-white">{title}</h3>
              <p className="text-blue-200/50 text-sm leading-relaxed">{desc}</p>

              <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>

        <p className="mt-8 text-blue-200/30 text-xs">
          Bạn có thể thay đổi vai trò sau bằng cách liên hệ hỗ trợ
        </p>
      </motion.div>
    </div>
  );
}
