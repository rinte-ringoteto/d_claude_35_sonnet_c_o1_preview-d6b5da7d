typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/supabase';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { getLlmModelAndGenerateContent } from '@/utils/functions';

export const config = {
  api: {
    bodyParser: false,
  },
};

type Data = {
  message?: string;
  error?: string;
  filePath?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: '許可されていないメソッドです。' });
    return;
  }

  // ユーザーの認証を確認
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    res.status(401).json({ error: '認証情報がありません。' });
    return;
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    res.status(401).json({ error: '認証に失敗しました。' });
    return;
  }

  // マルチパートフォームデータを解析
  const form = new formidable.IncomingForm();
  form.multiples = false;
  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: 'フォームデータの解析に失敗しました。' });
      return;
    }

    const file = files.file;

    if (!file) {
      res.status(400).json({ error: 'ファイルが送信されていません。' });
      return;
    }

    // ファイルの種類とサイズを検証
    const allowedTypes = ['application/pdf', 'text/plain'];
    // @ts-ignore
    if (!allowedTypes.includes(file.mimetype)) {
      res.status(400).json({ error: 'テキストまたはPDFファイルを選択してください。' });
      return;
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    // @ts-ignore
    if (file.size > MAX_FILE_SIZE) {
      res.status(400).json({ error: 'ファイルサイズが大きすぎます。10MB以下のファイルをアップロードしてください。' });
      return;
    }

    // 一時的なストレージにファイルを保存
    const tempDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    // @ts-ignore
    const tempFilePath = path.join(tempDir, file.newFilename);

    // @ts-ignore
    fs.copyFile(file.filepath, tempFilePath, async (err) => {
      if (err) {
        res.status(500).json({ error: 'ファイルの保存に失敗しました。' });
        return;
      }

      // 保存されたファイルのパスをデータベースに記録
      const { data, error } = await supabase
        .from('uploaded_files')
        .insert([
          {
            user_id: user.id,
            file_path: tempFilePath,
            file_name: file.originalFilename,
            uploaded_at: new Date(),
          },
        ])
        .select();

      if (error) {
        res.status(500).json({ error: 'データベースへの保存に失敗しました。' });
        return;
      }

      // ファイルの保存場所情報をクライアントに返す
      res.status(200).json({ message: 'ファイルのアップロードに成功しました。', filePath: tempFilePath });
    });
  });
}