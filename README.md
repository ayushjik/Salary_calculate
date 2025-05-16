# Salary_calculate

-----------------------------------.envfile--------------------------------------------------------
DATABASE_URL="mysql://root:@localhost:3306/local"



--------------------------------------------------Run Commands---------------------------------------------------
npm install
add .env file and connect with database
npm run dev



--------------------------------------------MY_TASK-------------------------------------------------------------------------

Hello,
Develop a REST API to calculate employee salaries based on basic salary, allowances, tax slabs, deductions, PF contributions, and attendance. Additionally, HR should be able to calculate the total salary payout for all employees within a selected month.

Note: Half day salary calculation for employees working less than 8 hours per day.
1. Tech Stack:
Node.js (TypeScript)
Express.js
Prisma ORM / TypeORM / Sequelize
PostgreSQL / MySQL
JWT Authentication (HTTP-only cookies)
Redis for caching (optional)


Features & API Endpoints

A. Authentication APIs
1: auth/login for all users. (type: post)  (role: all users)
2: /auth/logout for all users (type post) (role: all users)
B. Employee Management APIs
2: /employees (type: post) (role: HR/Admin)
3: /employees/:id (type: get) (role: HR/Admin (Self-view for Employee))
C: Attendance Api
4: /attendance/mark (type: post) (role: Employee)
D: Salary Calculation APIs
5: /salary/calculate (type: post)   (role: HR/Admin)
6: /salary/:employeeId?month=YYYY-MM (type: get) (role: HR/Admin (Self-view for Employee))
E. Payroll Distribution APIs 
7: /payroll/distribute  (type: post)  (role: HR/Admin)
8: /payroll/history?month=YYYY-MM (type: get) (role: HR/Admin)


Salary Calculation Logic

1: Gross Salary = Basic Salary + HRA + Allowances
2: Tax Deduction = Based on tax slabs (create your own slab)
3: PF Deduction = 12% of Basic Salary
4: Daily Wage = Gross Salary / Working Days
5: Full Day Salary = Daily Wage
6: Half Day Salary (if working hours < 8 hours) = Daily Wage / 2
7: Total Salary = (Full Days × Full Day Salary) + (Half Days × Half Day Salary)
8: Net Salary = Total Salary - Tax - PF - Other Deductions
