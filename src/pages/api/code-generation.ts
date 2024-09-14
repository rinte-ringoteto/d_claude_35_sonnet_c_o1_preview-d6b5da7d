typescript
import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/supabase'; // Supabaseクライアントをインポート
import { getLlmModelAndGenerateContent } from '@/utils/functions'; // AIモデル呼び出し関数をインポート
import { v4 as uuidv4 } from 'uuid'; // UUID生成ライブラリをインポート

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        // ソースコード生成開始の処理
        const { documentId, language } = req.body;

        // バリデーション：ドキュメントIDと言語の確認
        if (!documentId || !language) {
            return res.status(400).json({ error: 'ドキュメントIDとプログラミング言語は必須です。' });
        }

        // 1. データベースから対象ドキュメントの情報を取得
        const { data: documentData, error: documentError } = await supabase
            .from('documents')
            .select('*')
            .eq('id', documentId)
            .single();

        if (documentError || !documentData) {
            return res.status(404).json({ error: 'ドキュメントが見つかりません。' });
        }

        // 新しい生成タスクのIDを生成
        const generationId = uuidv4();

        // 生成タスクをデータベースに作成
        const { error: insertError } = await supabase
            .from('code_generations')
            .insert({
                id: generationId,
                document_id: documentId,
                language,
                progress: 0,
                status: 'in_progress'
            });

        if (insertError) {
            return res.status(500).json({ error: '生成タスクの作成に失敗しました。' });
        }

        // 非同期でコード生成を実行
        (async () => {
            try {
                // 2. ドキュメントの内容を解析
                const documentContent = documentData.content;

                // 3. AIモデルにドキュメント内容を入力し ソースコードを生成
                const systemPrompt = 'あなたは優秀なソフトウェア開発者です。以下のドキュメントに基づいて、' + language + 'のソースコードを生成してください。';
                const userPrompt = 'ドキュメント内容: ' + JSON.stringify(documentContent);

                // 進捗を50%に更新
                await supabase
                    .from('code_generations')
                    .update({ progress: 50 })
                    .eq('id', generationId);

                let generatedCode = await getLlmModelAndGenerateContent('ChatGPT', systemPrompt, userPrompt);

                // 4. 生成されたコードをフォーマットおよび最適化
                // フォーマット処理はここでは省略

                // 5. 生成結果をデータベースに保存
                const sourceCodeId = uuidv4();

                const { error: sourceCodeInsertError } = await supabase
                    .from('source_codes')
                    .insert({
                        id: sourceCodeId,
                        project_id: documentData.project_id,
                        file_name: `generated_code.${getFileExtension(language)}`,
                        content: generatedCode
                    });

                if (sourceCodeInsertError) {
                    // エラー発生時は生成タスクを失敗状態に更新
                    await supabase
                        .from('code_generations')
                        .update({ progress: 100, status: 'failed' })
                        .eq('id', generationId);
                    return;
                }

                // 6. 生成タスクを完了状態に更新
                await supabase
                    .from('code_generations')
                    .update({
                        progress: 100,
                        status: 'completed',
                        source_code_id: sourceCodeId
                    })
                    .eq('id', generationId);

            } catch (error) {
                // エラーが発生した場合、生成タスクを失敗状態に更新
                await supabase
                    .from('code_generations')
                    .update({ progress: 100, status: 'failed' })
                    .eq('id', generationId);
            }
        })();

        // クライアントにgenerationIdを返す
        return res.status(200).json({ generationId });

    } else if (req.method === 'GET') {
        // 生成進捗取得の処理
        const { generationId } = req.query;

        if (!generationId || typeof generationId !== 'string') {
            return res.status(400).json({ error: 'generationIdは必須です。' });
        }

        // 生成タスクの情報を取得
        const { data: generationData, error: generationError } = await supabase
            .from('code_generations')
            .select('*')
            .eq('id', generationId)
            .single();

        if (generationError || !generationData) {
            return res.status(404).json({ error: '生成タスクが見つかりません。' });
        }

        return res.status(200).json({
            progress: generationData.progress,
            status: generationData.status
        });

    } else {
        // その他のメソッドは許可しない
        res.status(405).json({ error: 'Method not allowed' });
    }
}

// プログラミング言語に対応するファイル拡張子を取得する関数
function getFileExtension(language: string): string {
    switch (language) {
        case 'Python':
            return 'py';
        case 'JavaScript':
            return 'js';
        case 'TypeScript':
            return 'ts';
        case 'Java':
            return 'java';
        default:
            return 'txt';
    }
}