const prisma = require("../clients/prisma.client");

const TYPE_TO_ENUM = {
  "Paid Time Off": "PAID", "Sick Time Off": "SICK", "Unpaid Leave": "UNPAID",
  PAID: "PAID", SICK: "SICK", UNPAID: "UNPAID",
};
const ENUM_TO_TYPE = { PAID: "Paid Time Off", SICK: "Sick Time Off", UNPAID: "Unpaid Leave" };
const STATUS_TO_ENUM = { Pending: "PENDING", Approved: "APPROVED", Rejected: "REJECTED" };
const ENUM_TO_STATUS = { PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected" };

const iso = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

class LeaveService {
  _days(a, b) {
    const s = new Date(a), e = new Date(b);
    return Math.max(1, Math.round((e - s) / 86400000) + 1);
  }

  _map(l) {
    const p = l.user?.profile;
    return {
      id: l.id,
      empId: l.user?.employeeId,
      employeeName: p ? `${p.firstName} ${p.lastName}` : l.user?.employeeId || "",
      department: p?.department?.name || "—",
      type: ENUM_TO_TYPE[l.leaveType],
      start: iso(l.startDate),
      end: iso(l.endDate),
      duration: this._days(l.startDate, l.endDate),
      status: ENUM_TO_STATUS[l.status],
      reason: l.employeeRemarks || "",
      adminComments: l.adminComments || "",
    };
  }

  async list(user) {
    const isHr = user.role === "HR" || user.role === "ADMIN";
    const leaves = await prisma.leaveRequest.findMany({
      where: isHr ? {} : { userId: user.id },
      include: { user: { include: { profile: { include: { department: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    return leaves.map((l) => this._map(l));
  }

  async apply(userId, { type, start, end, reason }) {
    if (!start || !end) throw new Error("Start and end dates are required");
    const leaveType = TYPE_TO_ENUM[type] || "PAID";
    const l = await prisma.leaveRequest.create({
      data: {
        userId,
        leaveType,
        startDate: new Date(start),
        endDate: new Date(end),
        employeeRemarks: reason || null,
        status: "PENDING",
      },
      include: { user: { include: { profile: { include: { department: true } } } } },
    });
    return this._map(l);
  }

  async setStatus(id, status, reviewerId, comments) {
    const st = STATUS_TO_ENUM[status] || status;
    if (!["APPROVED", "REJECTED", "PENDING"].includes(st)) throw new Error("Invalid status");
    const l = await prisma.leaveRequest.update({
      where: { id },
      data: { status: st, reviewerId: reviewerId || null, adminComments: comments || null },
      include: { user: { include: { profile: { include: { department: true } } } } },
    });
    return this._map(l);
  }

  async balance(userId) {
    const p = await prisma.profile.findUnique({ where: { userId } });
    return { paid: p?.paidLeaveBalance ?? 24, sick: p?.sickLeaveBalance ?? 7, unpaid: null };
  }

  async allocate({ empId, type, days }) {
    const user = await prisma.user.findUnique({ where: { employeeId: empId } });
    if (!user) throw new Error("Employee not found");
    const field = TYPE_TO_ENUM[type] === "SICK" ? "sickLeaveBalance" : "paidLeaveBalance";
    const p = await prisma.profile.update({
      where: { userId: user.id },
      data: { [field]: { increment: Number(days) || 0 } },
    });
    return { empId, field, value: p[field] };
  }

  async holidays() {
    const hs = await prisma.holiday.findMany({ orderBy: { date: "asc" } });
    return hs.map((h) => ({ date: iso(h.date), name: h.name }));
  }
}

module.exports = new LeaveService();
