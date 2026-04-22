import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getAnalyticsOverview, getPayrollTrends, getCompanyComparison, getPayroll } from '../services/api';
import { useAuth } from '../context/AuthContext';

const KPI = ({ label, value, color, sub }) => (
  <div style={{ background: '#fff', borderRadius: '12px', padding: '1.25rem 1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderLeft: `4px solid ${color}` }}>
    <div style={{ fontSize: '1.7rem', fontWeight: 'bold', color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.35rem' }}>{label}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.15rem' }}>{sub}</div>}
  </div>
);

const Bar = ({ data, xKey, yKey, color }) => {
  if (!data.length) return <div style={{ textAlign: 'center', color: '#aaa', padding: '2rem' }}>Run payroll to see data</div>;
  const max = Math.max(...data.map(item => item[yKey] || 0), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px', padding: '0 4px' }}>
      {data.slice(-8).map((item, index) => (
        <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: '0.55rem', color: '#888', marginBottom: '2px' }}>INR {((item[yKey] || 0) / 1000).toFixed(0)}k</div>
          <div style={{ width: '100%', background: color, borderRadius: '3px 3px 0 0', height: `${((item[yKey] || 0) / max) * 90}px`, minHeight: '3px' }} />
          <div style={{ fontSize: '0.55rem', color: '#888', marginTop: '3px', textAlign: 'center' }}>{String(item[xKey]).substring(5)}</div>
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
  const [payrolls, setPayrolls] = useState([]);

  useEffect(() => {
    Promise.all([getAnalyticsOverview(), getPayrollTrends(), getCompanyComparison(), getPayroll({})])
      .then(([overviewRes, trendsRes, companyRes, payrollRes]) => {
        setOverview(overviewRes.data.data);
        setTrends(trendsRes.data.data);
        setCompanies(companyRes.data.data);
        setPayrolls(payrollRes.data.payrolls || payrollRes.data || []);
      })
      .catch(console.error);
  }, []);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const payrollsThisMonth = payrolls.filter(item => item.payrollMonth === currentMonth);
  const processedCount = payrollsThisMonth.filter(item => item.status === 'Processed').length;
  const onHoldCount = payrollsThisMonth.filter(item => item.status === 'Hold').length;
  const paidCount = payrollsThisMonth.filter(item => item.status === 'Paid').length;
  const complianceAttention = companies.filter(item => item.complianceStatus && item.complianceStatus !== 'Compliant').length;
  const topCompany = [...companies].sort((a, b) => (b.totalPayout || 0) - (a.totalPayout || 0))[0];
  const latestTrend = trends[trends.length - 1];
  const previousTrend = trends[trends.length - 2];
  const payoutChange = latestTrend && previousTrend
    ? (((latestTrend.net || 0) - (previousTrend.net || 0)) / Math.max(previousTrend.net || 1, 1)) * 100
    : null;

  const kpis = [
    { label: 'Companies', value: overview?.companies ?? '-', color: '#1a237e' },
    { label: 'Active Employees', value: overview?.employees ?? '-', color: '#1565c0' },
    { label: "This Month's Payout", value: overview ? `INR ${(overview.thisMonthPayout / 1000).toFixed(0)}k` : '-', color: '#2e7d32', sub: `${overview?.thisMonthPayrolls ?? 0} records` },
    { label: 'Average Net Salary', value: overview ? `INR ${Math.round(overview.avgSalary).toLocaleString('en-IN')}` : '-', color: '#e65100' },
    { label: 'Compliant Companies', value: overview?.compliantCount ?? '-', color: '#00695c' },
    { label: 'Total Payroll Records', value: overview?.totalPayrollRecords ?? '-', color: '#6a1b9a' },
  ];

  const actionItems = [
    { title: 'Payroll waiting for review', value: processedCount, tone: '#e65100', note: `Processed records for ${currentMonth}` },
    { title: 'Payroll on hold', value: onHoldCount, tone: '#c62828', note: 'Resolve salary or attendance blockers' },
    { title: 'Compliance attention needed', value: complianceAttention, tone: '#6a1b9a', note: 'Companies not fully compliant' },
    { title: 'Payroll already paid', value: paidCount, tone: '#2e7d32', note: 'Paid entries in the current month' },
  ];

  return (
    <div style={{ background: '#f0f2f8', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ padding: '1.5rem 2rem', maxWidth: '1300px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: '#1a237e', fontSize: '1.4rem' }}>Welcome, {user?.name}</h2>
          <p style={{ margin: '0.3rem 0 0', color: '#666', fontSize: '0.9rem' }}>
            Payroll overview for {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {kpis.map(item => <KPI key={item.label} {...item} />)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#1a237e', fontSize: '1rem' }}>Net Payroll Trend</h3>
            <Bar data={trends} xKey="month" yKey="net" color="#3949ab" />
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#1a237e', fontSize: '1rem' }}>Gross Salary Trend</h3>
            <Bar data={trends} xKey="month" yKey="gross" color="#e65100" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#1a237e', fontSize: '1rem' }}>Action Center</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
              {actionItems.map(item => (
                <div key={item.title} style={{ border: `1px solid ${item.tone}22`, borderRadius: '10px', padding: '1rem', background: `${item.tone}08` }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: item.tone }}>{item.value}</div>
                  <div style={{ color: '#1d2440', fontWeight: '600', fontSize: '0.9rem', marginTop: '0.2rem' }}>{item.title}</div>
                  <div style={{ color: '#667085', fontSize: '0.78rem', marginTop: '0.35rem' }}>{item.note}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #0d1b4b 0%, #243b87 100%)', color: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Snapshot</h3>
            <div style={{ display: 'grid', gap: '0.9rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>Highest payout company</div>
                <div style={{ fontSize: '1.05rem', fontWeight: '700', marginTop: '0.15rem' }}>{topCompany?.company || 'No data yet'}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  {topCompany ? `Total payout: INR ${topCompany.totalPayout.toLocaleString('en-IN')}` : 'Add payroll records to unlock this card.'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>Net payroll movement</div>
                <div style={{ fontSize: '1.05rem', fontWeight: '700', marginTop: '0.15rem' }}>
                  {payoutChange === null ? 'Not enough trend data' : `${payoutChange >= 0 ? '+' : ''}${payoutChange.toFixed(1)}% vs previous month`}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  {latestTrend ? `Latest month ${latestTrend.month} closed at INR ${(latestTrend.net || 0).toLocaleString('en-IN')}` : 'Run payroll for at least one month.'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>Focus for today</div>
                <div style={{ fontSize: '0.92rem', lineHeight: 1.5, marginTop: '0.15rem' }}>
                  {onHoldCount > 0
                    ? 'Review hold payroll records first so payslips are not delayed.'
                    : complianceAttention > 0
                      ? 'Close compliance gaps before month-end reporting.'
                      : 'Operations look healthy. This is a good time to export reports or run reviews.'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#1a237e', fontSize: '1rem' }}>Company Overview</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#e8eaf6' }}>
                {['Company', 'Industry', 'Employees', 'Total Payout', 'Average/Employee', 'Compliance'].map(header => (
                  <th key={header} style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontSize: '0.78rem', color: '#1a237e' }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.map((company, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={td}><strong>{company.company}</strong></td>
                  <td style={td}>{company.industry || '-'}</td>
                  <td style={td}>{company.employees}</td>
                  <td style={td}>INR {company.totalPayout.toLocaleString('en-IN')}</td>
                  <td style={td}>INR {company.avgPayout.toLocaleString('en-IN')}</td>
                  <td style={td}>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: company.complianceStatus === 'Compliant' ? '#e8f5e9' : company.complianceStatus === 'Partial' ? '#fff3e0' : '#ffebee',
                      color: company.complianceStatus === 'Compliant' ? '#2e7d32' : company.complianceStatus === 'Partial' ? '#e65100' : '#c62828',
                    }}>
                      {company.complianceStatus}
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
