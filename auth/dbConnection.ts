const {createPool} = require('mysql')
require('dotenv').config()


const Connection = createPool({
    host:'localhost',
    user:'root',
    password:'',
    port:3306,
    database:'local'
})

Connection.getConnection((err:any)=>{
    if(err){
        return console.log('error Occoured!')
    }
    console.log('MYSQL_DataBase Connection Successfully.....')
})

export default Connection