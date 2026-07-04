# Human Resource Management System (HRMS)
> Every workday, perfectly aligned.

## 1. Introduction

### 1.1 Purpose
The purpose of this project is to define the functional and non-functional requirements of a Human Resource Management System (HRMS). The system aims to digitize and streamline core HR operations such as employee onboarding, profile management, attendance tracking, leave management, payroll visibility, and approval workflows for admins and HR officers.

### 1.2 Scope
The HRMS will provide:
- Secure authentication (Sign Up / Sign In)
- Role-based access (Admin vs Employee)
- Employee profile management
- Attendance tracking (daily/weekly view)
- Leave and time-off management
- Approval workflows for HR/Admin

### 1.3 Definitions & Abbreviations
- **Admin / HR Officer**: User with management and approval privileges
- **Employee**: Regular user with limited access
- **Time-Off**: Paid leave, sick leave, unpaid leave, etc.

## 2. User Classes and Characteristics
| User Type | Description |
| --------- | ----------- |
| **Admin / HR Officer** | Manages employees, approves leave & attendance, views payroll details |
| **Employee** | Views personal profile, attendance, applies for leave, views salary details |

## 3. Functional Requirements

### 3.1 Authentication & Authorization
- **Sign Up**: Users can register using Employee ID, Email, Password, and Role (Employee / HR). Password must follow security rules and email verification is required.
- **Sign In**: Users log in using email and password. Incorrect credentials display error messages. Successful login redirects to the dashboard.

### 3.2 Dashboard
- **Employee Dashboard**: Displays quick-access cards (Profile, Attendance, Leave Requests, Logout) and shows recent activity or alerts.
- **Admin / HR Dashboard**: Displays employee list, attendance records, and leave approvals. Ability to switch between employees.

### 3.3 Employee Profile Management
- **View Profile**: Employees can view personal details, job details, salary structure, documents, and profile picture.
- **Edit Profile**: Employees can edit limited fields (address, phone, profile picture). Admin can edit all employee details.

### 3.4 Attendance Management
- **Attendance Tracking**: Daily and weekly attendance views. Option for check-in/check-out. Status types include Present, Absent, Half-day, and Leave.
- **Attendance View**: Employees can view only their own attendance. Admin/HR can view attendance of all employees.

### 3.5 Leave & Time-Off Management
- **Apply for Leave (Employee)**: Employees can select leave type (Paid, Sick, Unpaid), choose date range by directly selecting on a calendar, and add remarks. Shows attendance in a monthly calendar with Present/Absent markers. Leave request status can be Pending, Approved, or Rejected.
- **Leave Approval (Admin/HR)**: Admin can view all leave requests, approve or reject requests, and add comments. Changes reflect immediately in employee records.

### 3.6 Payroll/Salary Management
- **Employee Payroll View**: Payroll data is read-only for employees.
- **Admin Payroll Control**: Admin can view payroll of all employees, update salary structure, and ensure payroll accuracy.

## Resources
- **Excalidraw**: [Architecture/Flow Diagram](https://link.excalidraw.com/l/65VNwvy7c4X/58RLEJ4oOwh)
