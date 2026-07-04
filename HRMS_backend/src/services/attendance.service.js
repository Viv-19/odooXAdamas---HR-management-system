const prisma = require("../clients/prisma.client");

/**
 * Service class handling Attendance business logic.
 * Follows Single Responsibility Principle (SRP).
 */
class AttendanceService {
  /**
   * Generates a normalized date representing midnight in UTC for the current day.
   * This ensures we only have one attendance record per day per user.
   */
  _getNormalizedToday() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return today;
  }

  /**
   * Helper to calculate working hours between two dates.
   * Returns a formatted string HH:MM.
   */
  _calculateWorkHours(checkIn, checkOut) {
    if (!checkIn || !checkOut) return "--:--";
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  /**
   * Helper to calculate extra hours based on a 9-hour standard workday.
   * Returns formatted string e.g. "+01:00", "-01:15", "00:00"
   */
  _calculateExtraHours(checkIn, checkOut, standardHours = 9) {
    if (!checkIn || !checkOut) return "--:--";
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const totalMinutes = Math.floor(diffMs / 60000);
    const standardMinutes = standardHours * 60;
    const diff = totalMinutes - standardMinutes;
    
    const isNegative = diff < 0;
    const absDiff = Math.abs(diff);
    const hours = Math.floor(absDiff / 60);
    const minutes = absDiff % 60;
    
    const sign = isNegative ? "-" : (diff > 0 ? "+" : "");
    const prefix = diff === 0 ? "" : sign;

    return `${prefix}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  /**
   * Employee Check-In
   */
  async checkIn(userId) {
    const today = this._getNormalizedToday();

    // Verify if already checked in today
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    if (existing) {
      throw new Error("Already checked in for today.");
    }

    const checkInTime = new Date();

    return prisma.attendance.create({
      data: {
        userId,
        date: today,
        checkIn: checkInTime,
        status: "PRESENT",
      },
    });
  }

  /**
   * Employee Check-Out
   */
  async checkOut(userId) {
    const today = this._getNormalizedToday();

    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    if (!existing) {
      throw new Error("Cannot check out. No check-in record found for today.");
    }

    if (existing.checkOut) {
      throw new Error("Already checked out for today.");
    }

    const checkOutTime = new Date();

    return prisma.attendance.update({
      where: { id: existing.id },
      data: { checkOut: checkOutTime },
    });
  }

  /**
   * Get Employee's Attendance for Today
   */
  async getTodayStatus(userId) {
    const today = this._getNormalizedToday();

    const record = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    return record;
  }

  /**
   * HR: Get all attendances for a specific date
   */
  async getAllAttendances(dateString) {
    // Determine the date to query
    let queryDate = this._getNormalizedToday();
    if (dateString) {
      queryDate = new Date(dateString);
      queryDate.setUTCHours(0, 0, 0, 0);
    }

    const attendances = await prisma.attendance.findMany({
      where: {
        date: queryDate,
      },
      include: {
        user: {
          include: {
            profile: {
              include: {
                department: true,
              },
            },
          },
        },
      },
      orderBy: {
        checkIn: 'desc'
      }
    });

    // Map to HR UI structure
    return attendances.map((att) => {
      const profile = att.user?.profile;
      return {
        id: att.id,
        employeeName: profile ? `${profile.firstName} ${profile.lastName}` : "Unknown User",
        department: profile?.department?.name || "N/A",
        checkIn: att.checkIn,
        checkOut: att.checkOut,
        status: att.status,
        workHours: this._calculateWorkHours(att.checkIn, att.checkOut),
        extraHours: this._calculateExtraHours(att.checkIn, att.checkOut),
      };
    });
  }

  /**
   * Employee: own monthly attendance history + summary counts.
   * monthStr format "YYYY-MM" (defaults to the current month).
   */
  async getMyHistory(userId, monthStr) {
    let year, month;
    if (monthStr && /^\d{4}-\d{2}$/.test(monthStr)) {
      [year, month] = monthStr.split("-").map(Number);
    } else {
      const now = new Date();
      year = now.getUTCFullYear();
      month = now.getUTCMonth() + 1;
    }
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    end.setUTCHours(23, 59, 59, 999);

    const records = await prisma.attendance.findMany({
      where: { userId, date: { gte: start, lte: end } },
      orderBy: { date: "desc" },
    });

    const mapped = records.map((r) => ({
      date: r.date,
      status: r.status,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      workHours: this._calculateWorkHours(r.checkIn, r.checkOut),
      extraHours: this._calculateExtraHours(r.checkIn, r.checkOut),
    }));

    const present = records.filter((r) => r.status === "PRESENT" || r.status === "HALF_DAY").length;
    const leaves = records.filter((r) => r.status === "LEAVE").length;

    return {
      records: mapped,
      summary: { present, leaves, totalWorking: records.length },
    };
  }
}

module.exports = new AttendanceService();
