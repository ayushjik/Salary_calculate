const express = require('express')
const cors = require('cors')
import { PrismaClient } from "@prisma/client"
import * as bcrypt from 'bcrypt'
import { authentication, generateTokern } from "./auth/microservices"
require('dotenv').config()

const app = express()
const server = require('http').createServer(app)


app.use(cors());
app.use(express.json());



const prisma = new PrismaClient();
const PORT = 5050




app.get('/',(req:any, res:any)=>{
    res.send('Hello This is my first Page!')
})


app.post('/auth/login',async(req:any, res:any)=>{
    try{
        const { email, password} = req.body
        console.log(email, password)

        const user = await prisma.user.findUnique({where:{email}})
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Wrong credentials' });
          }

          const token = generateTokern({id:user.id})

          console.log('token', token)
          res.status(200).json({success:true, message:'Logged IN!', token:token})

    }catch(err){
        res.status(500).send({success:false, message:'Internal server Error!'})
    }
})

app.post('/auth/logout',async (req:any,res:any)=>{
    res.status(200).json({success:true, message:"LoggedOut!"})
})

app.post('/employee',authentication,async(req:any, res:any)=>{
    try{
      
        const {email, password,name,basicSalary,hra,allowances,deductions,pf} = req.body
        console.log(email, password,name,basicSalary,hra,allowances,deductions,pf)
        const hashPass = await bcrypt.hash(password, 12)
    const users = await prisma.user.create({
        data: {
          name,
          email,
          password: hashPass
        },
      });
console.log(users)
const employees = await prisma.employee.create({
    data: {
      userId: users.id,
      basicSalary: parseFloat(basicSalary),
      hra: parseFloat(hra),
      allowances: parseFloat(allowances),
      deductions: parseFloat(deductions),
      pf: parseFloat(pf),
    },
  });
console.log(employees)


  res.status(200).json({ success: true, message: 'Employee created successfully!'});

    }catch(err){
        res.status(500).json({
            success:false,
            message:"Internal server Errror!"
        })
    }
})


app.get('/employee/:id', authentication,async(req:any, res:any)=>{
    try{
        const id = parseInt(req.params.id)
        console.log(id)

        const employee = await prisma.employee.findUnique({
            where:{id},
            include:{user:true},
        })
        
        if(!employee){
            res.status(402).json({success:false, message:"Employee not Found!"})
        }

        res.status(200).json({success:true, message:employee})

    }catch{
        res.status(500).json({
            success:false,
            message:"Internal server Errror!"
        })
    }
})


app.post('/attendance/mark',authentication,async (req:any, res:any)=>{
    try{
        const{employeeId, hoursWorked} = req.body
        console.log(employeeId, hoursWorked)
        await prisma.attandance.create({
            data:{
                employeeId:parseInt(employeeId),
                hoursWorked: parseFloat(hoursWorked),
                date: new Date()
            }
        });
        res.status(201).json({success:true, message:"Attendance Marked"})
    }catch(err){
        res.status(500).json({
            success:false,
            message:"Internal server Errror!"
        })
    }
})


app.get('/salary/:employeeId',authentication,async(req:any, res:any)=>{
    try{
        const {employeeId} = req.param
        const {month} = req.query
        const employeeID = parseInt(employeeId)
        const employee = await prisma.employee.findUnique({
            where: {
                id: employeeID,
            }
        });

        if(!employee){
            res.status(402).json({success:false, message:"Employee not Found!"})
        }

        const attendance = await prisma.attandance.findMany({
            where: {
                employeeId: parseInt(employeeId),
            },
            });
        const workingDays = 22;
        const daily = (employee.basicSalary + employee.hra + employee.allowances) / workingDays

        let fullDays = 0
        let halfDays = 0

        attendance.forEach((record)=>{
            if(record.hoursWorked>=8){
                fullDays +=1;
            }else(record.hoursWorked>=4);{
                halfDays+=1
            } 
        })

        const totalSalary =(fullDays * daily)+ (halfDays * daily *0.5)
        const tax = totalSalary * 0.1
        const pf = employee.basicSalary * 0.12
        const netSalary = totalSalary - tax - pf - employee.deductions;

        const data = {
            grossSalary : totalSalary,
            tax,
            pf,
            netSalary
        }
        res.status(200).json({success: true, message:data})
    }catch(err){
        res.status(500).json({
            success:false,
            message:"Internal server Errror!"
        })
    }
})


