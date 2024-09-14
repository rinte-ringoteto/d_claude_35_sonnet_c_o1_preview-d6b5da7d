typescript
import React from 'react';
import Link from 'next/link';
import { FaUserCircle } from 'react-icons/fa';

const Topbar: React.FC = () => {
  return (
    <header className="bg-white shadow-md fixed top-0 left-0 w-full z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* ロゴ */}
        <div className="flex-shrink-0">
          <Link href="/">
            <a className="text-2xl font-bold text-blue-500">GEAR.indigo</a>
          </Link>
        </div>

        {/* ナビゲーションリンク */}
        <nav className="hidden md:flex space-x-4">
          <Link href="/dashboard">
            <a className="text-gray-700 hover:text-blue-500">ダッシュボード</a>
          </Link>
          <Link href="/file-upload">
            <a className="text-gray-700 hover:text-blue-500">ファイルアップロード</a>
          </Link>
          <Link href="/document-generation">
            <a className="text-gray-700 hover:text-blue-500">ドキュメント生成</a>
          </Link>
          <Link href="/code-generation">
            <a className="text-gray-700 hover:text-blue-500">ソースコード生成</a>
          </Link>
          <Link href="/quality-check">
            <a className="text-gray-700 hover:text-blue-500">品質チェック</a>
          </Link>
          <Link href="/consistency-check">
            <a className="text-gray-700 hover:text-blue-500">整合性確認</a>
          </Link>
          <Link href="/work-estimation">
            <a className="text-gray-700 hover:text-blue-500">工数見積</a>
          </Link>
          <Link href="/proposal-creation">
            <a className="text-gray-700 hover:text-blue-500">提案資料作成</a>
          </Link>
          <Link href="/progress-report">
            <a className="text-gray-700 hover:text-blue-500">進捗レポート</a>
          </Link>
        </nav>

        {/* ユーザープロフィール */}
        <div className="flex items-center">
          <button className="text-gray-700 hover:text-blue-500 focus:outline-none">
            <FaUserCircle size={24} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;