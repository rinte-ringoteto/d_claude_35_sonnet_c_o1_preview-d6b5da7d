typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'このエンドポイントはPOSTメソッドのみを受け付けます。' });
    return;
  }

  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'メールアドレスとパスワードを入力してください。' });
    return;
  }

  try {
    // Supabase認証を使用してユーザーをサインイン
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.user) {
      res.status(401).json({ error: '認証に失敗しました。メールアドレスとパスワードをご確認ください。' });
      return;
    }

    // usersテーブルからユーザー情報を取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', signInData.user.id)
      .single();

    if (userError || !userData) {
      res.status(500).json({ error: 'ユーザー情報の取得に失敗しました。' });
      return;
    }

    // JWTトークンをクライアントに返す
    const access_token = signInData.session?.access_token;

    if (!access_token) {
      res.status(500).json({ error: 'JWTトークンの生成に失敗しました。' });
      return;
    }

    res.status(200).json({
      token: access_token,
      user: userData,
    });
  } catch (err) {
    res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
}