import { useState } from "react";
import { FiX } from "react-icons/fi";
import { planFeatureOptions } from "../../data/plansData";
import "./PlanModal.css";

const blankPlan = {
  name: "",
  slug: "",
  description: "",
  billingInterval: "month",
  currency: "₹",
  priceMonthly: 0,
  priceAnnual: 0,
  trialDays: 0,
  features: [],
  quotas: {
    teamSeats: 1,
    monthlyJobPosts: 0,
    aiQueriesPerDay: 0,
    apiAccess: false,
    apiRateLimit: 0,
  },
  gstEnabled: true,
  visible: true,
  status: "Active",
  badge: "New",
  activeSubscribers: 0,
};

const numericOrUnlimited = (value) => {
  if (String(value).trim().toLowerCase() === "unlimited") return "Unlimited";
  return Number(value);
};

const createPlanForm = (plan) => ({
  ...blankPlan,
  ...(plan ?? {}),
  slug: plan ? plan.slug ?? plan.id : "",
  quotas: { ...blankPlan.quotas, ...(plan?.quotas ?? {}) },
  features: [...(plan?.features ?? [])],
});

export default function PlanModal({ plan, plans, onClose, onSave }) {
  const [form, setForm] = useState(() => createPlanForm(plan));
  const [customFeature, setCustomFeature] = useState("");
  const [error, setError] = useState("");

  const updateQuota = (key, value) => {
    setForm((current) => ({
      ...current,
      quotas: { ...current.quotas, [key]: value },
    }));
  };

  const toggleFeature = (feature) => {
    setForm((current) => ({
      ...current,
      features: current.features.includes(feature)
        ? current.features.filter((item) => item !== feature)
        : [...current.features, feature],
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    const slug = form.slug.trim().toLowerCase().replaceAll(" ", "_");
    const monthlyPrice = Number(form.priceMonthly);
    const annualPrice = Number(form.priceAnnual);
    const trialDays = Number(form.trialDays);
    const quotas = {
      teamSeats: numericOrUnlimited(form.quotas.teamSeats),
      monthlyJobPosts: numericOrUnlimited(form.quotas.monthlyJobPosts),
      aiQueriesPerDay: numericOrUnlimited(form.quotas.aiQueriesPerDay),
      apiAccess: form.quotas.apiAccess,
      apiRateLimit: numericOrUnlimited(form.quotas.apiRateLimit),
    };
    const quotaValues = [
      quotas.teamSeats,
      quotas.monthlyJobPosts,
      quotas.aiQueriesPerDay,
      quotas.apiRateLimit,
    ];

    if (!form.name.trim() || !slug) {
      setError("Plan name and tier slug are required.");
      return;
    }
    if (
      plans.some(
        (existing) =>
          (existing.slug ?? existing.id) === slug && existing.id !== plan?.id,
      )
    ) {
      setError("That tier slug is already in use.");
      return;
    }
    if (!Number.isFinite(monthlyPrice) || monthlyPrice < 0) {
      setError("Enter a valid non-negative monthly price.");
      return;
    }
    if (!Number.isFinite(annualPrice) || annualPrice < 0) {
      setError("Enter a valid non-negative annual price.");
      return;
    }
    if (
      !Number.isInteger(trialDays) ||
      trialDays < 0 ||
      quotaValues.some(
        (value) =>
          value !== "Unlimited" &&
          (!Number.isInteger(value) || value < 0),
      )
    ) {
      setError("Trial days and quotas must be non-negative numbers or Unlimited.");
      return;
    }

    onSave({
      ...form,
      id: plan?.id ?? slug,
      slug,
      name: form.name.trim(),
      description: form.description.trim(),
      priceMonthly: monthlyPrice,
      priceAnnual: annualPrice,
      trialDays,
      quotas,
    });
  };

  return (
    <div className="plan-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="plan-modal" role="dialog" aria-modal="true" aria-labelledby="plan-modal-title">
        <header className="plan-modal-header">
          <div>
            <h2 id="plan-modal-title">{plan ? "Edit plan" : "Create new plan"}</h2>
            <p>Configure pricing, access, and limits for this subscription tier.</p>
          </div>
          <button type="button" className="plan-icon-button" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </header>
        <form onSubmit={submit}>
          <div className="plan-form-grid">
            <label>Plan name
              <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Growth" />
            </label>
            <label>Tier slug / code
              <input required value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="plan_growth" />
            </label>
            <label className="plan-form-wide">Description
              <textarea rows="2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>
            <label>Billing frequency
              <select value={form.billingInterval} onChange={(event) => setForm({ ...form, billingInterval: event.target.value })}>
                <option value="month">Monthly</option>
                <option value="quarter">Quarterly</option>
                <option value="year">Annually</option>
              </select>
            </label>
            <label>Currency
              <select value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}>
                <option value="₹">INR (₹)</option>
                <option value="$">USD ($)</option>
                <option value="€">EUR (€)</option>
                <option value="£">GBP (£)</option>
              </select>
            </label>
            <label>Monthly price
              <input type="number" min="0" step="0.01" required value={form.priceMonthly} onChange={(event) => setForm({ ...form, priceMonthly: event.target.value })} />
            </label>
            <label>Annual price
              <input type="number" min="0" step="0.01" required value={form.priceAnnual} onChange={(event) => setForm({ ...form, priceAnnual: event.target.value })} />
            </label>
            <label>Trial period (days)
              <input type="number" min="0" step="1" value={form.trialDays} onChange={(event) => setForm({ ...form, trialDays: event.target.value })} />
            </label>
            <label>Max users / seats
              <input value={form.quotas.teamSeats} onChange={(event) => updateQuota("teamSeats", event.target.value)} />
            </label>
            <label>Monthly job imports
              <input value={form.quotas.monthlyJobPosts} onChange={(event) => updateQuota("monthlyJobPosts", event.target.value)} />
            </label>
            <label>AI queries / day
              <input value={form.quotas.aiQueriesPerDay} onChange={(event) => updateQuota("aiQueriesPerDay", event.target.value)} />
            </label>
            <label>API rate limit (req/min)
              <input value={form.quotas.apiRateLimit} onChange={(event) => updateQuota("apiRateLimit", event.target.value)} />
            </label>
          </div>

          <fieldset className="plan-feature-fieldset">
            <legend>Features & entitlements</legend>
            <div className="plan-feature-options">
              {planFeatureOptions.map((feature) => (
                <label key={feature} className="plan-check-label">
                  <input type="checkbox" checked={form.features.includes(feature)} onChange={() => toggleFeature(feature)} />
                  {feature}
                </label>
              ))}
              {form.features.filter((feature) => !planFeatureOptions.includes(feature)).map((feature) => (
                <label key={feature} className="plan-check-label">
                  <input type="checkbox" checked onChange={() => toggleFeature(feature)} />
                  {feature}
                </label>
              ))}
            </div>
            <div className="plan-add-feature">
              <input value={customFeature} onChange={(event) => setCustomFeature(event.target.value)} placeholder="Add a custom feature" />
              <button type="button" onClick={() => {
                const feature = customFeature.trim();
                if (feature && !form.features.includes(feature)) toggleFeature(feature);
                setCustomFeature("");
              }}>Add feature</button>
            </div>
          </fieldset>

          <div className="plan-switches">
            <label className="plan-switch-label">
              <input type="checkbox" checked={form.gstEnabled} onChange={(event) => setForm({ ...form, gstEnabled: event.target.checked })} />
              GST applies
            </label>
            <label className="plan-switch-label">
              <input type="checkbox" checked={form.visible} onChange={(event) => setForm({ ...form, visible: event.target.checked })} />
              Publicly visible in checkout
            </label>
            <label className="plan-switch-label">
              <input type="checkbox" checked={form.quotas.apiAccess} onChange={(event) => updateQuota("apiAccess", event.target.checked)} />
              API access enabled
            </label>
          </div>
          {error && <p className="plan-form-error" role="alert">{error}</p>}
          <footer className="plan-modal-footer">
            <button type="button" className="plan-secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="plan-primary-button">{plan ? "Save changes" : "Create plan"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}
