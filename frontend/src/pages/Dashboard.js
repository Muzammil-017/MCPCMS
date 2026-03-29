import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getAnalyticsOverview, getPayrollTrends, getCompanyComparison } from '../services/api';
import { useAuth } from '../context/AuthContext';

const KPI = ({ icon, label, value, color, sub }) => (
  <div style={{ background: '#fff', borderRadius: '12px', padding: '1.25rem 1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderLeft: `4px solid ${color}`, display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div style={{ fontSize: '2rem' }}>{icon}</div>
    <div>
      <div style={{ fontSize: '1.7rem', fontWeight: 'bold', color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#999' }}>{sub}</div>}
    </div>
  </div>
);

const Bar = ({ data, xKey, yKey, color }) => {
  if (!data.length) return <div style={{ textAlign: 'center', color: '#aaa', padding: '2rem' }}>Run payroll to see data</div>;
  const max = Math.max(...data.map(d => d[yKey]));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px', padding: '0 4px' }}>
      {data.slice(-8).map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: '0.55rem', color: '#888', marginBottom: '2px' }}>₹{((d[yKey] || 0) / 1000).toFixed(0)}k</div>
          <div style={{ width: '100%', background: color, borderRadius: '3px 3px 0 0', height: `${((d[yKey] || 0) / max) * 90}px`, minHeight: '3px' }} />
          <div style={{ fontSize: '0.55rem', color: '#888', marginTop: '3px', textAlign: 'center' }}>{String(d[xKey]).substring(5)}</div>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    Promise.all([getAnalyticsOverview(), getPayrollTrends(), getCompanyComparison()])
      .then(([o, t, c]) => { setOverview(o.data.data); setTrends(t.data.data); setCompanies(c.data.data); })
      .catch(console.error);
  }, []);

  const kpis = [
    { icon: '🏢', label: 'Companies', value: overview?.companies ?? '—', color: '#1a237e' },
    { icon: '👥', label: 'Active Employees', value: overview?.employees ?? '—', color: '#1565c0' },
    { icon: '💰', label: "This Month's Payout", value: overview ? `₹${(overview.thisMonthPayout / 1000).toFixed(0)}k` : '—', color: '#2e7d32', sub: `${overview?.thisMonthPayrolls ?? 0} records` },
    { icon: '📊', label: 'Avg Net Salary', value: overview ? `₹${Math.round(overview.avgSalary).toLocaleString('en-IN')}` : '—', color: '#e65100' },
    { icon: '✅', label: 'Compliant Companies', value: overview?.compliantCount ?? '—', color: '#00695c' },
    { icon: '📋', label: 'Total Payroll Records', value: overview?.totalPayrollRecords ?? '—', color: '#6a1b9a' },
  ];

  return (
    <div style={{ background: '#f0f2f8', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ padding: '1.5rem 2rem', maxWidth: '1300px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: '#1a237e', fontSize: '1.4rem' }}>👋 Welcome, {user?.name}</h2>
          <p style={{ margin: '0.3rem 0 0', color: '#666', fontSize: '0.9rem' }}>Here's your payroll overview</p>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {kpis.map(k => <KPI key={k.label} {...k} />)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Payroll Trends */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#1a237e', fontSize: '1rem' }}>📈 Net Payroll Trend</h3>
            <Bar data={trends} xKey="month" yKey="net" color="#3949ab" />
          </div>
          {/* Gross Trend */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#1a237e', fontSize: '1rem' }}>💸 Gross Salary Trend</h3>
            <Bar data={trends} xKey="month" yKey="gross" color="#e65100" />
          </div>
        </div>

        {/* Company Table */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#1a237e', fontSize: '1rem' }}>🏢 Company Overview</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#e8eaf6' }}>
                {['Company', 'Industry', 'Employees', 'Total Payout', 'Avg/Employee', 'Compliance'].map(h => (
                  <th key={h} style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontSize: '0.78rem', color: '#1a237e' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={td}><strong>{c.company}</strong></td>
                  <td style={td}>{c.industry || '—'}</td>
                  <td style={td}>{c.employees}</td>
                  <td style={td}>₹{c.totalPayout.toLocaleString('en-IN')}</td>
                  <td style={td}>₹{c.avgPayout.toLocaleString('en-IN')}</td>
                  <td style={td}>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600',
                      background: c.complianceStatus === 'Compliant' ? '#e8f5e9' : c.complianceStatus === 'Partial' ? '#fff3e0' : '#ffebee',
                      color: c.complianceStatus === 'Compliant' ? '#2e7d32' : c.complianceStatus === 'Partial' ? '#e65100' : '#c62828' }}>
                      {c.complianceStatus}
                    </span>
                  </td>
                </tr>
              ))}
              {!companies.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: '#aaa' }}>No company data. Add companies to get started.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
const td = { padding: '0.65rem 0.75rem', fontSize: '0.85rem' };
