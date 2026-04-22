import { useState } from "react";

export default function ContactSales() {
  const [form, setForm] = useState({
    company: "",
    email: "",
    message: ""
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let newErrors = {};

    if (!form.company.trim()) {
      newErrors.company = "Company name is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!form.message.trim()) {
      newErrors.message = "Please enter your requirements";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setSuccess("");

    try {
      const res = await fetch("http://localhost:5000/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("✅ Your query is successful. Our team will contact you within 24 hours.");

        setForm({
          company: "",
          email: "",
          message: ""
        });
      } else {
        setSuccess("❌ Something went wrong. Please try again.");
      }

    } catch (err) {
      console.error(err);
      setSuccess("❌ Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <h2 style={S.title}>Contact Sales</h2>

        {success && (
          <div style={{
            ...S.success,
            background: success.includes("❌") ? "#ffebee" : "#e8f5e9",
            color: success.includes("❌") ? "#c62828" : "#2e7d32"
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          {/* Company */}
          <label style={S.label}>Company Name</label>
          <input
            style={S.input}
            name="company"
            value={form.company}
            onChange={handleChange}
          />
          {errors.company && <div style={S.error}>{errors.company}</div>}

          {/* Email */}
          <label style={S.label}>Work Email</label>
          <input
            style={S.input}
            name="email"
            value={form.email}
            onChange={handleChange}
          />
          {errors.email && <div style={S.error}>{errors.email}</div>}

          {/* Message */}
          <label style={S.label}>Requirements</label>
          <textarea
            style={S.textarea}
            name="message"
            value={form.message}
            onChange={handleChange}
          />
          {errors.message && <div style={S.error}>{errors.message}</div>}

          <button style={S.btn} disabled={loading}>
            {loading ? "Submitting..." : "Submit Request →"}
          </button>
        </form>
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f6fa"
  },

  card: {
    width: "420px",
    background: "#fff",
    padding: "2rem",
    borderRadius: "16px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.1)"
  },

  title: {
    fontSize: "1.6rem",
    color: "#1a237e",
    marginBottom: "1rem"
  },

  label: {
    fontSize: "0.8rem",
    fontWeight: "600",
    color: "#555",
    marginTop: "1rem",
    display: "block"
  },

  input: {
    width: "100%",
    padding: "0.75rem",
    border: "1.5px solid #e0e0e0",
    borderRadius: "8px",
    marginTop: "0.3rem"
  },

  textarea: {
    width: "100%",
    padding: "0.75rem",
    border: "1.5px solid #e0e0e0",
    borderRadius: "8px",
    marginTop: "0.3rem",
    minHeight: "90px"
  },

  btn: {
    width: "100%",
    marginTop: "1.5rem",
    padding: "0.9rem",
    background: "linear-gradient(135deg, #1a237e, #3949ab)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer"
  },

  error: {
    color: "#c62828",
    fontSize: "0.75rem",
    marginTop: "4px"
  },

  success: {
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontSize: "0.85rem"
  }
};