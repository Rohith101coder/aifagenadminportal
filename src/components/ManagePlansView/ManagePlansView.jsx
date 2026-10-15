import { useMemo, useState } from "react";
import {
  FiArchive,
  FiCheck,
  FiEdit2,
  FiMoreVertical,
  FiPlus,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { initialPlanSubscribers } from "../../data/plansData";
import { matchesGlobalSearch } from "../../data/globalSearch";
import PlanModal from "../PlanModal/PlanModal";
import "./ManagePlansView.css";

const currencyValue = (amount, currency) =>
  `${currency}${Number(amount || 0).toLocaleString("en-IN")}`;

const quotaLabel = (value) =>
  value === "Unlimited" ? "Unlimited" : Number(value || 0).toLocaleString("en-IN");

export default function ManagePlansView({ plans, onPlansChange, globalSearchTerm = "" }) {
  const [billing, setBilling] = useState("month");
  const [editingPlan, setEditingPlan] = useState(null);
  const [menuPlanId, setMenuPlanId] = useState(null);
  const [subscriberPlanId, setSubscriberPlanId] = useState(null);
  const [subscribers, setSubscribers] = useState(initialPlanSubscribers);
  const [migrationTargets, setMigrationTargets] = useState({});

  const visiblePlans = plans.filter((plan) =>
    matchesGlobalSearch(plan, globalSearchTerm) ||
    subscribers.some((subscriber) => subscriber.planId === plan.id && matchesGlobalSearch(subscriber, globalSearchTerm)),
  );
  const activePlans = plans.filter((plan) => plan.status === "Active");
  const mrrByCurrency = useMemo(
    () =>
      activePlans.reduce((totals, plan) => {
        const currency = plan.currency || "₹";
        totals.set(
          currency,
          (totals.get(currency) ?? 0) +
            Number(plan.priceMonthly || 0) * Number(plan.activeSubscribers || 0),
        );
        return totals;
      }, new Map()),
    [activePlans],
  );
  const totalMrr = [...mrrByCurrency.entries()]
    .map(([currency, amount]) => currencyValue(amount, currency))
    .join(" + ");
  const selectedSubscriberPlan = plans.find((plan) => plan.id === subscriberPlanId);
  const selectedSubscribers = subscribers.filter((subscriber) =>
    subscriber.planId === subscriberPlanId && subscriber.status === "Active" && matchesGlobalSearch(subscriber, globalSearchTerm),
  );

  const savePlan = (plan) => {
    const existing = plans.some((item) => item.id === plan.id);
    onPlansChange((current) =>
      existing
        ? current.map((item) => (item.id === plan.id ? plan : item))
        : [...current, plan],
    );
    setEditingPlan(null);
  };

  const toggleStatus = (plan) => {
    const nextStatus = plan.status === "Active" ? "Inactive" : "Active";
    onPlansChange((current) =>
      current.map((item) =>
        item.id === plan.id ? { ...item, status: nextStatus } : item,
      ),
    );
  };

  const duplicatePlan = (plan) => {
    const newId = `${plan.id}_copy`;
    let copyNumber = 2;
    while (plans.some((item) => item.id === `${newId}_${copyNumber}`)) {
      copyNumber += 1;
    }
    const uniqueId = plans.some((item) => item.id === newId)
      ? `${newId}_${copyNumber}`
      : newId;
    const newSlug = `${plan.slug ?? plan.id}_copy`;
    let slugCopyNumber = 2;
    while (
      plans.some(
        (item) =>
          (item.slug ?? item.id) === `${newSlug}_${slugCopyNumber}`,
      )
    ) {
      slugCopyNumber += 1;
    }
    const uniqueSlug = plans.some(
      (item) => (item.slug ?? item.id) === newSlug,
    )
      ? `${newSlug}_${slugCopyNumber}`
      : newSlug;
    onPlansChange((current) => [
      ...current,
      {
        ...plan,
        id: uniqueId,
        slug: uniqueSlug,
        name: `${plan.name} copy`,
        badge: "New",
        status: "Inactive",
        activeSubscribers: 0,
        mrr: `${plan.currency}0`,
        features: [...plan.features],
        quotas: { ...plan.quotas },
      },
    ]);
    setMenuPlanId(null);
  };

  const archivePlan = (plan) => {
    if (!window.confirm(`Archive ${plan.name}? It will be hidden from checkout.`)) return;
    onPlansChange((current) =>
      current.map((item) =>
        item.id === plan.id ? { ...item, status: "Archived", visible: false } : item,
      ),
    );
    setMenuPlanId(null);
  };

  const toggleGst = (plan) => {
    onPlansChange((current) =>
      current.map((item) =>
        item.id === plan.id
          ? { ...item, gstEnabled: !item.gstEnabled }
          : item,
      ),
    );
  };

  const migrateSubscriber = (subscriber) => {
    const planId = migrationTargets[subscriber.id];
    if (!planId || planId === subscriber.planId) return;
    const target = plans.find((plan) => plan.id === planId);
    if (!target || target.status !== "Active") return;
    setSubscribers((current) =>
      current.map((item) =>
        item.id === subscriber.id ? { ...item, planId } : item,
      ),
    );
    onPlansChange((current) =>
      current.map((plan) => {
        if (plan.id === subscriber.planId) {
          return {
            ...plan,
            activeSubscribers: Math.max(0, Number(plan.activeSubscribers || 0) - 1),
          };
        }
        if (plan.id === planId) {
          return {
            ...plan,
            activeSubscribers: Number(plan.activeSubscribers || 0) + 1,
          };
        }
        return plan;
      }),
    );
  };

  const cancelSubscriber = (subscriber) => {
    if (!window.confirm(`Cancel ${subscriber.name}'s subscription?`)) return;
    setSubscribers((current) =>
      current.map((item) =>
        item.id === subscriber.id ? { ...item, status: "Cancelled" } : item,
      ),
    );
    onPlansChange((current) =>
      current.map((plan) =>
        plan.id === subscriber.planId
          ? {
              ...plan,
              activeSubscribers: Math.max(
                0,
                Number(plan.activeSubscribers || 0) - 1,
              ),
            }
          : plan,
      ),
    );
  };

  return (
    <section className="manage-plans-view">
      <div className="manage-plans-heading-row">
        <div>
          <h2>Plans & tiers</h2>
          <p>Configure subscription pricing, entitlements, and availability.</p>
        </div>
        <button className="manage-create-plan" onClick={() => setEditingPlan(false)}>
          <FiPlus size={15} /> Create New Plan
        </button>
      </div>

      <div className="plans-summary-row">
        <div className="plans-summary-card">
          <span>Total active plans</span>
          <strong>{activePlans.length}</strong>
          <small>Available subscription tiers</small>
        </div>
        <div className="plans-summary-card">
          <span>Total MRR from plans</span>
          <strong>{totalMrr || "₹0"}</strong>
          <small>Based on active subscriber counts</small>
        </div>
        <div className="plans-summary-card">
          <span>Active subscribers</span>
          <strong>{activePlans.reduce((total, plan) => total + Number(plan.activeSubscribers || 0), 0).toLocaleString("en-IN")}</strong>
          <small>Across active plans</small>
        </div>
      </div>

      <div className="plans-grid-toolbar">
        <span className="plans-grid-label">{plans.length} plans configured</span>
        <div className="plans-billing-toggle" aria-label="Billing display period">
          <button className={billing === "month" ? "selected" : ""} onClick={() => setBilling("month")}>Monthly</button>
          <button className={billing === "year" ? "selected" : ""} onClick={() => setBilling("year")}>Annually (Save 15%)</button>
        </div>
      </div>

      <div className="plans-card-grid">
        {visiblePlans.map((plan) => {
          const annual = billing === "year";
          const price = annual ? plan.priceAnnual : plan.priceMonthly;
          const isActive = plan.status === "Active";
          const mrr = Number(plan.priceMonthly || 0) * Number(plan.activeSubscribers || 0);
          return (
            <article className={`subscription-plan-card ${plan.status.toLowerCase()}`} key={plan.id}>
              <div className="plan-card-topline">
                <span className={`plan-badge ${plan.badge.toLowerCase().replaceAll(" ", "-")}`}>{plan.badge}</span>
                <div className="plan-card-menu-wrap">
                  <button className="plan-menu-trigger" aria-label={`Actions for ${plan.name}`} aria-expanded={menuPlanId === plan.id} onClick={() => setMenuPlanId((current) => current === plan.id ? null : plan.id)}>
                    <FiMoreVertical />
                  </button>
                  {menuPlanId === plan.id && <div className="plan-action-menu">
                    <button onClick={() => { setEditingPlan(plan); setMenuPlanId(null); }}><FiEdit2 /> Edit Plan</button>
                    <button onClick={() => { setSubscriberPlanId(plan.id); setMenuPlanId(null); }}><FiUsers /> View Subscribers</button>
                    <button onClick={() => duplicatePlan(plan)}><FiPlus /> Duplicate</button>
                    <button onClick={() => archivePlan(plan)}><FiArchive /> Archive</button>
                  </div>}
                </div>
              </div>

              <div className="plan-card-title-row">
                <div>
                  <h3>{plan.name}</h3>
                  <p>{plan.description}</p>
                </div>
              </div>
              <div className="plan-price-line">
                <strong>{currencyValue(price, plan.currency)}</strong>
                <span>/{annual ? "year" : "month"}</span>
              </div>
              <div className="plan-annual-price">
                {annual
                  ? `${currencyValue(plan.priceMonthly, plan.currency)} monthly equivalent`
                  : `${currencyValue(plan.priceAnnual, plan.currency)} billed annually`}
              </div>

              <div className="plan-gst-toggle">
                <span>GST {plan.gstEnabled ? "included at checkout" : "not applied"}</span>
                <button type="button" role="switch" aria-checked={Boolean(plan.gstEnabled)} aria-label={`Toggle GST for ${plan.name}`} className={`plan-switch ${plan.gstEnabled ? "on" : ""}`} onClick={() => toggleGst(plan)}>
                  <span />
                </button>
              </div>

              <div className="plan-subscriber-metrics">
                <div><strong>{Number(plan.activeSubscribers || 0).toLocaleString("en-IN")}</strong><span>active subscribers</span></div>
                <div><strong>{currencyValue(mrr, plan.currency)}</strong><span>estimated MRR</span></div>
              </div>

              <div className="plan-limits">
                <span className="plan-section-caption">Plan limits</span>
                <div><span>Team seats</span><strong>{quotaLabel(plan.quotas?.teamSeats)}</strong></div>
                <div><span>Job posts / month</span><strong>{quotaLabel(plan.quotas?.monthlyJobPosts)}</strong></div>
                <div><span>AI queries / day</span><strong>{quotaLabel(plan.quotas?.aiQueriesPerDay)}</strong></div>
                <div><span>API rate limit</span><strong>{quotaLabel(plan.quotas?.apiRateLimit)}{plan.quotas?.apiRateLimit ? " req/min" : ""}</strong></div>
              </div>

              <div className="plan-entitlements">
                <span className="plan-section-caption">Included features</span>
                <ul>
                  {plan.features.map((feature) => <li key={feature}><FiCheck size={13} />{feature}</li>)}
                </ul>
              </div>

              <div className="plan-card-footer">
                <button className="plan-view-subscribers" onClick={() => setSubscriberPlanId(plan.id)}>
                  <FiUsers size={14} /> View Subscribers
                </button>
                <button type="button" role="switch" aria-checked={isActive} aria-label={`${isActive ? "Deactivate" : "Activate"} ${plan.name}`} className={`plan-switch ${isActive ? "on" : ""}`} onClick={() => toggleStatus(plan)}>
                  <span />
                </button>
                <span className={`plan-status-label ${plan.status.toLowerCase()}`}>{plan.status}</span>
              </div>
              {!plan.visible && <div className="plan-visibility-note"><FiX size={12} /> Private in checkout</div>}
            </article>
          );
        })}
      </div>

      {editingPlan !== null && (
        <PlanModal
          key={editingPlan ? editingPlan.id : "new"}
          plan={editingPlan || null}
          plans={plans}
          onClose={() => setEditingPlan(null)}
          onSave={savePlan}
        />
      )}

      {selectedSubscriberPlan && (
        <div className="subscriber-inspector-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSubscriberPlanId(null);
        }}>
          <aside className="subscriber-inspector" role="dialog" aria-modal="true" aria-labelledby="subscriber-inspector-title">
            <header>
              <div>
                <span className="subscriber-inspector-kicker">Plan subscribers</span>
                <h2 id="subscriber-inspector-title">{selectedSubscriberPlan.name}</h2>
                <p>{selectedSubscribers.length} active member{selectedSubscribers.length === 1 ? "" : "s"} shown in this demo</p>
              </div>
              <button className="plan-icon-button" aria-label="Close subscribers" onClick={() => setSubscriberPlanId(null)}><FiX /></button>
            </header>
            <div className="subscriber-list">
              {selectedSubscribers.length ? selectedSubscribers.map((subscriber) => (
                <article className="subscriber-row" key={subscriber.id}>
                  <div className="subscriber-avatar">{subscriber.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div>
                  <div className="subscriber-info">
                    <strong>{subscriber.name}</strong>
                    <span>{subscriber.email}</span>
                    <small>Renews {subscriber.renewalDate}</small>
                  </div>
                  <span className="subscriber-active-pill">{subscriber.status}</span>
                  <div className="subscriber-actions">
                    <label>
                      <span className="sr-only">Migrate {subscriber.name} to another plan</span>
                      <select value={migrationTargets[subscriber.id] ?? subscriber.planId} onChange={(event) => setMigrationTargets((current) => ({ ...current, [subscriber.id]: event.target.value }))}>
                        {plans.filter((plan) => plan.status === "Active" && plan.id !== subscriber.planId).map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
                        <option value={subscriber.planId}>{selectedSubscriberPlan.name}</option>
                      </select>
                    </label>
                    <button onClick={() => migrateSubscriber(subscriber)} disabled={!migrationTargets[subscriber.id] || migrationTargets[subscriber.id] === subscriber.planId}>Migrate</button>
                    <button className="subscriber-cancel-button" onClick={() => cancelSubscriber(subscriber)}>Cancel subscription</button>
                  </div>
                </article>
              )) : <div className="subscriber-empty-state"><FiUsers size={22} /><strong>No active subscribers shown</strong><span>Try another plan to inspect its member list.</span></div>}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
