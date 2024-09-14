import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/supabase';
import { getLlmModelAndGenerateContent } from '@/utils/functions';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 認証されたユーザーを取得
  const { data: { session } } = await supabase.auth.getSession(req);
  if (!session) {
    return res.status(401).json({ error: '認証が必要です。' });
  }
  const userId = session.user.id;

  if (req.method === 'POST') {
    // リクエストボディからdocumentTypeとprojectIdを取得
    const { documentType, projectId } = req.body;
    if (!documentType || !projectId) {
      return res.status(400).json({ error: 'documentTypeとprojectIdは必須です。' });
    }

    try {
      // 1. データベースから対象ファイルの情報を取得
      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (filesError || !filesData || filesData.length === 0) {
        return res.status(404).json({ error: '対象のファイルが見つかりません。' });
      }

      const targetFile = filesData[0];

      // 2. ファイルの内容を読み込み
      const { data: fileContent, error: fileError } = await supabase.storage
        .from('uploads')
        .download(targetFile.path);

      if (fileError || !fileContent) {
        return res.status(500).json({ error: 'ファイルの読み込みに失敗しました。' });
      }

      const fileText = await fileContent.text();

      // 3. AIモデルにファイル内容を入力し、ドキュメントを生成
      const systemPrompt = `あなたは熟練したシステムエンジニアです。以下のファイル内容から「${documentType}」のドキュメントを日本語で作成してください。`;
      const userPrompt = fileText;

      let aiResponse: string;
      try {
        aiResponse = await getLlmModelAndGenerateContent('ChatGPT', systemPrompt, userPrompt);
      } catch (error) {
        // AI APIの呼び出しが失敗した場合はサンプルデータを使用
        aiResponse = 'これはサンプルのドキュメント内容です。AIによる生成が失敗したため、サンプルデータを表示しています。';
      }

      // 4. 生成されたドキュメントをフォーマット
      const formattedDocument = formatDocument(aiResponse);

      // 5. 生成結果をデータベースに保存
      const documentId = uuidv4();
      const { error: documentError } = await supabase
        .from('documents')
        .insert({
          id: documentId,
          project_id: projectId,
          type: documentType,
          content: formattedDocument,
          created_at: new Date(),
          updated_at: new Date(),
        });

      if (documentError) {
        return res.status(500).json({ error: 'ドキュメントの保存に失敗しました。' });
      }

      // 6. 生成完了通知をクライアントに送信
      return res.status(200).json({ generationId: documentId });
    } catch (error) {
      console.error('ドキュメント生成中にエラーが発生しました。', error);
      return res.status(500).json({ error: 'ドキュメント生成に失敗しました。' });
    }
  } else {
    res.status(405).json({ error: '許可されていないメソッドです。' });
  }
}

// ドキュメントのフォーマット関数（例）
function formatDocument(aiOutput: string): any {
  return {
    title: '自動生成ドキュメント',
    sections: [
      {
        heading: '概要',
        content: aiOutput,
      },
    ],
  };
}