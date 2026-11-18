import { useEffect, useState } from 'react';
import { monthLabel, compactAmount } from '../utils/chartFormat';
import Navbar from '../components/Navbar';
import {
  getAnalyticsOverview,
  getPayrollTrends,
  getCompanyComparison,
  getPayroll,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const money = value => `INR ${Number(value || 0).toLocaleString('en-IN')}`;

const MiniBars = ({ data, yKey, color }) => {
  const slice = (data || []).slice(-8);
  const max = Math.max(...slice.map(item => item[yKey] || 0), 1);

  if (!slice.length) return <div className="dash-empty-mini">Run payroll to see trends</div>;

  return (
    <div className="dash-bars">
      {slice.map((item, index) => {
        const height = Math.max(((item[yKey] || 0) / max) * 100, 4);
        return (
          <div className="dash-bar-col" key={`${item.month}-${index}`}>
            <span>{compactAmount(item[yKey])}</span>
            <div className="dash-bar-track">
              <div className="dash-bar-fill" style={{ height: `${height}%`, background: color }} />
            </div>
            <small>{monthLabel(item.month) || '-'}</small>
          </div>
        );
      })}
    </div>
  );
};

const KpiCard = ({ label, value, sub, accent }) => (
  <div className="dash-kpi" style={{ '--accent': accent }}>
    <div className="dash-kpi-glow" />
    <div className="dash-kpi-top">
      <span>{label}</span>
      <i />
    </div>
    <strong>{value}</strong>
    {sub && <small>{sub}</small>}
  </div>
);

const StatusPill = ({ status }) => {
  const key = status || 'Not Checked';
  const styles = {
    Compliant: 'ok',
    Partial: 'warn',
    'Non-Compliant': 'bad',
  };
  return <span className={`dash-status ${styles[key] || 'neutral'}`}>{key}</span>;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAnalyticsOverview(),
      getPayrollTrends(),
      getCompanyComparison(),
      getPayroll({}),
    ])
      .then(([overviewRes, trendsRes, companyRes, payrollRes]) => {
        setOverview(overviewRes.data.data);
        setTrends(trendsRes.data.data);
        setCompanies(companyRes.data.data);
        setPayrolls(payrollRes.data.payrolls || payrollRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const payrollsThisMonth = payrolls.filter(item => item.payrollMonth === currentMonth);
  const processedCount = payrollsThisMonth.filter(item => item.status === 'Processed').length;
  const holdCount = payrollsThisMonth.filter(item => item.status === 'Hold').length;
  const paidCount = payrollsThisMonth.filter(item => item.status === 'Paid').length;
  const complianceAttention = companies.filter(item => item.complianceStatus && item.complianceStatus !== 'Compliant').length;
  const topCompany = [...companies].sort((a, b) => (b.totalPayout || 0) - (a.totalPayout || 0))[0];
  const latestTrend = trends[trends.length - 1];
  const previousTrend = trends[trends.length - 2];
  const movement = latestTrend && previousTrend
    ? (((latestTrend.net || 0) - (previousTrend.net || 0)) / Math.max(previousTrend.net || 1, 1)) * 100
    : null;

  const kpis = [
    { label: 'Companies', value: overview?.companies ?? '-', accent: '#7c3aed' },
    { label: 'Active employees', value: overview?.employees ?? '-', accent: '#2563eb' },
    { label: 'This month payout', value: overview ? money(overview.thisMonthPayout) : '-', sub: `${overview?.thisMonthPayrolls ?? 0} records`, accent: '#10b981' },
    { label: 'Average net salary', value: overview ? money(Math.round(overview.avgSalary)) : '-', accent: '#f59e0b' },
    { label: 'Compliant companies', value: overview?.compliantCount ?? '-', accent: '#14b8a6' },
    { label: 'Payroll records', value: overview?.totalPayrollRecords ?? '-', accent: '#ec4899' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .dash-root {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(124,58,237,0.18), transparent 32rem),
            radial-gradient(circle at top right, rgba(37,99,235,0.16), transparent 28rem),
            linear-gradient(180deg, #f7f8fc 0%, #eef2f7 100%);
          color: #111827;
          font-family: Inter, system-ui, sans-serif;
        }
        .dash-page {
          max-width: 1480px;
          margin: 0 auto;
          padding: 28px;
        }
        .dash-hero {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }
        .dash-eyebrow {
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .dash-title {
          margin: 7px 0 0;
          font-size: 32px;
          letter-spacing: -0.04em;
          color: #0f172a;
        }
        .dash-sub {
          margin-top: 7px;
          color: #64748b;
          font-size: 14px;
        }
        .dash-hero-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .dash-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 13px;
          border-radius: 999px;
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(148,163,184,0.25);
          box-shadow: 0 12px 30px rgba(15,23,42,0.06);
          color: #475569;
          font-size: 13px;
          font-weight: 700;
          backdrop-filter: blur(14px);
        }
        .dash-pill-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 0 4px rgba(34,197,94,0.14);
        }
        .dash-kpi-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }
        .dash-kpi {
          position: relative;
          min-height: 132px;
          padding: 18px;
          border-radius: 22px;
          background: rgba(255,255,255,0.72);
          border: 1px solid rgba(255,255,255,0.72);
          box-shadow: 0 18px 50px rgba(15,23,42,0.08);
          overflow: hidden;
          backdrop-filter: blur(18px);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .dash-kpi:hover {
          transform: translateY(-3px);
          box-shadow: 0 24px 60px rgba(15,23,42,0.12);
        }
        .dash-kpi-glow {
          position: absolute;
          inset: auto -30px -44px auto;
          width: 110px;
          height: 110px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--accent), transparent 72%);
        }
        .dash-kpi-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: #64748b;
          font-size: 13px;
          font-weight: 750;
        }
        .dash-kpi-top i {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: var(--accent);
          box-shadow: 0 0 0 5px color-mix(in srgb, var(--accent), transparent 86%);
          flex-shrink: 0;
        }
        .dash-kpi strong {
          display: block;
          margin-top: 18px;
          color: #0f172a;
          font-size: 25px;
          letter-spacing: -0.04em;
        }
        .dash-kpi small {
          display: block;
          margin-top: 4px;
          color: #94a3b8;
          font-weight: 700;
        }
        .dash-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(360px, 0.72fr);
          gap: 20px;
          align-items: stretch;
        }
        .dash-panel {
          background: rgba(255,255,255,0.76);
          border: 1px solid rgba(255,255,255,0.75);
          border-radius: 24px;
          box-shadow: 0 18px 50px rgba(15,23,42,0.08);
          backdrop-filter: blur(18px);
          overflow: hidden;
        }
        .dash-panel-pad { padding: 22px; }
        .dash-panel-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 16px;
        }
        .dash-panel-title h3 {
          margin: 0;
          color: #0f172a;
          font-size: 16px;
          letter-spacing: -0.02em;
        }
        .dash-panel-title span {
          color: #94a3b8;
          font-size: 12px;
          font-weight: 750;
        }
        .dash-chart-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        .dash-bars {
          height: 230px;
          display: flex;
          align-items: flex-end;
          gap: 11px;
          padding-top: 12px;
        }
        .dash-bar-col {
          flex: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          min-width: 0;
        }
        .dash-bar-col span {
          color: #94a3b8;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .dash-bar-col small {
          color: #64748b;
          font-size: 11px;
          font-weight: 750;
          margin-top: 7px;
        }
        .dash-bar-track {
          width: 100%;
          height: 170px;
          display: flex;
          align-items: flex-end;
          border-radius: 14px;
          background: rgba(148,163,184,0.12);
          overflow: hidden;
        }
        .dash-bar-fill {
          width: 100%;
          border-radius: 14px 14px 0 0;
          transition: height 0.35s ease;
        }
        .dash-empty-mini {
          height: 230px;
          display: grid;
          place-items: center;
          color: #94a3b8;
          background: rgba(248,250,252,0.72);
          border-radius: 18px;
          border: 1px dashed #cbd5e1;
          font-weight: 700;
        }
        .dash-action-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .dash-action {
          padding: 16px;
          border-radius: 18px;
          background: rgba(248,250,252,0.72);
          border: 1px solid rgba(226,232,240,0.9);
        }
        .dash-action strong {
          display: block;
          color: #0f172a;
          font-size: 22px;
          letter-spacing: -0.03em;
        }
        .dash-action span {
          display: block;
          margin-top: 8px;
          color: #475569;
          font-size: 13px;
          font-weight: 750;
        }
        .dash-action small {
          display: block;
          color: #94a3b8;
          margin-top: 4px;
          line-height: 1.45;
        }
        .dash-snapshot {
          height: 100%;
          background: linear-gradient(145deg, #111827, #1e1b4b 62%, #312e81);
          color: #fff;
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 24px 70px rgba(49,46,129,0.25);
        }
        .dash-snapshot h3 {
          margin: 0 0 22px;
          color: #fff;
          font-size: 16px;
        }
        .dash-snap-block {
          padding: 18px 0;
          border-top: 1px solid rgba(255,255,255,0.11);
        }
        .dash-snap-block:first-of-type { border-top: none; padding-top: 0; }
        .dash-snap-label {
          color: #a5b4fc;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 800;
        }
        .dash-snap-value {
          margin-top: 8px;
          color: #fff;
          font-weight: 800;
          font-size: 18px;
          letter-spacing: -0.03em;
        }
        .dash-snap-note {
          margin-top: 5px;
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.55;
        }
        .dash-table-wrap { margin-top: 20px; }
        .dash-table-head {
          padding: 20px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(226,232,240,0.78);
        }
        .dash-table-head h3 {
          margin: 0;
          color: #0f172a;
          font-size: 16px;
        }
        .dash-table-scroll { overflow-x: auto; }
        .dash-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 760px;
        }
        .dash-table th {
          padding: 13px 18px;
          text-align: left;
          color: #64748b;
          background: rgba(248,250,252,0.8);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .dash-table td {
          padding: 15px 18px;
          color: #334155;
          border-top: 1px solid rgba(226,232,240,0.72);
          font-size: 13px;
        }
        .dash-table tr:hover td { background: rgba(248,250,252,0.62); }
        .dash-status {
          display: inline-flex;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
        }
        .dash-status.ok { color: #166534; background: #dcfce7; }
        .dash-status.warn { color: #92400e; background: #fef3c7; }
        .dash-status.bad { color: #991b1b; background: #fee2e2; }
        .dash-status.neutral { color: #475569; background: #e2e8f0; }
        .dash-loading {
          height: 130px;
          border-radius: 22px;
          background: linear-gradient(90deg, rgba(255,255,255,0.52), rgba(255,255,255,0.92), rgba(255,255,255,0.52));
          background-size: 200% 100%;
          animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }
        @media (max-width: 1200px) {
          .dash-kpi-grid { grid-template-columns: repeat(3, 1fr); }
          .dash-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 800px) {
          .dash-page { padding: 18px; }
          .dash-hero { align-items: flex-start; flex-direction: column; }
          .dash-title { font-size: 25px; }
          .dash-kpi-grid, .dash-chart-row, .dash-action-grid { grid-template-columns: 1fr; }
          .dash-bars { height: 190px; }
        }
      `}</style>

      <div className="dash-root">
        <Navbar />
        <main className="dash-page">
          <header className="dash-hero">
            <div>
              <div className="dash-eyebrow">Payroll command center</div>
              <h1 className="dash-title">Welcome back, {user?.name || 'Admin'}</h1>
              <div className="dash-sub">Production overview for {today}</div>
            </div>
            <div className="dash-hero-actions">
              <span className="dash-pill"><i className="dash-pill-dot" /> All systems operational</span>
              <span className="dash-pill">{currentMonth}</span>
            </div>
          </header>

          {loading ? (
            <div className="dash-kpi-grid">
              {Array.from({ length: 6 }).map((_, index) => <div className="dash-loading" key={index} />)}
            </div>
          ) : (
            <div className="dash-kpi-grid">
              {kpis.map(item => <KpiCard key={item.label} {...item} />)}
            </div>
          )}

          <section className="dash-grid">
            <div>
              <div className="dash-chart-row">
                <div className="dash-panel dash-panel-pad">
                  <div className="dash-panel-title">
                    <h3>Net payroll trend</h3>
                    <span>Last 8 months</span>
                  </div>
                  <MiniBars data={trends} yKey="net" color="linear-gradient(180deg, #818cf8, #4f46e5)" />
                </div>
                <div className="dash-panel dash-panel-pad">
                  <div className="dash-panel-title">
                    <h3>Gross salary trend</h3>
                    <span>Last 8 months</span>
                  </div>
                  <MiniBars data={trends} yKey="gross" color="linear-gradient(180deg, #fbbf24, #f97316)" />
                </div>
              </div>

              <div className="dash-panel dash-panel-pad">
                <div className="dash-panel-title">
                  <h3>Action center</h3>
                  <span>{currentMonth}</span>
                </div>
                <div className="dash-action-grid">
                  <div className="dash-action"><strong>{processedCount}</strong><span>Waiting review</span><small>Processed payroll records</small></div>
                  <div className="dash-action"><strong>{holdCount}</strong><span>Payroll on hold</span><small>Resolve salary or attendance blockers</small></div>
                  <div className="dash-action"><strong>{complianceAttention}</strong><span>Compliance gaps</span><small>Companies not fully compliant</small></div>
                  <div className="dash-action"><strong>{paidCount}</strong><span>Already paid</span><small>Paid entries in current month</small></div>
                </div>
              </div>
            </div>

            <aside className="dash-snapshot">
              <h3>Executive snapshot</h3>
              <div className="dash-snap-block">
                <div className="dash-snap-label">Highest payout company</div>
                <div className="dash-snap-value">{topCompany?.company || 'No data yet'}</div>
                <div className="dash-snap-note">{topCompany ? `Total payout: ${money(topCompany.totalPayout)}` : 'Run payroll to unlock this insight.'}</div>
              </div>
              <div className="dash-snap-block">
                <div className="dash-snap-label">Net payroll movement</div>
                <div className="dash-snap-value">{movement === null ? '' : `${movement >= 0 ? '+' : ''}${movement.toFixed(1)}%`}</div>
                <div className="dash-snap-note">{latestTrend ? `${latestTrend.month} closed at ${money(latestTrend.net)}` : 'Payroll trend data will appear here.'}</div>
              </div>
              <div className="dash-snap-block">
                <div className="dash-snap-label">Focus for today</div>
                <div className="dash-snap-note">
                  {holdCount > 0
                    ? 'Review hold payroll records before payslips are released.'
                    : complianceAttention > 0
                      ? 'Close compliance gaps before month-end reporting.'
                      : 'Operations look healthy. Good time to export reports.'}
                </div>
              </div>
            </aside>
          </section>

          <section className="dash-panel dash-table-wrap">
            <div className="dash-table-head">
              <h3>Company overview</h3>
              <span className="dash-pill">{companies.length} companies</span>
            </div>
            <div className="dash-table-scroll">
              <table className="dash-table">
                <thead>
                  <tr>
                    {['Company', 'Industry', 'Employees', 'Total payout', 'Avg payout', 'Compliance'].map(header => <th key={header}>{header}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company, index) => (
                    <tr key={`${company.company}-${index}`}>
                      <td><strong>{company.company}</strong></td>
                      <td>{company.industry || '-'}</td>
                      <td>{company.employees}</td>
                      <td>{money(company.totalPayout)}</td>
                      <td>{money(company.avgPayout)}</td>
                      <td><StatusPill status={company.complianceStatus} /></td>
                    </tr>
                  ))}
                  {!companies.length && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No company data available yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