app.post('/salary/calculate', authentication, async (req: any, res: any) => {
    try {
     const { employeeId, month } = req.body;
  
      if (!employeeId || !month) {
        return res.status(400).json({ success: false, message: 'Missing employeeId or month' });
      }
      const employee = await prisma.employee.findUnique({
        where: { id: parseInt(employeeId) }
      });

      
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }


      const [year, mon] = month.split('/').map(Number);
      const from = new Date(year, mon - 1, 1); 
      const to = new Date(year, mon, 1); 

      const attendance = await prisma.attandance.findMany({
        where: {
          employeeId: parseInt(employeeId),
          date: {
            gte: from,
            lt: to,
          },
        },
      });

  
      const presentDays = attendance.length;
      const totalWorkingDays = 22; 
  
      const grossSalary = employee.basicSalary + employee.hra + employee.allowances;
      const perDaySalary = grossSalary / totalWorkingDays;
      const salaryBeforeDeductions = perDaySalary * presentDays;
      const totalDeductions = employee.deductions + employee.pf;
      const netSalary = salaryBeforeDeductions - totalDeductions;
      res.status(200).json({
        success: true,
        message: 'Salary calculated successfully',
        data: {
          employeeId,
          month,
          presentDays,
          grossSalary,
          totalDeductions,
          netSalary,
        },
      });
    } catch (error) {
      console.error('Error calculating salary:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });
  
  app.post('/payroll/distribute', authentication, async (req: any, res: any) => {
    try {
     const { employeeId, month } = req.body;
  
      if (!employeeId || !month) {
        return res.status(400).json({ success: false, message: 'Missing employeeId or month' });
      }
      const employee = await prisma.employee.findUnique({
        where: { id: parseInt(employeeId) }
      });

      
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }


      const [year, mon] = month.split('/').map(Number);
      const from = new Date(year, mon - 1, 1); 
      const to = new Date(year, mon, 1); 

      const attendance = await prisma.attandance.findMany({
        where: {
          employeeId: parseInt(employeeId),
          date: {
            gte: from,
            lt: to,
          },
        },
      });

  
      const presentDays = attendance.length;
      const totalWorkingDays = 22; 
  
      const grossSalary = employee.basicSalary + employee.hra + employee.allowances;
      const perDaySalary = grossSalary / totalWorkingDays;
      const salaryBeforeDeductions = perDaySalary * presentDays;
      const totalDeductions = employee.deductions + employee.pf;
      const netSalary = salaryBeforeDeductions - totalDeductions;
      const tax = salaryBeforeDeductions * 0.1
      const pf = employee.basicSalary * 0.12

     await prisma.salary.create({
        data:{
            employeeId:employee.id,
            month,
            grossSalary:String(grossSalary),
            tax,
            pf,
            netSalary,
        }
     })

     res.status(201).json({
        success: true,
        message: "Payroll distributed Successfully.",
      });
    } catch (error) {
      console.error('Error calculating salary:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.get('/payroll/history', authentication, async (req: any, res: any) => {
    try {
     const { month } = req.query;
  
      if (!month) {
        return res.status(400).json({ success: false, message: 'Missing month' });
      }
     
      const salaries = await prisma.salary.findMany({
        where: { month },
        include: {
          employee: {
            include: { user: true },
          },
        },
      });

     res.status(200).json({
        success: true,
        message:salaries,
      });
    } catch (error) {
      console.error('Error calculating salary:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });



server.listen(PORT,()=>{
    console.log(`server is running ON ${PORT}`)
})