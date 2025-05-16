import { PrismaClient } from '@prisma/client';
import { error } from 'console';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const SECRET = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

export const generateTokern =(data:object)=>{
return jwt.sign(data,SECRET,{expiresIn:'1h'})
}

export const authentication = ((req: any, res: any, next: any)=>{
    console.log( req.headers.authorization)
    const token =  req.headers.authorization?.split(' ')[1];
    if(!token) return res.status(401).json({success:false, message:'No token created!'})

    try{
        const decode = jwt.verify(token,SECRET);
        (req as any).userdata = decode;
        next();  
    }catch {
        res.status(401).json({ error: 'Invalid token' });
    }
})


