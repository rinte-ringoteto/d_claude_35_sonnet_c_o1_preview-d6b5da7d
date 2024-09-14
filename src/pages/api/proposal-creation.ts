typescript
import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/supabase';
import axios from 'axios';
import { getLlmModelAndGenerateContent } from '@/utils/functions';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: '許可されていないメソッドです。' });
    return;
  }

  const アクセストークン = req.headers['authorization']?.split(' ')[1];

  if (!アクセストークン) {
    res.status(401).json({ error: '認証情報がありません。' });
    return;
  }

  const { data: { user: ユーザー }, error: ユーザーエラー } = await supabase.auth.getUser(アクセストークン);

  if (ユーザーエラー || !ユーザー) {
    res.status(401).json({ error: 'ユーザー情報の取得に失敗しました。' });
    return;
  }

  const { projectId: プロジェクトID, templateId: テンプレートID } = req.body;

  if (!プロジェクトID || !テンプレートID) {
    res.status(400).json({ error: 'プロジェクトIDとテンプレートIDが必要です。' });
    return;
  }

  try {
    const { data: プロジェクトデータ, error: プロジェクトエラー } = await supabase
      .from('projects')
      .select('*')
      .eq('id', プロジェクトID)
      .single();

    if (プロジェクトエラー || !プロジェクトデータ) {
      throw new Error('プロジェクト情報の取得に失敗しました。');
    }

    const { data: ドキュメントデータ, error: ドキュメントエラー } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', プロジェクトID);

    if (ドキュメントエラー || !ドキュメントデータ) {
      throw new Error('関連ドキュメントの取得に失敗しました。');
    }

    const { data: テンプレートデータ, error: テンプレートエラー } = await supabase
      .from('templates')
      .select('*')
      .eq('id', テンプレートID)
      .single();

    if (テンプレートエラー || !テンプレートデータ) {
      throw new Error('テンプレートの取得に失敗しました。');
    }

    const ドキュメント内容 = ドキュメントデータ.map((doc) => doc.content).join('
');

    const システムプロンプト = 'あなたは有能なビジネスアナリストです。以下のドキュメントから重要な情報を抽出してください。';
    const ユーザープロンプト = `プロジェクト名: ${プロジェクトデータ.name}

ドキュメント内容:
${ドキュメント内容}

抽出された重要情報:`;
    const API名 = 'ChatGPT';

    let 抽出された情報: string;

    try {
      抽出された情報 = await getLlmModelAndGenerateContent(API名, システムプロンプト, ユーザープロンプト);
    } catch (aiError) {
      抽出された情報 = 'サンプルの重要情報です。';
    }

    let 提案書コンテンツ = テンプレートデータ.content.replace('{{key_info}}', 抽出された情報);

    const システムプロンプトフォーマット = 'あなたはプロフェッショナルなビジネス文書作成者です。以下の提案書を最適化し、読みやすくフォーマットしてください。';
    const ユーザープロンプトフォーマット = `提案書:
${提案書コンテンツ}

最適化された提案書:`;

    let 最適化されたコンテンツ: string;

    try {
      最適化されたコンテンツ = await getLlmModelAndGenerateContent(API名, システムプロンプトフォーマット, ユーザープロンプトフォーマット);
    } catch (optimizeError) {
      最適化されたコンテンツ = 提案書コンテンツ;
    }

    const { data: 提案書データ, error: 提案書エラー } = await supabase
      .from('proposal_documents')
      .insert([
        {
          project_id: プロジェクトID,
          user_id: ユーザー.id,
          content: 最適化されたコンテンツ,
          created_at: new Date().toISOString(),
        },
      ]);

    if (提案書エラー || !提案書データ) {
      throw new Error('提案資料の保存に失敗しました。');
    }

    const 提案書ID = 提案書データ[0].id;
    const 提案書URL = `/api/proposal/${提案書ID}`;

    res.status(200).json({ proposalUrl: 提案書URL });

  } catch (error: any) {
    res.status(500).json({ error: error.message || 'サーバーエラーが発生しました。' });
  }
}