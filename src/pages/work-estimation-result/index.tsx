typescript
import React, { useEffect, useState } from 'react';
import supabase from '@/supabase';
import Topbar from '@/components/Topbar';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaSave } from 'react-icons/fa';
import { FiLoader } from 'react-icons/fi';

const WorkEstimationResultPage = () => {
  const [user, setUser] = useState(null);
  const [workEstimation, setWorkEstimation] = useState(null);
  const [adjustedEstimation, setAdjustedEstimation] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        fetchWorkEstimation(session.user.id);
      }
    };

    const fetchWorkEstimation = async (userId: string) => {
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!projects || projects.length === 0) {
        setWorkEstimation(sampleWorkEstimation);
        setAdjustedEstimation(sampleWorkEstimation.estimate);
        setLoading(false);
        return;
      }

      const projectId = projects[0].id;

      const { data: estimates } = await supabase
        .from('work_estimates')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!estimates || estimates.length === 0) {
        setWorkEstimation(sampleWorkEstimation);
        setAdjustedEstimation(sampleWorkEstimation.estimate);
        setLoading(false);
        return;
      }

      setWorkEstimation(estimates[0]);
      setAdjustedEstimation(estimates[0].estimate);
      setLoading(false);
    };

    fetchUser();
  }, []);

  const sampleWorkEstimation = {
    id: 'sample-id',
    project_id: 'sample-project-id',
    estimate: {
      total_hours: 120,
      breakdown: [
        { phase: '要件定義', hours: 30 },
        { phase: '設計', hours: 40 },
        { phase: '開発', hours: 30 },
        { phase: 'テスト', hours: 20 },
      ],
    },
    created_at: '2023-10-01T00:00:00Z',
  };

  const handleAdjustmentChange = (index: number, value: number) => {
    const newBreakdown = [...adjustedEstimation.breakdown];
    newBreakdown[index].hours = value;
    const newTotalHours = newBreakdown.reduce((sum, item) => sum + item.hours, 0);

    setAdjustedEstimation({
      total_hours: newTotalHours,
      breakdown: newBreakdown,
    });
  };

  const handleSaveAdjustment = async () => {
    if (!workEstimation) return;

    const { error } = await supabase
      .from('work_estimates')
      .update({ estimate: adjustedEstimation })
      .eq('id', workEstimation.id);

    if (error) {
      alert('工数の更新に失敗しました。');
    } else {
      alert('工数が更新されました。');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen h-full bg-gray-100">
        <Topbar />
        <div className="flex justify-center items-center h-full">
          <FiLoader className="animate-spin text-4xl" />
          <p className="ml-2">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!adjustedEstimation) {
    return (
      <div className="min-h-screen h-full bg-gray-100">
        <Topbar />
        <div className="flex justify-center items-center h-full">
          <p>工数見積結果が見つかりませんでした。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-full bg-gray-100">
      <Topbar />
      <div className="container mx-auto px-8 py-10">
        <h1 className="text-3xl font-bold mb-6">工数見積結果</h1>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">
            総工数: {adjustedEstimation.total_hours} 時間
          </h2>
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">フェーズ</th>
                <th className="py-2 px-4 border-b">工数（時間）</th>
                <th className="py-2 px-4 border-b">調整後の工数（時間）</th>
              </tr>
            </thead>
            <tbody>
              {adjustedEstimation.breakdown.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="border-b px-4 py-2">{item.phase}</td>
                  <td className="border-b px-4 py-2">{item.hours}</td>
                  <td className="border-b px-4 py-2">
                    <input
                      type="number"
                      min="0"
                      value={item.hours}
                      onChange={(e) =>
                        handleAdjustmentChange(index, Number(e.target.value))
                      }
                      className="w-full border rounded px-2 py-1"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-6 text-right">
            <button
              onClick={handleSaveAdjustment}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex items-center justify-center"
            >
              <FaSave className="mr-2" />
              調整後の工数を保存
            </button>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">プロジェクト計画への反映</h2>
          <p className="mb-4">
            調整後の工数をプロジェクト計画に反映させます。以下のボタンをクリックしてください。
          </p>
          <button
            onClick={() => router.push('/project-plan')}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            プロジェクト計画に反映する
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkEstimationResultPage;