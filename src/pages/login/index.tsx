typescript
import { useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '@/supabase';
import Topbar from '@/components/Topbar';
import { AiOutlineMail, AiOutlineLock } from 'react-icons/ai';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('ログインに失敗しました。メールアドレスとパスワードをご確認ください。');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('パスワードリセットにはメールアドレスが必要です。');
      return;
    }
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setError('パスワードリセットのリクエストに失敗しました。');
    } else {
      setError('パスワードリセット用のリンクをメールに送信しました。');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen h-full flex flex-col">
      <Topbar />
      <div className="flex flex-1">
        <div
          className="hidden md:block w-1/2 bg-cover bg-center"
          style={{ backgroundImage: "url('https://placehold.co/600x800?text=Login+Image')" }}
        ></div>
        <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-100">
          <div className="max-w-md w-full bg-white p-8 rounded shadow-lg">
            <h2 className="text-2xl font-bold text-center mb-6">ログイン</h2>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 mb-2">
                  メールアドレス
                </label>
                <div className="flex items-center border-b-2 border-gray-300 focus-within:border-blue-500">
                  <AiOutlineMail className="text-gray-500 mr-2" size={24} />
                  <input
                    type="email"
                    id="email"
                    className="w-full p-2 outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label htmlFor="password" className="block text-gray-700 mb-2">
                  パスワード
                </label>
                <div className="flex items-center border-b-2 border-gray-300 focus-within:border-blue-500">
                  <AiOutlineLock className="text-gray-500 mr-2" size={24} />
                  <input
                    type="password"
                    id="password"
                    className="w-full p-2 outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-300"
                disabled={loading}
              >
                {loading ? 'ログイン中...' : 'ログイン'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button
                className="text-blue-500 hover:underline"
                onClick={handlePasswordReset}
                disabled={loading}
              >
                パスワードをお忘れですか？
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}