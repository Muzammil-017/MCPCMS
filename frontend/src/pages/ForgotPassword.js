import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import { AuthCard, S } from './ResetPassword';

export default function ForgotPassword() {
  const [params] = useSearchParams();
  const backTo = params.get('from') === 'employee' ? '/employee-login' : '/';
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await forgotPassword({ email });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Forgot password" subtitle="Enter your account email and we'll send you a link to reset your password.">
      {message ? (
        <div style={{ ...S.alert, ...S.ok }}>{message}</div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <div style={{ ...S.alert, ...S.err }}>{error}</div>}
          <label style={S.label}>Email address
            <input style={S.input} type="email" required autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="you@company.com" />
          </label>
          <button type="submit" style={S.primary} disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</button>
        </form>
      )}
      <p style={S.footer}><Link to={backTo} style={S.link}>Back to sign in</Link></p>
    </AuthCard>
  );
}
