import React, { useState, useEffect } from 'react';
import { Search, Filter, FileSpreadsheet, Calendar, RefreshCw } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import SalesApiService from '../../services/api/sales/salesApiService';

type DailySaleData = {
  id: number;
  invoiceNo: string;
  date: string;
  partyName: string;
  proNo: string;
  qty: number;
  value: number;
  caption?: string;
  publication?: string;
  inchDate1?: string;
  position?: string;
  width?: number;
  height?: number;
  volume?: number;
  rateUDF?: number;
  numberOfAds?: number;
};

type GroupedDailySales = {
  dateGroup: string;
  records: DailySaleData[];
  totalQty: number;
  totalValue: number;
  cumulativeValue: number;
};

// MOCK_DATA removed

const DailySalesReport: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<GroupedDailySales[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { selectedCompany, serverUrl } = useCompany();
  
  const fetchReportData = async () => {
    if (!selectedCompany) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const salesApi = new SalesApiService();
      if (serverUrl) {
        salesApi.setBaseURL(`http://${serverUrl}`);
      }
      
      const vouchers = await salesApi.getDetailedSalesVouchers(selectedCompany, 'currentYear');
      
      // Map to DailySaleData
      const allRecords: DailySaleData[] = [];
      let nextId = 1;
      
      vouchers.forEach(voucher => {
        if (voucher.stockItems && voucher.stockItems.length > 0) {
          voucher.stockItems.forEach(item => {
            const qty = parseFloat(item.billedQty?.replace(/[^\d.-]/g, '') || '0');
            allRecords.push({
              id: nextId++,
              invoiceNo: voucher.voucherNumber,
              date: voucher.date, // Format is DD/MM/YYYY
              partyName: voucher.partyName,
              proNo: item.name,
              qty: qty,
              value: item.amount,
              caption: voucher.caption,
              publication: voucher.publication,
              inchDate1: item.inchDate1,
              position: item.position,
              width: item.width,
              height: item.height,
              volume: item.volume,
              rateUDF: item.rateUDF,
              numberOfAds: item.numberOfAds
            });
          });
        }
      });
      
      // Group by date
      const groupedMap = new Map<string, DailySaleData[]>();
      allRecords.forEach(record => {
        const group = groupedMap.get(record.date) || [];
        group.push(record);
        groupedMap.set(record.date, group);
      });
      
      // Sort dates
      const sortedDates = Array.from(groupedMap.keys()).sort((a, b) => {
        const dateA = new Date(a.split('/').reverse().join('-')).getTime();
        const dateB = new Date(b.split('/').reverse().join('-')).getTime();
        return dateA - dateB;
      });
      
      const groupedData: GroupedDailySales[] = [];
      let cumulativeValue = 0;
      
      sortedDates.forEach(date => {
        const records = groupedMap.get(date)!;
        const totalQty = records.reduce((sum, r) => sum + r.qty, 0);
        const totalValue = records.reduce((sum, r) => sum + r.value, 0);
        cumulativeValue += totalValue;
        
        // Format dateGroup to DD.MM.YYYY
        const dateParts = date.split('/');
        const dateGroup = dateParts.length === 3 ? `${dateParts[0]}.${dateParts[1]}.${dateParts[2]}` : date;
        
        groupedData.push({
          dateGroup,
          records,
          totalQty,
          totalValue,
          cumulativeValue
        });
      });
      
      setData(groupedData);
    } catch (err) {
      console.error('Error fetching daily sales report data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedCompany, serverUrl]);

  // Filter groups based on search term
  const filteredData = data.map(group => {
    const filteredRecords = group.records.filter(record => 
      record.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return {
      ...group,
      records: filteredRecords
    };
  }).filter(group => group.records.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600">Loading Daily Sales Report from Tally (Current FY)...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg max-w-lg text-center border border-red-200">
          <h3 className="font-semibold text-lg mb-2">Error Loading Data</h3>
          <p>{error}</p>
          <button 
            onClick={fetchReportData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            placeholder="Search by Date or Party Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
            <Filter className="h-4 w-4 mr-2 text-gray-500" />
            Filters
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50 p-4">
        {filteredData.length > 0 ? (
          filteredData.map((group, groupIdx) => (
            <div key={groupIdx} className="mb-8 bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
              <div className="bg-blue-50/50 border-b border-gray-200 p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  Daily Sales Report - {group.dateGroup}
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Inv No.</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Party Name</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pro.No.</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Caption</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Publication</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Inch Date</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Position</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Width</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Height</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Volume</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Rate</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ads</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {group.records.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.invoiceNo}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{row.date}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{row.partyName}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{row.proNo}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{row.caption || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{row.publication || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{row.inchDate1 || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{row.position || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{row.width || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{row.height || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{row.volume || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{row.rateUDF || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{row.numberOfAds || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{row.qty}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{row.value.toFixed(2)}</td>
                      </tr>
                    ))}
                    
                    {/* Daily Total Row */}
                    <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                      <td colSpan={13} className="px-4 py-3 text-sm text-center text-gray-900 uppercase">TOTAL</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{group.totalQty}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{group.totalValue.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Cumulative Summary */}
              <div className="bg-white p-4 flex justify-center items-center">
                <table className="w-full max-w-2xl border-collapse border border-gray-300 shadow-sm rounded-lg overflow-hidden">
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 bg-gray-50 text-right w-1/2">Cumulative Value</td>
                      <td className="border border-gray-300 px-6 py-2 text-sm font-bold text-gray-900 bg-white text-center w-1/2">{group.cumulativeValue.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 bg-gray-50 text-right">Sales for the Month</td>
                      <td className="border border-gray-300 px-6 py-2 text-sm font-bold text-gray-900 bg-white text-center">{group.cumulativeValue.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-8 text-center text-gray-500 rounded-xl shadow-sm border border-gray-200">
            No sales data found for the current financial year.
          </div>
        )}
      </div>
    </div>
  );
};

export default DailySalesReport;
