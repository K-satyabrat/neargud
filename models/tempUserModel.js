const mongoose = require('mongoose');

const tempUserSchema = new mongoose.Schema({
    userPhoneNumber:{
        type: Number,
        required: true,
        validate: {
            validator: function(v) {
              return /^\d{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
          },
    },
    otp:{
        type:Number,
        required:true
    }
},
{timestamps:true})

const TempUser = mongoose.model('TempUser',tempUserSchema)
 
module.exports = TempUser;