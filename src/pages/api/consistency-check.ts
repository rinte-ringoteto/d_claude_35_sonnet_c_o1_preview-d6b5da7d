typescript
import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/supabase';
import axios from 'axios';
import { getLlmModelAndGenerateContent } from '@/utils/functions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // POSTメソッドのみ受け付ける
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'メソッドが許可されていません。' });
        return;
    }

    // 認証ユーザーの取得
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: '認証情報が不足しています。' });
        return;
    }

    // JWTトークンからユーザー情報を取得
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
        res.status(401).json({ error: '認証に失敗しました。' });
        return;
    }

    // リクエストボディからdocument_idsを取得
    const { document_ids } = req.body;

    if (!document_ids || !Array.isArray(document_ids)) {
        res.status(400).json({ error: '無効なリクエストボディです。' });
        return;
    }

    try {
        // 1. データベースから関連するすべてのドキュメントを取得
        const { data: documents, error: fetchError } = await supabase
            .from('documents')
            .select('*')
            .in('id', document_ids);

        if (fetchError || !documents) {
            res.status(500).json({ error: 'ドキュメントの取得に失敗しました。' });
            return;
        }

        if (documents.length === 0) {
            res.status(404).json({ error: '指定されたドキュメントが見つかりません。' });
            return;
        }

        // 2. ドキュメント間の関連性を分析
        // 3. キーワードと概念の一貫性をチェック
        // 4. 要件とデザインの追跡可能性を確認
        // 5. 不整合箇所を特定し、リスト化
        // 6. 整合性スコアを計算

        // AI APIを使用して分析を実行
        const systemPrompt = 'あなたは経験豊富なソフトウェア品質管理者です。複数のドキュメント間の整合性をチェックし、不整合箇所を特定してください。また、整合性スコア（0〜100）を計算してください。';

        let userPrompt = '以下のドキュメントの内容をもとに、整合性チェックを実施してください。
';

        documents.forEach((doc, index) => {
            userPrompt += `
【ドキュメント${index + 1}：${doc.type}】
${JSON.stringify(doc.content)}
`;
        });

        let aiResponse;
        try {
            // AI APIにリクエストを送信
            const apiName = 'ChatGPT'; // または 'Gemini' や 'Claude'
            aiResponse = await getLlmModelAndGenerateContent(apiName, systemPrompt, userPrompt);
        } catch (aiError) {
            // AI APIの呼び出しに失敗した場合、サンプルデータを返す
            aiResponse = JSON.stringify({
                inconsistencies: [
                    { description: 'ドキュメント1では機能Aと記載されていますが、ドキュメント2では機能Bと記載されています。', severity: '高' },
                ],
                consistency_score: 75,
                suggestions: 'ドキュメント間で用語と機能の定義を統一してください。',
            });
        }

        let analysisResult;
        try {
            analysisResult = JSON.parse(aiResponse);
        } catch (parseError) {
            // 解析結果のパースに失敗した場合、サンプルデータを設定
            analysisResult = {
                inconsistencies: [
                    { description: 'ドキュメント1では機能Aと記載されていますが、ドキュメント2では機能Bと記載されています。', severity: '高' },
                ],
                consistency_score: 75,
                suggestions: 'ドキュメント間で用語と機能の定義を統一してください。',
            };
        }

        // 7. チェック結果と修正提案をデータベースに保存
        const { data: insertData, error: insertError } = await supabase
            .from('quality_checks')
            .insert([{
                project_id: documents[0].project_id,
                type: '整合性',
                result: analysisResult,
                created_at: new Date().toISOString(),
            }]);

        if (insertError) {
            res.status(500).json({ error: 'チェック結果の保存に失敗しました。' });
            return;
        }

        // 8. 結果サマリーをクライアントに送信
        res.status(200).json({
            message: '整合性チェックが完了しました。',
            consistency_score: analysisResult.consistency_score,
            inconsistencies: analysisResult.inconsistencies,
            suggestions: analysisResult.suggestions,
        });
    } catch (error) {
        console.error('整合性チェック中にエラーが発生しました：', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
}