import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/supabase';
import axios from 'axios';
import { getLlmModelAndGenerateContent } from '@/utils/functions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { project_id, start_date, end_date } = req.body;

    if (!project_id || !start_date || !end_date) {
      res.status(400).json({ error: 'プロジェクトID、開始日、終了日を指定してください。' });
      return;
    }

    // ユーザーの認証情報を取得（必要に応じて実装）
    // const { user, error: userError } = await supabase.auth.api.getUserByCookie(req);
    // if (userError || !user) {
    //   res.status(401).json({ error: '認証が必要です。' });
    //   return;
    // }

    // プロジェクト情報を取得
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (projectError || !projectData) {
      res.status(400).json({ error: '無効なプロジェクトIDです。' });
      return;
    }

    // ドキュメントを取得
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', project_id)
      .gte('created_at', start_date)
      .lte('created_at', end_date);

    if (documentsError) {
      res.status(500).json({ error: 'ドキュメントの取得中にエラーが発生しました。' });
      return;
    }

    // ソースコードを取得
    const { data: sourceCodes, error: sourceCodesError } = await supabase
      .from('source_codes')
      .select('*')
      .eq('project_id', project_id)
      .gte('created_at', start_date)
      .lte('created_at', end_date);

    if (sourceCodesError) {
      res.status(500).json({ error: 'ソースコードの取得中にエラーが発生しました。' });
      return;
    }

    // 各フェーズの進捗率を計算（ここではサンプルデータを使用）
    const phases = ['要件定義', '設計', '開発', 'テスト', 'リリース'];
    const phaseProgress = phases.map((phase) => {
      return {
        name: phase,
        progress: Math.floor(Math.random() * 100),
        status: '進行中',
      };
    });

    // 全体の進捗率を算出
    const overallProgress = Math.floor(
      phaseProgress.reduce((sum, phase) => sum + phase.progress, 0) / phases.length
    );

    // 活動ログを作成
    const activities = documents.map(
      (doc) => `${doc.type}ドキュメントが作成されました (${doc.created_at})`
    );
    activities.push(
      ...sourceCodes.map(
        (code) => `ソースコードファイル${code.file_name}が更新されました (${code.updated_at})`
      )
    );

    // 主要な課題や遅延要因を特定（AI APIを使用）
    const userPrompt =
      '以下のプロジェクトの活動ログに基づいて、主要な課題や遅延要因を特定してください。

活動ログ:
' +
      activities.join('
');

    let majorIssues = '';
    try {
      majorIssues = await getLlmModelAndGenerateContent(
        'ChatGPT',
        'あなたはプロジェクトマネージャーです。',
        userPrompt
      );
    } catch (error) {
      majorIssues = '現在のところ、特筆すべき課題や遅延要因はありません。';
    }

    // レポートを生成
    const reportData = {
      overall_progress: overallProgress,
      phases: phaseProgress,
      major_issues: majorIssues,
    };

    // レポートをデータベースに保存
    const { data: reportInsertData, error: reportInsertError } = await supabase
      .from('progress_reports')
      .insert([
        {
          project_id: project_id,
          report: reportData,
        },
      ])
      .single();

    if (reportInsertError) {
      res.status(500).json({ error: 'レポートの保存中にエラーが発生しました。' });
      return;
    }

    const reportId = reportInsertData.id;

    // レポートのサマリーと閲覧用URLをクライアントに送信
    res.status(200).json({ report_id: reportId });
  } else {
    res.status(405).json({ error: 'このメソッドはサポートされていません。' });
  }
}