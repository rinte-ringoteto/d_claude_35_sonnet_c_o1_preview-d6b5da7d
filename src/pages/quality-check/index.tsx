tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Topbar from '@/components/Topbar';
import { supabase } from '@/supabase';
import { FaFileAlt, FaCode } from 'react-icons/fa';

const QualityCheck = () => {
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [sourceCodes, setSourceCodes] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    // ドキュメントとソースコードを取得
    const fetchData = async () => {
      const user = supabase.auth.user();
      if (user) {
        // プロジェクトを取得
        const { data: projects, error: projectError } = await supabase
          .from('projects')
          .select('id, name')
          .eq('created_by', user.id);

        if (projectError) {
          console.error('プロジェクトの取得に失敗しました', projectError);
          return;
        }

        const projectIds = projects.map((project: any) => project.id);

        // ドキュメントを取得
        const { data: docs, error: docError } = await supabase
          .from('documents')
          .select('id, type')
          .in('project_id', projectIds);

        if (docError) {
          console.error('ドキュメントの取得に失敗しました', docError);
        } else {
          setDocuments(docs);
        }

        // ソースコードを取得
        const { data: codes, error: codeError } = await supabase
          .from('source_codes')
          .select('id, file_name')
          .in('project_id', projectIds);

        if (codeError) {
          console.error('ソースコードの取得に失敗しました', codeError);
        } else {
          setSourceCodes(codes);
        }
      } else {
        router.push('/login');
      }
    };

    fetchData();
  }, []);

  const handleSelectItem = (id: string) => {
    setSelectedItems((prevSelected) => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter((itemId) => itemId !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };

  const startCheck = async () => {
    setIsChecking(true);
    setProgress(0);

    // チェック進捗をシミュレート
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          // チェック完了後、結果画面へ遷移
          router.push('/quality-check-result');
          return 100;
        } else {
          return prevProgress + 10;
        }
      });
    }, 500);

    // 実際の品質チェック処理を開始
    // 選択されたアイテムのIDをバックエンドに送信
    try {
      const { data, error } = await supabase
        .from('quality_checks')
        .insert([
          {
            project_id: selectedItems[0], // 簡略化のため、最初のアイテムのみ使用
            type: 'ドキュメント', // ここでは仮にドキュメントをチェック
            result: {}, // チェック結果はバックエンドで処理
          },
        ]);

      if (error) {
        console.error('品質チェックの開始に失敗しました', error);
      } else {
        console.log('品質チェックを開始しました', data);
      }
    } catch (error) {
      console.error('品質チェック中にエラーが発生しました', error);
    }
  };

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Topbar />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">品質チェック画面</h1>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">チェック対象選択</h2>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
              <FaFileAlt className="mr-2 text-blue-500" /> ドキュメント
            </h3>
            {documents.length > 0 ? (
              <ul className="mb-4">
                {documents.map((doc) => (
                  <li key={doc.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`doc-${doc.id}`}
                      className="mr-2"
                      checked={selectedItems.includes(doc.id)}
                      onChange={() => handleSelectItem(doc.id)}
                    />
                    <label htmlFor={`doc-${doc.id}`} className="text-gray-700">
                      {doc.type}（ID: {doc.id}）
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 mb-4">ドキュメントがありません。</p>
            )}
            <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
              <FaCode className="mr-2 text-green-500" /> ソースコード
            </h3>
            {sourceCodes.length > 0 ? (
              <ul>
                {sourceCodes.map((code) => (
                  <li key={code.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`code-${code.id}`}
                      className="mr-2"
                      checked={selectedItems.includes(code.id)}
                      onChange={() => handleSelectItem(code.id)}
                    />
                    <label htmlFor={`code-${code.id}`} className="text-gray-700">
                      {code.file_name}（ID: {code.id}）
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">ソースコードがありません。</p>
            )}
          </div>
        </div>
        <div className="text-center">
          <button
            onClick={startCheck}
            disabled={selectedItems.length === 0 || isChecking}
            className="bg-blue-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-600 disabled:bg-gray-300"
          >
            チェック開始
          </button>
        </div>
        {isChecking && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">チェック進捗</h2>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-500 h-4 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-gray-700 mt-2">{progress}% 完了</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QualityCheck;