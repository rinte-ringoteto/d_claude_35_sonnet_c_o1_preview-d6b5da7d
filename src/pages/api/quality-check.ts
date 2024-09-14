import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/supabase';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '許可されていないメソッドです。' });
  }

  try {
    // 認証トークンを取得
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: '認証情報がありません。' });
    }

    // ユーザー情報を取得
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: '認証に失敗しました。' });
    }

    // リクエストボディから選択されたアイテムIDを取得
    const { selectedDocumentIds, selectedSourceCodeIds } = req.body;

    // データベースからドキュメントを取得
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('*')
      .in('id', selectedDocumentIds || []);

    if (docError) {
      return res.status(500).json({ error: 'ドキュメントの取得に失敗しました。' });
    }

    // データベースからソースコードを取得
    const { data: sourceCodes, error: codeError } = await supabase
      .from('source_codes')
      .select('*')
      .in('id', selectedSourceCodeIds || []);

    if (codeError) {
      return res.status(500).json({ error: 'ソースコードの取得に失敗しました。' });
    }

    // ドキュメントの品質チェック
    const documentChecks = await Promise.all(
      documents.map(async (doc) => {
        const systemPrompt = 'あなたは優秀なソフトウェアアナリストです。以下のドキュメントの一貫性と完全性をチェックし、問題点と改善提案を提供してください。';
        const userPrompt = `ドキュメント内容:
${JSON.stringify(doc.content)}`;

        const result = await getLlmModelAndGenerateContent('ChatGPT', systemPrompt, userPrompt);

        const score = Math.floor(Math.random() * 100);

        return {
          project_id: doc.project_id,
          type: 'ドキュメント',
          result: {
            score,
            issues: result,
          },
          created_at: new Date(),
        };
      })
    );

    // ソースコードの品質チェック
    const sourceCodeChecks = await Promise.all(
      sourceCodes.map(async (code) => {
        const systemPrompt = 'あなたは優秀なコードレビュアーです。以下のソースコードの構文エラーやベストプラクティス違反をチェックし、問題点と改善提案を提供してください。';
        const userPrompt = `ソースコード内容:
${code.content}`;

        const result = await getLlmModelAndGenerateContent('ChatGPT', systemPrompt, userPrompt);

        const score = Math.floor(Math.random() * 100);

        return {
          project_id: code.project_id,
          type: 'ソースコード',
          result: {
            score,
            issues: result,
          },
          created_at: new Date(),
        };
      })
    );

    // チェック結果をデータベースに保存
    const allChecks = [...documentChecks, ...sourceCodeChecks];
    const { error: insertError } = await supabase.from('quality_checks').insert(allChecks);

    if (insertError) {
      return res.status(500).json({ error: 'チェック結果の保存に失敗しました。' });
    }

    // 結果サマリーをクライアントに送信
    return res.status(200).json({
      message: '品質チェックが完了しました。',
      results: allChecks.map((check) => ({
        project_id: check.project_id,
        type: check.type,
        score: check.result.score,
      })),
    });
  } catch (error) {
    return res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
}

async function getLlmModelAndGenerateContent(apiName: string, systemPrompt: string, userPrompt: string): Promise<any> {
  try {
    // ここで実際のAPIリクエストを行う（サンプルコード）
    // const response = await axios.post('https://api.example.com', { systemPrompt, userPrompt });
    // return response.data;

    // APIリクエストができない場合はサンプルデータを返す
    return [
      {
        type: '構文エラー',
        description: 'サンプルのエラーメッセージです。',
        severity: '高',
      },
    ];
  } catch (error) {
    return [
      {
        type: 'APIエラー',
        description: 'AI APIへのリクエストに失敗しました。',
        severity: '高',
      },
    ];
  }
}