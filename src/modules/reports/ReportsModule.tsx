import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, TrendingUp, CalendarDays, BarChart3 } from 'lucide-react';
import ProfitabilityReport from './ProfitabilityReport';
import SalesMonthlyReport from './SalesMonthlyReport';
import DailySalesReport from './DailySalesReport';

type ReportTab = 'profitability' | 'monthly' | 'daily';

const ReportsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('profitability');

  const tabs = [
    { id: 'profitability', label: 'Profitability Report (Monthly Overall)', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'monthly', label: 'Sales Monthly Report', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'daily', label: 'Daily Sales Report', icon: <CalendarDays className="w-5 h-5" /> },
  ] as const;

  return (
    <div className="p-6 h-[calc(100vh-theme(spacing.16))] overflow-hidden flex flex-col bg-gray-50/50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <FileText className="w-8 h-8 mr-3 text-blue-600" />
            Comprehensive Reports
          </h1>
          <p className="text-gray-500 mt-2 ml-11">
            Analyze your financial data with detailed profitability and sales insights.
          </p>
        </div>
      </div>

      <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200 mb-6 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center justify-center py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-300
              ${activeTab === tab.id
                ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-500/20'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }
              flex-1
            `}
          >
            <span className={`mr-2 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : ''}`}>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 h-full w-full"
          >
            {activeTab === 'profitability' && <ProfitabilityReport />}
            {activeTab === 'monthly' && <SalesMonthlyReport />}
            {activeTab === 'daily' && <DailySalesReport />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReportsModule;
