tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import supabase from '@/supabase';
import Topbar from '@/components/Topbar';
import { Doughnut, Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import { AiOutlineWarning } from 'react-icons/ai';

const ProgressReportView = () => {
  const [user, setUser] = useState<any>(null);
  const [progressReport, setProgressReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const router = useRouter();

  useEffect(() => {
    // 認証状態を確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProgressReport(session.user);
      } else {
        router.push('/login');
      }
    });
  }, []);

  const fetchProgressReport = async (user: any) => {
    try {
      // ユーザーに関連するプロジェクトを取得
      const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('created_by', user.id);

      if (projectError || projects.length === 0) {
        console.error('プロジェクトの取得に失敗しました:', projectError);
        setProgressReport(sampleProgressReport());
        setLoading(false);
        return;
      }

      const projectId = projects[0].id;

      // 進捗レポートを取得
      const { data: reports, error: reportError } = await supabase
        .from('progress_reports')
        .select('report')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (reportError || reports.length === 0) {
        console.error('進捗レポートの取得に失敗しました:', reportError);
        setProgressReport(sampleProgressReport());
      } else {
        setProgressReport(reports[0].report);
      }
    } catch (err) {
      console.error('エラーが発生しました:', err);
      setProgressReport(sampleProgressReport());
    } finally {
      setLoading(false);
    }
  };

  const sampleProgressReport = () => ({
    overall_progress: 65,
    phases: [
      { name: '要件定義', progress: 100, status: '完了' },
      { name: 'システム設計', progress: 80, status: '進行中' },
      { name: '開発', progress: 50, status: '進行中' },
      { name: 'テスト', progress: 20, status: '未着手' },
      { name: '提案資料', progress: 0, status: '未着手' },
    ],
    issues: [
      { description: '要件変更による仕様修正', delay_factor: '高' },
      { description: 'リソース不足による作業遅延', delay_factor: '中' },
    ],
  });

  if (loading) {
    return (
      <div className="min-h-screen h-full bg-gray-100 flex items-center justify-center">
        <div>読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-full bg-gray-100">
      <Topbar />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">進捗レポート</h1>

        {/* 全体進捗グラフ */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">全体進捗状況</h2>
          <div className="flex items-center">
            <div className="w-1/2">
              {/* ドーナツチャート */}
              <Doughnut
                data={{
                  labels: ['進捗率', '残り'],
                  datasets: [
                    {
                      data: [
                        progressReport.overall_progress,
                        100 - progressReport.overall_progress,
                      ],
                      backgroundColor: ['#4A90E2', '#F8F8F8'],
                      hoverBackgroundColor: ['#357ABD', '#E0E0E0'],
                    },
                  ],
                }}
                options={{
                  plugins: {
                    legend: { display: false },
                  },
                  cutout: '70%',
                }}
              />
            </div>
            <div className="w-1/2 text-center">
              <div className="text-5xl font-bold text-gray-800">
                {progressReport.overall_progress}%
              </div>
              <div className="text-gray-600 mt-2">全体の進捗率</div>
            </div>
          </div>
        </div>

        {/* フェーズ別進捗状況 */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">フェーズ別進捗状況</h2>
          <div>
            <Bar
              data={{
                labels: progressReport.phases.map((phase: any) => phase.name),
                datasets: [
                  {
                    label: '進捗率',
                    data: progressReport.phases.map((phase: any) => phase.progress),
                    backgroundColor: '#50E3C2',
                  },
                ],
              }}
              options={{
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* 課題リスト */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">課題リスト</h2>
          {progressReport.issues && progressReport.issues.length > 0 ? (
            <ul>
              {progressReport.issues.map((issue: any, index: number) => (
                <li key={index} className="flex items-center mb-4">
                  <AiOutlineWarning className="text-red-500 mr-2" size={24} />
                  <div>
                    <div className="font-semibold">{issue.description}</div>
                    <div className="text-sm text-gray-600">
                      遅延要因: {issue.delay_factor}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-600">
              現在、特筆すべき課題はありません。
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressReportView;