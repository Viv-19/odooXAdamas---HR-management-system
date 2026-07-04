/* =========================================================================
   HRMS — Payroll (role-aware).
   Admin/HR: pick an employee, edit the monthly wage (components, PF, tax and
   net pay auto-recalculate live), save the structure; plus a net-pay overview.
   Employee: read-only view of their own salary structure.
   ========================================================================= */
(function () {
  "use strict";
  const store = HRMS.store;
  const { fmt, toast } = HRMS.ui;
  const money = (n) => fmt.money(n);
  const round = (n) => Math.round((Number(n) || 0) * 100) / 100;

  // Mirror of the backend auto-calc so editing is instant (no round-trip).
  function computeStructure(wage, workingDays = 5) {
    const w = Number(wage) || 0;
    const basic = 0.5 * w, hra = 0.25 * w, std = 0.0833 * w, perf = 0.0833 * w, lta = 0.0833 * w;
    const fixed = Math.max(0, w - (basic + hra + std + perf + lta));
    const pfEmp = 0.12 * basic;
    return {
      monthlyWage: round(w), yearlyWage: round(w * 12), workingDaysPerWeek: workingDays,
      components: [
        { name: "Basic Salary", note: "Base salary; 50% of monthly wage.", pct: 50, amount: round(basic) },
        { name: "House Rent Allowance (HRA)", note: "50% of the basic salary.", pct: 25, amount: round(hra) },
        { name: "Standard Allowance", note: "Fixed allowance for the employee.", pct: 8.33, amount: round(std) },
        { name: "Performance Bonus", note: "Variable amount defined by the company.", pct: 8.33, amount: round(perf) },
        { name: "Leave Travel Allowance", note: "Covers employee travel expenses.", pct: 8.33, amount: round(lta) },
        { name: "Fixed Allowance", note: "Balancing portion after other components.", pct: round(w ? (fixed / w) * 100 : 0), amount: round(fixed) },
      ],
      pf: { employeePct: 12, employerPct: 12, employee: round(pfEmp), employer: round(pfEmp) },
      tax: { professional: 200 },
    };
  }
  const netPay = (s) => round((s.monthlyWage || 0) - (s.pf?.employee || 0) - (s.tax?.professional || 0));

  function componentsCard(s) {
    return `
      <div class="card card-pad">
        <div class="subcard-title">Salary Components</div>
        <table class="table"><thead><tr><th>Component</th><th style="text-align:right;">Amount / month</th><th style="text-align:right;">% of wage</th></tr></thead>
          <tbody>${s.components.map((c) => `<tr><td><div style="font-weight:600;">${fmt.escape(c.name)}</div><div class="text-muted" style="font-size:12px;">${fmt.escape(c.note || "")}</div></td><td style="text-align:right;">${money(c.amount)}</td><td style="text-align:right;">${c.pct}%</td></tr>`).join("")}</tbody>
        </table>
      </div>`;
  }
  function sideCards(s) {
    return `
      <div class="card card-pad">
        <div class="subcard-title">PF Contribution</div>
        <div class="kv"><span class="k">Employee (${s.pf.employeePct}%)</span><span class="v">${money(s.pf.employee)}</span></div>
        <div class="kv"><span class="k">Employer (${s.pf.employerPct}%)</span><span class="v">${money(s.pf.employer)}</span></div>
      </div>
      <div class="card card-pad">
        <div class="subcard-title">Tax Deductions</div>
        <div class="kv"><span class="k">Professional Tax</span><span class="v">${money(s.tax.professional)}</span></div>
      </div>
      <div class="card card-pad" style="background:var(--primary-light);border-color:var(--primary-fixed-dim);">
        <div class="label" style="color:var(--primary-hover);">Net Pay Estimate</div>
        <div class="h-xl" style="font-size:30px;color:var(--primary-hover);margin-top:4px;">${money(netPay(s))}</div>
        <div class="text-muted" style="font-size:12px;margin-top:2px;">Monthly wage − PF (employee) − Professional Tax</div>
      </div>`;
  }

  function header(title, subtitle, right = "") {
    return `<div class="page-header"><div><h1 class="page-title">${title}</h1><p class="page-subtitle">${subtitle}</p></div>${right}</div>`;
  }

  // ------------------------------ Employee -------------------------------
  async function renderEmployee(root) {
    const data = await store.apiPayrollMe();
    const s = data ? data.structure : computeStructure(50000);
    root.innerHTML =
      header("My Payroll", "Your salary structure and net pay (read-only).") + `
      <div class="card card-pad mb-5" style="background:var(--info-container);border-color:var(--primary-fixed-dim);">
        <div class="flex items-start gap-3"><span class="material-symbols-outlined" style="color:var(--primary-hover);">lock</span>
          <p style="font-size:13px;color:#075985;">Payroll details are read-only. For changes, please contact HR.</p></div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="lg:col-span-2 flex flex-col gap-5">
          <div class="card card-pad">
            <div class="subcard-title">Core Wage</div>
            <div class="kv"><span class="k">Monthly Wage</span><span class="v">${money(s.monthlyWage)}</span></div>
            <div class="kv"><span class="k">Yearly Wage</span><span class="v">${money(s.yearlyWage)}</span></div>
            <div class="kv"><span class="k">Working Days / Week</span><span class="v">${s.workingDaysPerWeek} Days</span></div>
          </div>
          ${componentsCard(s)}
        </div>
        <div class="flex flex-col gap-5">${sideCards(s)}</div>
      </div>`;
  }

  // ------------------------------- Admin ---------------------------------
  let empList = [];
  let currentId = null;
  let currentStructure = null;

  async function renderAdmin(root) {
    empList = (await store.apiPayrollList()) || [];
    if (!currentId && empList.length) currentId = empList[0].id;
    const data = currentId ? await store.apiPayrollGet(currentId) : null;
    currentStructure = data ? data.structure : computeStructure(50000);

    const options = empList.map((e) => `<option value="${fmt.escape(e.id)}" ${e.id === currentId ? "selected" : ""}>${fmt.escape(e.name)} · ${fmt.escape(e.id)}</option>`).join("");
    const right = `<div class="flex items-center gap-3">
      <select class="select" id="pay-emp" style="width:auto;min-width:220px;">${options}</select>
      <button class="btn btn-primary" id="pay-save"><span class="material-symbols-outlined">save</span>Save Changes</button>
    </div>`;

    root.innerHTML =
      header("Payroll", "Configure salary structures — components auto-calculate from the wage.", right) + `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="lg:col-span-2 flex flex-col gap-5" id="pay-editor"></div>
        <div class="flex flex-col gap-5">
          <div id="pay-side"></div>
          <div class="card overflow-hidden">
            <div class="subcard-title" style="padding:14px 16px 10px;margin:0;">Net Pay Overview</div>
            <div style="max-height:320px;overflow:auto;">
              ${empList.map((e) => `<div class="flex items-center justify-between" style="padding:11px 16px;border-top:1px solid var(--surface-container-high);">
                <div><div style="font-weight:600;font-size:13px;">${fmt.escape(e.name)}</div><div class="text-muted" style="font-size:11px;">${fmt.escape(e.department)}</div></div>
                <div style="text-align:right;"><div style="font-weight:600;font-size:13px;">${money(e.netPay)}</div><div class="text-muted" style="font-size:11px;">of ${money(e.monthlyWage)}</div></div>
              </div>`).join("")}
            </div>
          </div>
        </div>
      </div>`;

    renderEditor();

    document.getElementById("pay-emp").addEventListener("change", async (e) => {
      currentId = e.target.value;
      const d = await store.apiPayrollGet(currentId);
      currentStructure = d ? d.structure : computeStructure(50000);
      renderEditor();
    });
    document.getElementById("pay-save").addEventListener("click", async () => {
      try {
        await store.apiPayrollUpdate(currentId, currentStructure);
        toast("Salary structure saved", "success");
        // refresh overview net pay
        empList = (await store.apiPayrollList()) || empList;
        renderAdmin(root);
      } catch (err) { toast(err.message || "Could not save", "error"); }
    });
  }

  function renderEditor() {
    const s = currentStructure;
    document.getElementById("pay-editor").innerHTML = `
      <div class="card card-pad">
        <div class="subcard-title">Core Wage</div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="field"><label for="wage-input">Monthly Wage (₹)</label><input class="input" id="wage-input" type="number" min="0" step="1000" value="${s.monthlyWage}"></div>
          <div class="field"><label>Yearly Wage (₹)</label><input class="input" id="yearly-view" value="${money(s.yearlyWage)}" disabled></div>
          <div class="field"><label for="days-input">Working Days / Week</label>
            <select class="select" id="days-input">${[4, 5, 6].map((d) => `<option value="${d}" ${d === s.workingDaysPerWeek ? "selected" : ""}>${d} Days</option>`).join("")}</select></div>
        </div>
      </div>
      ${componentsCard(s)}`;
    document.getElementById("pay-side").innerHTML = sideCards(s);

    const wage = document.getElementById("wage-input");
    const days = document.getElementById("days-input");
    const recompute = () => {
      currentStructure = computeStructure(wage.value, Number(days.value) || 5);
      renderEditor();
      const w = document.getElementById("wage-input");
      w.focus(); w.setSelectionRange(w.value.length, w.value.length);
    };
    wage.addEventListener("change", recompute);
    days.addEventListener("change", recompute);
  }

  // ------------------------------- Boot ----------------------------------
  async function render() {
    const root = document.getElementById("payroll-root");
    if (!root) return;
    await store.loadMe();
    if (store.isAdmin()) await renderAdmin(root); else await renderEmployee(root);
  }
  document.addEventListener("DOMContentLoaded", render);
})();
