import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { monthLabel, compactAmount } from '../utils/chartFormat';
import { getAnalyticsOverview, getPayrollTrends, getDepartmentSalary, getCompanyComparison, getComplianceStatus, getAttendanceAnalytics } from '../services/api';

const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const SC = { Compliant: '#2e7d32', 'Non-Compliant': '#c62828', Partial: '#e65100' };
const COLORS = ['#1a237e', '#1565c0', '#2e7d32', '#e65100', '#6a1b9a', '#00695c', '#c62828'];

const BarChart = ({ data, xKey, yKey, color = '#1a237e', height = 140 }) => {
  if (!data?.length) return <div style={{ textAlign: 'center', color: '#bbb', padding: '2rem', fontSize: '0.85rem' }}>No data available</div>;
  const max = Math.max(...data.map(d => d[yKey] || 0), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: `${height}px`, padding: '0 2px' }}>
      {data.slice(-10).map((d, i) => (
        <div key={i} title={`${d[xKey]}: ${fmt(d[yKey])}`}
          style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: '0.55rem', color: '#888', marginBottom: '2px' }}>{compactAmount(d[yKey])}</div>
          <div style={{ width: '100%', background: color, borderRadius: '3px 3px 0 0', height: `${((d[yKey] || 0) / max) * (height - 30)}px`, minHeight: '3px', transition: 'height 0.4s ease' }} />
          <div style={{ fontSize: '0.55rem', color: '#666', marginTop: '3px', textAlign: 'center', lineHeight: 1.2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{monthLabel(d[xKey])}</div>
        </div>
      ))}
    </div>
  );
};

