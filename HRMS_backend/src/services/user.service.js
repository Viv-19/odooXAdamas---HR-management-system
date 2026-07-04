const prisma = require("../clients/prisma.client");
const { hashPassword } = require("../utils/hash.util");

/**
 * User / Employee service.
 * Produces a DTO that matches the frontend Employee shape so the UI needs
 * minimal mapping. Presence status is derived from today's attendance + any
 * approved leave covering today (attendance is the source of truth).
 */
class UserService {
  _normalizedToday() {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  _splitName(name = "") {
    const parts = name.trim().split(/\s+/);
    const firstName = parts.shift() || "User";
    const lastName = parts.join(" ") || "";
    return { firstName, lastName };
  }

  /** Map a Prisma user (with profile+department) to the frontend Employee DTO. */
  _mapEmployee(user, status = "absent") {
    const p = user.profile || {};
    const name = `${p.firstName || ""} ${p.lastName || ""}`.trim() || user.employeeId;
    return {
      id: user.employeeId,
      uuid: user.id,
      name,
      firstName: p.firstName || "",
      lastName: p.lastName || "",
      role: p.jobTitle || "Employee",
      accessRole: user.role, // EMPLOYEE | HR | ADMIN
      access: user.role === "EMPLOYEE" ? "employee" : "admin",
      department: p.department?.name || "—",
      email: user.email,
      phone: p.phone || "—",
      manager: p.managerName || "—",
      location: p.location || "—",
      employmentType: p.employmentType || "Full-Time",
      joinDate: p.joiningDate || user.createdAt,
      status,
      avatar: p.profilePicUrl || "",
      tag: p.jobTitle || user.role,
      // Private info (profile page)
      address: p.address || "—",
      dateOfBirth: p.dateOfBirth || null,
      gender: p.gender || "—",
      nationality: p.nationality || "—",
      maritalStatus: p.maritalStatus || "—",
      personalEmail: p.personalEmail || "—",
      bank: {
        account: p.bankAccount || "—",
        name: p.bankName || "—",
        ifsc: p.ifsc || "—",
        pan: p.pan || "—",
        uan: p.uan || "—",
      },
      documents: p.documents || [],
      salaryStructure: p.salaryStructure || null,
      paidLeaveBalance: p.paidLeaveBalance ?? 24,
      sickLeaveBalance: p.sickLeaveBalance ?? 7,
      isVerified: user.isVerified,
    };
  }

  /** Compute a userId -> presence status map for today. */
  async _statusMap() {
    const today = this._normalizedToday();
    const [attendances, leaves] = await Promise.all([
      prisma.attendance.findMany({ where: { date: today } }),
      prisma.leaveRequest.findMany({
        where: { status: "APPROVED", startDate: { lte: today }, endDate: { gte: today } },
      }),
    ]);
    const map = {};
    leaves.forEach((l) => (map[l.userId] = "leave"));
    attendances.forEach((a) => {
      map[a.userId] = a.status === "LEAVE" ? "leave" : a.status === "ABSENT" ? "absent" : "present";
    });
    return map;
  }

  async list() {
    const users = await prisma.user.findMany({
      include: { profile: { include: { department: true } } },
      orderBy: { createdAt: "asc" },
    });
    const statuses = await this._statusMap();
    return users.map((u) => this._mapEmployee(u, statuses[u.id] || "absent"));
  }

  async getByEmployeeId(employeeId) {
    const user = await prisma.user.findUnique({
      where: { employeeId },
      include: { profile: { include: { department: true } } },
    });
    if (!user) throw new Error("Employee not found");
    const statuses = await this._statusMap();
    return this._mapEmployee(user, statuses[user.id] || "absent");
  }

  async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: { include: { department: true } } },
    });
    if (!user) throw new Error("User not found");
    const statuses = await this._statusMap();
    return this._mapEmployee(user, statuses[user.id] || "absent");
  }

  async create(input) {
    const { id, employeeId, name, role, department, email, phone, manager, location, employmentType, joinDate } = input;
    const empId = id || employeeId;

    const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { employeeId: empId }] } });
    if (exists) throw new Error("User with this email or employee ID already exists");

    const { firstName, lastName } = this._splitName(name);
    const password = await hashPassword("Hrms@1234"); // temp password; employee resets later

    const user = await prisma.user.create({
      data: {
        employeeId: empId,
        email,
        password,
        role: "EMPLOYEE",
        isVerified: true, // HR-provisioned accounts are pre-verified
        profile: {
          create: {
            firstName,
            lastName,
            phone: phone || null,
            jobTitle: role || null,
            location: location || null,
            employmentType: employmentType || "Full-Time",
            managerName: manager || null,
            joiningDate: joinDate ? new Date(joinDate) : null,
            department: department
              ? { connectOrCreate: { where: { name: department }, create: { name: department } } }
              : undefined,
          },
        },
      },
      include: { profile: { include: { department: true } } },
    });
    return this._mapEmployee(user, "present");
  }

  async update(employeeId, input) {
    const user = await prisma.user.findUnique({ where: { employeeId } });
    if (!user) throw new Error("Employee not found");

    const data = {};
    if (input.name) Object.assign(data, this._splitName(input.name));
    const map = {
      phone: "phone", address: "address", role: "jobTitle", location: "location",
      employmentType: "employmentType", manager: "managerName", gender: "gender",
      nationality: "nationality", maritalStatus: "maritalStatus", personalEmail: "personalEmail",
    };
    for (const [inKey, field] of Object.entries(map)) {
      if (input[inKey] !== undefined) data[field] = input[inKey];
    }
    if (input.joinDate) data.joiningDate = new Date(input.joinDate);
    if (input.department) {
      data.department = { connectOrCreate: { where: { name: input.department }, create: { name: input.department } } };
    }

    await prisma.profile.update({ where: { userId: user.id }, data });
    return this.getByEmployeeId(employeeId);
  }

  async remove(employeeId) {
    const user = await prisma.user.findUnique({ where: { employeeId } });
    if (!user) throw new Error("Employee not found");
    await prisma.user.delete({ where: { id: user.id } }); // cascades profile/attendance/leaves
    return { id: employeeId };
  }
}

module.exports = new UserService();
