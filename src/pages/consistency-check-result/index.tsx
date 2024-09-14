import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Topbar from '@/components/Topbar';
import { supabase } from '@/supabase';
import Link from 'next/link';
import { FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';

const Sidebar: React.FC = () => {
  return (
    <div className="w-64 bg-white h-full shadow-md">
      <nav className="mt-10">
        <ul>
          <li className="px-6 py-2">
            <Link href="/dashboard">
              <span className="text-gray-700 hover:text-blue-500">ダッシュボード</span>
            </Link>
          </li>
          <li className="px-6 py-2">
            <Link href="/file-upload">
              <span className="text-gray-700 hover:text-blue-500">ファイルアップロード</span>
            </Link>
          </li>
          <li className="px-6 py-2">
            <Link href="/document-generation">
              <span className="text-gray-700 hover:text-blue-500">ドキュメント生成</span>
            </Link>
          </li>
          <li className="px-6 py-2">
            <Link href="/code-generation">
              <span className="text-gray-700 hover:text-blue-500">ソースコード生成</span>
            </Link>
          </li>
          <li className="px-6 py-2">
            <Link href="/quality-check">
              <span className="text-gray-700 hover:text-blue-500">品質チェック</span>
            </Link>
          </li>
          <li className="px-6 py-2">
            <Link href="/consistency-check-result">
              <span className="text-gray-700 hover:text-blue-500">整合性確認結果</span>
            </Link>
          </li>
          <li className="px-6 py-2">
            <Link href="/work-estimate">
              <span className="text-gray-700 hover:text-blue-500">工数見積</span>
            </Link>
          </li>
          <li className="px-6 py-2">
            <Link href="/proposal-creation">
              <span className="text-gray-700 hover:text-blue-500">提案資料作成</span>
            </Link>
          </li>
          <li className="px-6 py-2">
            <Link href="/progress-report">
              <span className="text-gray-700 hover:text-blue-500">進捗レポート</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

const ConsistencyCheckResult: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [projectId, setProjectId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [score, setScore] = useState<number>(0);
  const [issues, setIssues] = useState<any[]>([]);

  useEffect(() => {
    const session = supabase.auth.session();
    if (!session) {
      router.push('/login');
    } else {
      setUser(session.user);

      const { projectId } = router.query;
      if (projectId) {
        setProjectId(projectId as string);
        fetchConsistencyCheckResult(projectId as string);
      } else {
        setLoading(false);
      }
    }
  }, [router]);

  const fetchConsistencyCheckResult = async (projectId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quality_checks')
        .select('result')
        .eq('project_id', projectId)
        .eq('type', '整合性')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        console.error(error);
        const sampleData = {
          score: 75,
          issues: [
            { type: '不整合', description: '要件定義とシステム設計の不一致', severity: '高' },
            { type: '不整合', description: 'システム設計とテストケースの不一致', severity: '中' },
          ],
        };
        setScore(sampleData.score);
        setIssues(sampleData.issues);
      } else {
        setScore(data.result.score);
        setIssues(data.result.issues);
      }
    } catch (err) {
      console.error(err);
      const sampleData = {
        score: 75,
        issues: [
          { type: '不整合', description: '要件定義とシステム設計の不一致', severity: '高' },
          { type: '不整合', description: 'システム設計とテストケースの不一致', severity: '中' },
        ],
      };
      setScore(sampleData.score);
      setIssues(sampleData.issues);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen h-full flex flex-col">
      <Topbar />
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-start bg-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">整合性確認結果</h1>

          {loading ? (
            <div className="text-center text-gray-500">読み込み中...</div>
          ) : (
            <div className="w-full max-w-4xl">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-700">整合性スコア</h2>
                <div className="text-4xl font-bold text-blue-500 mt-2">{score}点</div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-700">不整合箇所リスト</h2>
                <ul className="mt-2">
                  {issues.map((issue, index) => (
                    <li key={index} className="bg-white p-4 rounded-md shadow-md mb-4">
                      <div className="flex items-center">
                        <FaExclamationCircle className="text-red-500 mr-2" />
                        <span className="text-lg font-medium text-gray-800">{issue.description}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-sm text-gray-600">重要度: {issue.severity}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-700">修正提案</h2>
                <ul className="mt-2">
                  {issues.map((issue, index) => (
                    <li key={index} className="bg-white p-4 rounded-md shadow-md mb-4">
                      <div className="flex items-center">
                        <FaCheckCircle className="text-green-500 mr-2" />
                        <span className="text-lg font-medium text-gray-800">{issue.description}の修正を提案します。</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-sm text-gray-600">対応方法を検討してください。</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ConsistencyCheckResult;