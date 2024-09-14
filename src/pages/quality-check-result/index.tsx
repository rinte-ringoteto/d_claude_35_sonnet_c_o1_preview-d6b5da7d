typescript
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Topbar from '@/components/Topbar';
import supabase from '@/supabase';
import { FaExclamationTriangle } from 'react-icons/fa';

const 品質チェック結果 = () => {
  const [品質チェック一覧, set品質チェック一覧] = useState<any[]>([]);
  const [読み込み中, set読み込み中] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const データ取得 = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const ユーザー = session?.user;

      if (!ユーザー) {
        router.push('/login');
        return;
      }

      const { data: プロジェクト一覧, error: プロジェクトエラー } = await supabase
        .from('projects')
        .select('id')
        .eq('created_by', ユーザー.id);

      if (プロジェクトエラー || !プロジェクト一覧) {
        console.error('プロジェクトの取得に失敗しました');
        set読み込み中(false);
        return;
      }

      const プロジェクトID一覧 = プロジェクト一覧.map((プロジェクト) => プロジェクト.id);

      const { data: チェック一覧, error: チェックエラー } = await supabase
        .from('quality_checks')
        .select('*')
        .in('project_id', プロジェクトID一覧);

      if (チェックエラー || !チェック一覧) {
        console.error('品質チェック結果の取得に失敗しました');
        set読み込み中(false);
        return;
      }

      set品質チェック一覧(チェック一覧);
      set読み込み中(false);
    };

    データ取得();
  }, [router]);

  if (読み込み中) {
    return (
      <div className="min-h-screen h-full flex items-center justify-center">
        <div>読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-full bg-gray-100">
      <Topbar />
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">品質チェック結果</h1>
        {品質チェック一覧.length === 0 ? (
          <div className="text-center text-gray-600">品質チェック結果がありません</div>
        ) : (
          品質チェック一覧.map((チェック) => (
            <div key={チェック.id} className="bg-white p-6 rounded shadow mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {チェック.type} チェック結果 （実施日時: {new Date(チェック.created_at).toLocaleString()})
              </h2>
              <div className="mb-4">
                <p>スコア: {チェック.result.score}</p>
                <p>問題点の数: {チェック.result.issues.length}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">詳細結果リスト</h3>
                <ul>
                  {チェック.result.issues.map((問題, index) => (
                    <li key={index} className="mb-2 border-b pb-2">
                      <div className="flex">
                        <FaExclamationTriangle className="text-red-500 mr-2 mt-1" />
                        <div>
                          <p className="font-semibold">種別: {問題.type}</p>
                          <p>内容: {問題.description}</p>
                          <p>深刻度: {問題.severity}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">改善提案</h3>
                <p>{チェック.result.suggestions || '改善提案はありません'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default 品質チェック結果;