import React from 'react';
import { Camera, FileSpreadsheet, Users, Award, Database } from 'lucide-react';

export type ActiveTab = 'ocr' | 'report' | 'roster' | 'tt22' | 'drive';

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
      label: 'Bóc Tách Sổ & AI Phân Tích',
      icon: Camera,
      badge: 'Gemini 3.8 Flash',
      badgeColor: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
    },
    {
      id: 'report' as ActiveTab,
      label: 'Báo Cáo Sơ Kết Tuần',
      icon: FileSpreadsheet,
      badge: pendingAlertsCount > 0 ? `${pendingAlertsCount} cảnh báo` : undefined,
      badgeColor: 'bg-amber-500 text-white shadow-xs',
    },
    {
      id: 'roster' as ActiveTab,
      label: 'Nhật Ký & Hồ Sơ Lớp',
      icon: Users,
    },
    {
      id: 'tt22' as ActiveTab,
      label: 'Đánh Giá TT 22/2021',
      icon: Award,
    },
    {
      id: 'drive' as ActiveTab,
      label: 'Đồng Bộ Supabase Cloud',
      icon: Database,
    },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-[53px] z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex space-x-1.5 sm:space-x-3 overflow-x-auto py-2.5 no-scrollbar scroll-smooth">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 transform scale-[1.02]'
                    : 'text-slate-600 hover:text-indigo-900 hover:bg-slate-100/90 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'
                  }`}
                />
                <span>{tab.label}</span>

                {tab.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${
                      isActive
                        ? 'bg-white/20 text-white backdrop-blur-xs'
                        : tab.badgeColor || 'bg-slate-100 text-slate-700 border border-slate-200'
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
