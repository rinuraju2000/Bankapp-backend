//import db
const { response } = require('express')
const db=require('./db')

//Import jsonweb token
const jwc=require('jsonwebtoken')


//logic for register
const register=(username,acno,password)=>{
   return db.User.findOne({acno}).then((response)=>{
    console.log(response);
    if(response){
        return{
            statusCode:401,
            message:"Acno is already registered"
        }
    }
    else{
        const newUser=new db.User({
            username,
            acno,
            password,
            balance:2000,
            transactions:[]
        })
        //to store the new user in the database
        newUser.save()
        //response send back to the client
        return{
            statusCode: 200,
            message:'Registration successful'
        }
    }
   })
}

//Logic for login
const login=(acno,password)=>{
    return db.User.findOne({acno,password}).then((response)=>{
        console.log(response);//Full details
        if(response){
            //Token generation
            const token=jwt.sign({
                loginAcno:acno
            },'superkey2023')

            //If acno and password are present in db
            return{
                statusCode:200,
                message:"Login Successful",
                currentUser:response.username,//Current user name send to frontend
                balance:response.balance,//Current balance
                token,
                currentAcno:acno
            }
        }
        //acno and password are not present in db
        else{
            return{
                statusCode:401,
                message:"Invalid login"
            }
        }
    })
}

    //Logic for getting the balance
    const getBalance=(acno)=>{
        return db.User.findOne({acno}).then((result)=>{
            if(result){
                return{
                    statusCode:200,
                    balance:result.balance
                }
            }
            else{
                return{
                statusCode:401,
                message : 'Invalid acno'
                }
            }
        })
    }

    //Fund transfer
    const fundTransfer=(fromAcno,frompswd,toAcno,amt)=>{
        
        //convert amt to a number
        let amount=parseInt(amt)
        //Check fromAcno and frompswd in mongodb
        return db.User.findOne({acno:fromAcno,password:frompswd}).then((debit)=>{
            if(debit){
                //Check toAcno in mongodb
                return db.User.findOne({acno:toAcno}).then((credit)=>{
                    //Fund Transfer
                    if(credit){
                        if(debit.balance>=amount){
                            debit.balance-=amount
                            debit.transactions.push({
                                type:'Debit',
                                amount,
                                fromAcno,
                                toAcno
                            })
                        
                        }
                        else{
                            return{
                                statusCode:401,
                                message:'Insufficient balance'
                            }
                        }
                        //Save changes into database
                        debit.save()


                        credit.balance+=amount
                        credit.transactions.push({
                            type:'Credit',
                            amount,
                            fromAcno,
                            toAcno
                        })
                        //Save changes into database
                        credit.save()

                        //send response back to client
                        return{
                            statusCode:200,
                            message:'Fund transfer successful...'

                        }
                    }
                    else{
                        return{
                            statusCode:401,
                            message:'Invalid credit details'
                        }
                    }

                })
            }
            else{
                return{
                    statusCode:401,
                    message:'Invalid debit details'
                }
            }
        })
    }
//Transaction history
const transactionHistory=(acno)=>{
//Check acno present in mongodb
return db.User.findOne({acno}).then((result)=>{
    if(result){
        return{
            statusCode:200,
            transactions:result.transactions
        }
    }
    else{
        return{
            statusCode:401,
            message:'Invalid Data'
        }
    }
})
}

const deleteAccount=(acno)=>{
    //Account delete from database
    return db.User.deleteOne({acno}).then((result)=>{
        return{
            statusCode:200,
            message:"Account deleted successfully"
        }
    })

}

module.exports={
    register,
    login,
    getBalance,
    fundTransfer,
    transactionHistory,
    deleteAccount
}