import React, { useState, useEffect } from 'react';
import { Search, Filter, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import SalesApiService from '../../services/api/sales/salesApiService';

// Types for the report data
interface ReportRow {
  id: string;
  invoiceNo: string;
  date: string;
  month: string;
  year: string;
  partyName: string;
  proNo: string;
  dealerType: string;
  region: string;
  area: string;
  qty: number;
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
}

const SalesMonthlyReport: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<ReportRow[]>([]);
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
      
      const reportRows: ReportRow[] = [];
      
      vouchers.forEach(voucher => {
        if (voucher.stockItems && voucher.stockItems.length > 0) {
          voucher.stockItems.forEach((item, index) => {
            const qty = parseFloat(item.billedQty?.replace(/[^\d.-]/g, '') || '0');
            
            const rowDate = new Date(voucher.date.split('/').reverse().join('-'));
            const month = (rowDate.getMonth() + 1).toString();
            const year = rowDate.getFullYear().toString();
            
            reportRows.push({
              id: `${voucher.id}_${index}`,
              invoiceNo: voucher.voucherNumber,
              date: voucher.date,
              month,
              year,
              partyName: voucher.partyName,
              proNo: item.name, // Using item name as product number/identifier placeholder
              dealerType: 'N/A', // Update if TDL exposes ledger group
              region: 'N/A', // Update if TDL exposes ledger region
              area: 'N/A', // Update if TDL exposes ledger area
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
      
      setData(reportRows);
    } catch (err) {
      console.error('Error fetching monthly sales report data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedCompany, serverUrl]);

  const filteredData = data.filter(row => 
    row.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.proNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600">Loading Sales Report from Tally (Current FY)...</p>
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
            placeholder="Search Party Name..."
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

      <div className="flex-1 overflow-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Inv No.</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Date</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Party Name</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Pro.No.</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Dealer Type</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Region</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Area</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Caption</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Publication</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Inch Date</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Position</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Width</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Height</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Volume</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Rate</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Ads</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Qty</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length > 0 ? (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{row.invoiceNo}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">{row.date}</td>
                    <td className="px-3 py-3 text-sm font-semibold text-blue-600 whitespace-nowrap">{row.partyName}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">{row.proNo}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">{row.dealerType}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">{row.region}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">{row.area}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">{row.caption || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">{row.publication || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">{row.inchDate1 || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">{row.position || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap text-right">{row.width || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap text-right">{row.height || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap text-right">{row.volume || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap text-right">{row.rateUDF || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap text-right">{row.numberOfAds || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-900 text-right font-medium">{row.qty}</td>
                    <td className="px-3 py-3 text-sm text-green-600 text-right font-bold">{row.value.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={18} className="px-3 py-8 text-center text-gray-500">
                    No sales data found for the current financial year.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesMonthlyReport;
