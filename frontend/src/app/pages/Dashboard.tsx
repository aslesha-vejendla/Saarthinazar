import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUp, AlertCircle, TrendingUp, Users, FileText, DollarSign, Plus, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { name: 'Talent Corner', cv: 2800, nvites: 18000, jobs: 85 },
  { name: 'HR Solutions', cv: 2200, nvites: 15000, jobs: 70 },
  { name: 'Staffing Pro', cv: 1800, nvites: 12000, jobs: 60 },
  { name: 'Global Recruit', cv: 2500, nvites: 16500, jobs: 80 },
  { name: 'Smart Hire', cv: 1500, nvites: 10000, jobs: 55 },
];

export default function Dashboard() {
  const [financialYear, setFinancialYear] = useState('2026-2027');
  const [financialYears, setFinancialYears] = useState(['2024-2025', '2025-2026', '2026-2027']);
  const [showYearModal, setShowYearModal] = useState(false);
  const [newYear, setNewYear] = useState('');
  const [masterFile, setMasterFile] = useState<File | null>(null);
  const [yearMessage, setYearMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://127.0.0.1:8000/financial-years/')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setFinancialYears(data.map((item) => item.label));
          const active = data.find((item) => item.is_active);
          if (active) setFinancialYear(active.label);
        }
      })
      .catch(() => undefined);
  }, []);

  const handleAddFinancialYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYear || !masterFile) {
      setYearMessage('Please enter a financial year and upload the master data file.');
      return;
    }

    const body = new FormData();
    body.append('label', newYear);
    body.append('uploaded_by', localStorage.getItem('username') || 'Kajal');
    body.append('master_file', masterFile);

    const response = await fetch('http://127.0.0.1:8000/financial-years/', {
      method: 'POST',
      body,
    });
    const result = await response.json();
    setYearMessage(result.message || 'Financial year saved.');
    if (result.status === 'success') {
      setFinancialYears((years) => Array.from(new Set([result.financial_year.label, ...years])));
      setFinancialYear(result.financial_year.label);
      setNewYear('');
      setMasterFile(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl mb-2">Dashboard</h1>
          <p className="text-slate-600">Overview of usage and billing activity</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={financialYear}
            onChange={(e) => setFinancialYear(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-xl bg-white"
          >
            {financialYears.map((year) => (
              <option key={year} value={year}>FY {year}</option>
            ))}
          </select>
          <button
            onClick={() => setShowYearModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Financial Year
          </button>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-8 flex items-center gap-3">
        <AlertCircle className="text-purple-600 w-5 h-5" />
        <p className="text-purple-900">
          <strong>Upload Reminder:</strong> No reports uploaded in the last 8 days. Please upload weekly reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-slate-600">Total CV Usage</h3>
          </div>
          <p className="text-3xl mb-1">10,800</p>
          <p className="text-sm text-slate-500">72% of allocated</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-slate-600">Total NVites Usage</h3>
          </div>
          <p className="text-3xl mb-1">71,500</p>
          <p className="text-sm text-slate-500">68% of allocated</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-slate-600">Total Job Postings</h3>
          </div>
          <p className="text-3xl mb-1">350</p>
          <p className="text-sm text-slate-500">70% of allocated</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-slate-600">Critical Teams</h3>
          </div>
          <p className="text-3xl mb-1">3</p>
          <p className="text-sm text-slate-500">Exceeding 90% usage</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-slate-600">Outstanding Invoices</h3>
          </div>
          <p className="text-3xl mb-1">₹2,45,000</p>
          <p className="text-sm text-slate-500">5 pending payments</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileUp className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-slate-600">Last Upload Date</h3>
          </div>
          <p className="text-3xl mb-1">30 Apr</p>
          <p className="text-sm text-slate-500">9 days ago</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg mb-4">Team Usage Overview</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="cv" fill="#7B2CBF" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg mb-4">Critical Teams</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <div>
                <p className="font-medium text-red-900">Talent Corner</p>
                <p className="text-sm text-red-700">CV Usage: 105% (3150/3000)</p>
              </div>
              <span className="px-3 py-1 bg-red-600 text-white text-sm rounded-full">Critical</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <div>
                <p className="font-medium text-red-900">Global Recruit</p>
                <p className="text-sm text-red-700">NVites Usage: 98% (22050/22500)</p>
              </div>
              <span className="px-3 py-1 bg-red-600 text-white text-sm rounded-full">Critical</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div>
                <p className="font-medium text-orange-900">HR Solutions</p>
                <p className="text-sm text-orange-700">Jobs Usage: 92% (92/100)</p>
              </div>
              <span className="px-3 py-1 bg-orange-500 text-white text-sm rounded-full">Warning</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg mb-4">Pending Actions</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
            <div className="flex items-center gap-3">
              <FileUp className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium">Upload weekly reports</p>
                <p className="text-sm text-slate-600">Resdex Usage & Job Posting reports pending</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/upload-reports')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Upload
            </button>
          </div>
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium">Send usage alerts</p>
                <p className="text-sm text-slate-600">3 teams exceeding limits need notification</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
              Review
            </button>
          </div>
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium">Follow up on payments</p>
                <p className="text-sm text-slate-600">5 invoices pending for 7+ days</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
              View
            </button>
          </div>
        </div>
      </div>

      {showYearModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-medium">Add Financial Year</h2>
                <p className="text-sm text-slate-600 mt-1">Upload the master data file for teams, licences, and allocations.</p>
              </div>
              <button onClick={() => setShowYearModal(false)} className="text-slate-500 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddFinancialYear} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Financial Year</label>
                <input
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  placeholder="2027-2028"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Master Data File</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setMasterFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white"
                />
                <p className="text-xs text-slate-500 mt-2">Use this for the team master list: team name, licence count, partner type, inventory limits, and pricing.</p>
              </div>
              {yearMessage && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-sm text-purple-900">
                  {yearMessage}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowYearModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  Save Year
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
