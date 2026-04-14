import { useState } from 'react';
import { Zap, Mail, Lock, LogIn, UserPlus, User, Store, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';

// ─────────── AUTH FORM ───────────
export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'seller' | 'buyer'>('buyer');
  const [loading, setLoading] = useState(false);
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
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { role } } });
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
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/30 active:scale-[0.98] text-sm"
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl text-center"
      >
        <div className="bg-blue-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-600/30">
          <User className="text-white w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black mb-3">Bạn muốn làm gì?</h1>
        <p className="text-gray-500 mb-10">Chọn vai trò để trải nghiệm phù hợp nhất</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { role: 'buyer' as const, icon: Store, title: 'Tôi muốn mua sắm', desc: 'Khám phá hàng nghìn sản phẩm, mua sắm dễ dàng, theo dõi đơn hàng realtime', color: 'blue' },
            { role: 'seller' as const, icon: Store, title: 'Tôi muốn bán hàng', desc: 'Mở gian hàng, quản lý sản phẩm, theo dõi doanh thu và xử lý đơn hàng', color: 'violet' },
          ].map(({ role, icon: Icon, title, desc, color }) => (
            <button
              key={role} onClick={() => handleSelect(role)} disabled={!!loading}
              className={`group relative p-8 rounded-3xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-xl ${
                color === 'blue'
                  ? 'border-blue-100 hover:border-blue-400 hover:bg-blue-50 bg-white'
                  : 'border-violet-100 hover:border-violet-400 hover:bg-violet-50 bg-white'
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all ${
                  color === 'blue'
                    ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-600/30'
                    : 'bg-violet-100 text-violet-600 group-hover:bg-violet-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-violet-600/30'
                }`}
              >
                {loading === role ? <Loader2 className="w-7 h-7 animate-spin" /> : <Icon className="w-7 h-7" />}
              </div>
              <h3 className="text-xl font-black mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
