import React from 'react';
import { Camera, FileSpreadsheet, Users, Award, SlidersHorizontal, Database } from 'lucide-react';

export type ActiveTab = 'ocr' | 'report' | 'roster' | 'tt22' | 'barem' | 'drive';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingAlertsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  pendingAlertsCount,
}) => {
  const tabs = [
    {
      id: 'ocr' as ActiveTab,
      label: 'Bóc tách Sổ & AI Phân tích',
      icon: Camera,
      badge: 'Gemini 3.1 Pro',
    },
    {
      id: 'report' as ActiveTab,
      label: 'Báo cáo Sơ kết Tuần',
      icon: FileSpreadsheet,
      badge: pendingAlertsCount > 0 ? `${pendingAlertsCount} cảnh báo` : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'roster' as ActiveTab,
      label: 'Nhật ký & Hồ sơ Học sinh',
      icon: Users,
    },
    {
      id: 'tt22' as ActiveTab,
      label: 'Xếp loại TT 22/2021',
      icon: Award,
    },
    {
      id: 'barem' as ActiveTab,
      label: 'Barem Điểm Thi Đua',
      icon: SlidersHorizontal,
    },
    {
      id: 'drive' as ActiveTab,
      label: 'Cơ sở Dữ liệu Cloud (Supabase)',
      icon: Database,
    },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-[57px] z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>

                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      tab.badgeColor || (isActive ? 'bg-blue-200/70 text-blue-800' : 'bg-slate-200 text-slate-700')
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
