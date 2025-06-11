const { default: mongoose } = require("mongoose");
 

 
 
const adminSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    url: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
 
 
 
const Admin = mongoose.model("Admin", adminSchema);
 

module.exports=Admin;