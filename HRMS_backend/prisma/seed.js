const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

const DEPARTMENTS = ["Engineering", "Human Resources", "Finance", "Marketing", "Sales", "Design"];

const SALARY_SAMPLE = {
  monthlyWage: 50000,
  yearlyWage: 600000,
  workingDaysPerWeek: 5,
  components: [
    { name: "Basic Salary", note: "Base salary; 50% of monthly wage.", pct: 50, amount: 25000 },
    { name: "House Rent Allowance (HRA)", note: "50% of the basic salary.", pct: 50, amount: 12500 },
    { name: "Standard Allowance", note: "Fixed amount provided to the employee.", pct: 16.67, amount: 4167 },
    { name: "Performance Bonus", note: "Variable amount defined by the company.", pct: 8.33, amount: 2092.5 },
    { name: "Leave Travel Allowance", note: "Covers employee travel expenses.", pct: 8.33, amount: 2092.5 },
    { name: "Fixed Allowance", note: "Balancing portion after other components.", pct: 11.67, amount: 2498 },
  ],
  pf: { employeePct: 12, employerPct: 12, employee: 3000, employer: 3000 },
  tax: { professional: 200 },
};

const EMPLOYEES = [
  { employeeId: "EMP-2024-001", email: "alex.mercer@hrms.com", firstName: "Alex", lastName: "Mercer", jobTitle: "Senior Frontend Developer", department: "Engineering", location: "San Francisco HQ", managerName: "Sarah Jenkins", role: "EMPLOYEE" },
  { employeeId: "EMP-2024-002", email: "sarah.jenkins@hrms.com", firstName: "Sarah", lastName: "Jenkins", jobTitle: "HR Manager", department: "Human Resources", location: "New York Office", managerName: "David Chen", role: "HR" },
  { employeeId: "EMP-2024-003", email: "david.chen@hrms.com", firstName: "David", lastName: "Chen", jobTitle: "Finance Director", department: "Finance", location: "New York Office", managerName: "—", role: "EMPLOYEE" },
  { employeeId: "EMP-2024-004", email: "emily.davis@hrms.com", firstName: "Emily", lastName: "Davis", jobTitle: "Marketing Manager", department: "Marketing", location: "Austin Office", managerName: "David Chen", role: "EMPLOYEE" },
  { employeeId: "EMP-2024-005", email: "michael.kim@hrms.com", firstName: "Michael", lastName: "Kim", jobTitle: "Sales Executive", department: "Sales", location: "Austin Office", managerName: "Emily Davis", role: "EMPLOYEE" },
  { employeeId: "EMP-2024-006", email: "jane.smith@hrms.com", firstName: "Jane", lastName: "Smith", jobTitle: "Product Designer", department: "Design", location: "San Francisco HQ", managerName: "Sarah Jenkins", role: "EMPLOYEE" },
];

const HOLIDAYS = [
  { date: "2026-01-14", name: "Kite Festival" },
  { date: "2026-08-15", name: "Independence Day" },
  { date: "2026-10-02", name: "Gandhi Jayanti" },
  { date: "2026-11-08", name: "Diwali" },
];

function d(iso) {
  const dt = new Date(iso);
  dt.setUTCHours(0, 0, 0, 0);
  return dt;
}

async function main() {
  // Departments
  const deptMap = {};
  for (const name of DEPARTMENTS) {
    const dept = await prisma.department.upsert({ where: { name }, update: {}, create: { name } });
    deptMap[name] = dept.id;
  }

  // Primary admin (their real login)
  await prisma.user.upsert({
    where: { email: "academicsloth202020@gmail.com" },
    update: { role: "ADMIN", isVerified: true },
    create: {
      employeeId: "ADMIN-001",
      email: "academicsloth202020@gmail.com",
      password: await hashPassword("00@Vivesh"),
      role: "ADMIN",
      isVerified: true,
      profile: {
        create: { firstName: "Admin", lastName: "Vivesh", jobTitle: "System Administrator", departmentId: deptMap["Human Resources"] },
      },
    },
  });

  // Sample employees (password: Hrms@1234)
  const empPassword = await hashPassword("Hrms@1234");
  const created = {};
  for (const e of EMPLOYEES) {
    const user = await prisma.user.upsert({
      where: { email: e.email },
      update: { role: e.role, isVerified: true },
      create: {
        employeeId: e.employeeId,
        email: e.email,
        password: empPassword,
        role: e.role,
        isVerified: true,
        profile: {
          create: {
            firstName: e.firstName,
            lastName: e.lastName,
            jobTitle: e.jobTitle,
            departmentId: deptMap[e.department],
            location: e.location,
            managerName: e.managerName,
            employmentType: "Full-Time",
            joiningDate: d("2022-03-14"),
            salaryStructure: SALARY_SAMPLE,
          },
        },
      },
    });
    created[e.employeeId] = user.id;
  }

  // Holidays
  for (const h of HOLIDAYS) {
    await prisma.holiday.upsert({ where: { date: d(h.date) }, update: { name: h.name }, create: { date: d(h.date), name: h.name } });
  }

  // A few pending leave requests (for the HR approvals screen)
  const jane = created["EMP-2024-006"];
  const michael = created["EMP-2024-005"];
  if (jane) {
    await prisma.leaveRequest.create({ data: { userId: jane, leaveType: "PAID", startDate: d("2026-10-28"), endDate: d("2026-11-02"), employeeRemarks: "Family vacation", status: "PENDING" } }).catch(() => {});
  }
  if (michael) {
    await prisma.leaveRequest.create({ data: { userId: michael, leaveType: "SICK", startDate: d("2026-11-15"), endDate: d("2026-11-15"), employeeRemarks: "Doctor appointment", status: "PENDING" } }).catch(() => {});
  }

  console.log("✅ Database seeded: departments, admin, 6 employees, holidays, sample leaves.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