const MultiBar = ({ data, height = 140 }) => {
  if (!data?.length) return <div style={{ textAlign: 'center', color: '#bbb', padding: '2rem', fontSize: '0.85rem' }}>No data available</div>;
  const max = Math.max(...data.flatMap(d => [d.gross || 0, d.net || 0]), 1);
  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
        {[['Gross', '#e65100'], ['Net', '#2e7d32']].map(([l, c]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem' }}>
            <div style={{ width: '10px', height: '10px', background: c, borderRadius: '2px' }} />{l}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: `${height}px` }}>
        {data.slice(-8).map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '1px', alignItems: 'flex-end', width: '100%' }}>
              <div style={{ flex: 1, background: '#e65100', borderRadius: '2px 2px 0 0', height: `${((d.gross || 0) / max) * (height - 25)}px`, minHeight: '2px' }} />
              <div style={{ flex: 1, background: '#2e7d32', borderRadius: '2px 2px 0 0', height: `${((d.net || 0) / max) * (height - 25)}px`, minHeight: '2px' }} />
            </div>
            <div style={{ fontSize: '0.5rem', color: '#666', marginTop: '3px' }}>{monthLabel(d.month)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DonutChart = ({ data }) => {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (!total) return <div style={{ textAlign: 'center', color: '#bbb', padding: '2rem', fontSize: '0.85rem' }}>No compliance data</div>;
  let angle = 0;
  const slices = Object.entries(data).map(([key, val]) => {
    const pct = val / total;
    const start = angle;
    angle += pct * 2 * Math.PI;
    return { key, val, pct, start, end: angle, color: SC[key] || '#888' };
  });
  const toXY = (a, r) => [50 + r * Math.cos(a - Math.PI / 2), 50 + r * Math.sin(a - Math.PI / 2)];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <svg width="110" height="110" viewBox="0 0 100 100">
        {slices.map(s => {
          const [x1, y1] = toXY(s.start, 38);
          const [x2, y2] = toXY(s.end, 38);
          const large = s.end - s.start > Math.PI ? 1 : 0;
          return <path key={s.key} d={`M50,50 L${x1},${y1} A38,38 0 ${large},1 ${x2},${y2} Z`} fill={s.color} opacity="0.88" />;
        })}
        <circle cx="50" cy="50" r="23" fill="white" />
        <text x="50" y="53" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#333">{total}</text>
      </svg>
      <div>
        {slices.map(s => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', fontSize: '0.8rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: s.color }} />
            <span style={{ color: '#555' }}>{s.key}:</span><strong>{s.val}</strong>
            <span style={{ color: '#aaa', fontSize: '0.72rem' }}>({(s.pct * 100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [deptSalary, setDeptSalary] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [compliance, setCompliance] = useState({ summary: {}, records: [] });
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAnalyticsOverview(), getPayrollTrends(), getDepartmentSalary(), getCompanyComparison(), getComplianceStatus(), getAttendanceAnalytics()])
      .then(([o, t, d, c, comp, att]) => {
        setOverview(o.data.data);
        setTrends(t.data.data);
        setDeptSalary(d.data.data);
        setCompanies(c.data.data);
        setCompliance(comp.data.data);
        setAttendance(att.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ background: '#f0f2f8', minHeight: '100vh' }}><Navbar /><div style={{ textAlign: 'center', padding: '5rem', color: '#1a237e', fontSize: '1.1rem' }}>📊 Loading analytics...</div></div>;

  const kpis = [
    { icon: '🏢', label: 'Companies', value: overview?.companies ?? 0, color: '#1a237e' },
    { icon: '👥', label: 'Employees', value: overview?.employees ?? 0, color: '#1565c0' },
    { icon: '💰', label: "This Month's Payout", value: fmt(overview?.thisMonthPayout), color: '#2e7d32', sub: `${overview?.thisMonthPayrolls ?? 0} payrolls` },
    { icon: '📊', label: 'Avg Net Salary', value: fmt(Math.round(overview?.avgSalary ?? 0)), color: '#e65100' },
    { icon: '✅', label: 'Compliant', value: overview?.compliantCount ?? 0, color: '#00695c' },
    { icon: '📋', label: 'Total Records', value: overview?.totalPayrollRecords ?? 0, color: '#6a1b9a' },
  ];

  const attTotal = Object.values(attendance).reduce((a, b) => a + b, 0);
  const attColors = { Present: '#2e7d32', Absent: '#c62828', 'Half-Day': '#e65100', Leave: '#1565c0', WFH: '#00695c' };

  return (
    <div style={{ background: '#f0f2f8', minHeight: '100vh' }}>
      <Navbar />
      <div style={S.container}>
        <div style={S.header}>
          <div><h2 style={S.title}>📊 Analytics Dashboard</h2><p style={S.sub}>{companies.length === 1 ? `Real-time insights for ${companies[0].company}` : 'Real-time insights across all companies'}</p></div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {kpis.map(k => (
            <div key={k.label} style={{ background: '#fff', borderRadius: '12px', padding: '1.1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderLeft: `4px solid ${k.color}` }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{k.icon}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: '0.72rem', color: '#666', marginTop: '0.2rem' }}>{k.label}</div>
              {k.sub && <div style={{ fontSize: '0.65rem', color: '#aaa' }}>{k.sub}</div>}
            </div>
          ))}
        </div>

        {/* Row 1: Payroll + Compliance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={S.card}>
            <h3 style={S.cardTitle}>📈 Gross vs Net Payroll Trend</h3>
            <MultiBar data={trends} height={150} />
          </div>
          <div style={S.card}>
            <h3 style={S.cardTitle}>✅ Compliance Distribution</h3>
            <DonutChart data={compliance.summary || {}} />
          </div>
        </div>

        {/* Row 2: Dept Salary + Attendance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={S.card}>
            <h3 style={S.cardTitle}>🏬 Avg Salary by Department</h3>
            <BarChart data={deptSalary} xKey="department" yKey="avgSalary" color="#1565c0" height={140} />
          </div>
          <div style={S.card}>
            <h3 style={S.cardTitle}>📅 Attendance (This Month)</h3>
            {attTotal > 0 ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '100px', marginBottom: '0.5rem' }}>
                  {Object.entries(attendance).map(([status, count], i) => {
                    const maxVal = Math.max(...Object.values(attendance), 1);
                    return (
                      <div key={status} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                        <div style={{ fontSize: '0.6rem', color: '#888', marginBottom: '2px' }}>{count}</div>
                        <div style={{ width: '100%', background: attColors[status] || '#999', borderRadius: '3px 3px 0 0', height: `${(count / maxVal) * 75}px`, minHeight: '3px' }} />
                        <div style={{ fontSize: '0.55rem', color: '#666', marginTop: '3px', textAlign: 'center' }}>{status}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#888' }}>Total {attTotal} records this month</div>
              </div>
            ) : <div style={{ textAlign: 'center', color: '#bbb', padding: '2rem', fontSize: '0.85rem' }}>No attendance data this month</div>}
          </div>
        </div>

        {/* PF + ESI Trends */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={S.card}>
            <h3 style={S.cardTitle}>🏦 PF Deduction Trend</h3>
            <BarChart data={trends} xKey="month" yKey="pf" color="#6a1b9a" height={120} />
          </div>
          <div style={S.card}>
            <h3 style={S.cardTitle}>🏥 ESI Deduction Trend</h3>
            <BarChart data={trends} xKey="month" yKey="esi" color="#00695c" height={120} />
          </div>
        </div>

        {/* Company Comparison */}
        <div style={S.card}>
          <h3 style={S.cardTitle}>🏢 Company-wise Comparison</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr style={{ background: '#e8eaf6' }}>
                  {['Company', 'Industry', 'Employees', 'Total Payout', 'Avg per Employee', 'Compliance'].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {companies.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={S.td}><strong>{c.company}</strong></td>
                    <td style={S.td}><span style={{ background: '#e8eaf6', color: '#1a237e', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem' }}>{c.industry || '—'}</span></td>
                    <td style={S.td}>{c.employees}</td>
                    <td style={S.td}><strong>{fmt(c.totalPayout)}</strong></td>
                    <td style={S.td}>{fmt(c.avgPayout)}</td>
                    <td style={S.td}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', background: (SC[c.complianceStatus] || '#888') + '20', color: SC[c.complianceStatus] || '#888' }}>
                        {c.complianceStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {!companies.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>No company data yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Compliance Records */}
        {compliance.records?.length > 0 && (
          <div style={S.card}>
            <h3 style={S.cardTitle}>📋 Recent Compliance Records</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={S.table}>
                <thead>
                  <tr style={{ background: '#e8eaf6' }}>
                    {['Company', 'Month', 'PF', 'ESI', 'TDS', 'PT', 'Min Wage', 'LWF', 'Status'].map(h => <th key={h} style={S.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {compliance.records.slice(0, 10).map(r => (
                    <tr key={r._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={S.td}><strong>{r.companyId?.name || '—'}</strong></td>
                      <td style={S.td}>{r.month}</td>
                      {['pfFiled', 'esiFiled', 'tdsDeducted', 'professionalTaxFiled', 'minimumWageCompliance', 'labourWelfareFund'].map(k => (
                        <td key={k} style={{ ...S.td, textAlign: 'center' }}>{r[k] ? '✅' : '❌'}</td>
                      ))}
                      <td style={S.td}><span style={{ padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', background: (SC[r.status] || '#888') + '20', color: SC[r.status] || '#888' }}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  container: { padding: '1.75rem 2rem 3rem', maxWidth: '1480px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  title: { margin: 0, color: '#0f172a', fontSize: '1.75rem', letterSpacing: '-0.04em' },
  sub: { margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.9rem' },
  card: { background: 'rgba(255,255,255,0.78)', borderRadius: '22px', padding: '1.35rem', boxShadow: '0 18px 50px rgba(15,23,42,0.08)', border: '1px solid rgba(255,255,255,0.72)', backdropFilter: 'blur(18px)', marginBottom: '1.25rem' },
  cardTitle: { margin: '0 0 1rem', color: '#0f172a', fontSize: '1rem', fontWeight: '800', letterSpacing: '-0.02em' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' },
  th: { padding: '0.78rem 0.85rem', textAlign: 'left', fontSize: '0.72rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc' },
  td: { padding: '0.78rem 0.85rem', color: '#334155' },
};
