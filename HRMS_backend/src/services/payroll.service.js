const prisma = require("../clients/prisma.client");

const round = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Auto-calculate a salary structure from a monthly wage.
 * Basic = 50% of wage, HRA = 50% of Basic, and the remaining allowances split
 * so the components total the wage (spec: total must not exceed the wage).
 */
function computeStructure(wage) {
  const w = Number(wage) || 0;
  const basic = 0.5 * w;
  const hra = 0.25 * w; // 50% of basic
  const std = 0.0833 * w;
  const perf = 0.0833 * w;
  const lta = 0.0833 * w;
  const fixed = Math.max(0, w - (basic + hra + std + perf + lta));
  const pfEmp = 0.12 * basic;
  return {
    monthlyWage: round(w),
    yearlyWage: round(w * 12),
    workingDaysPerWeek: 5,
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

class PayrollService {
  _structFor(profile) {
    if (profile && profile.salaryStructure) return profile.salaryStructure;
    return computeStructure(50000);
  }

  async getForUser(userId) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    const s = this._structFor(profile);
    return { structure: s, netPay: netPay(s) };
  }

  async getByEmployeeId(employeeId) {
    const user = await prisma.user.findUnique({ where: { employeeId }, include: { profile: true } });
    if (!user) throw new Error("Employee not found");
    const s = this._structFor(user.profile);
    return {
      employeeId,
      name: user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : employeeId,
      structure: s,
      netPay: netPay(s),
    };
  }

  async updateByEmployeeId(employeeId, structure) {
    const user = await prisma.user.findUnique({ where: { employeeId } });
    if (!user) throw new Error("Employee not found");
    await prisma.profile.update({ where: { userId: user.id }, data: { salaryStructure: structure } });
    return this.getByEmployeeId(employeeId);
  }

  async listAll() {
    const users = await prisma.user.findMany({
      include: { profile: { include: { department: true } } },
      orderBy: { createdAt: "asc" },
    });
    return users.map((u) => {
      const s = this._structFor(u.profile);
      return {
        id: u.employeeId,
        name: u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.employeeId,
        department: u.profile?.department?.name || "—",
        monthlyWage: s.monthlyWage,
        netPay: netPay(s),
      };
    });
  }
}

module.exports = new PayrollService();
module.exports.computeStructure = computeStructure;
