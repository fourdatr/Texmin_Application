
const db = require("./dbconnect"); // dev
/* var db=require('/home/ubuntu/pdmc/backendapi/routes/db/dbconnect'); */ // localhost

var Data = {
  
  user: function (Logindata, callback) {
    console.log("user: ", Logindata);

    return db.query(
      "CALL mining.sp_users(?,?,?,?,?,?,?,?,?)",
      [Logindata.mode, Logindata.firstname, Logindata.lastname, Logindata.sipID, Logindata.userID, Logindata.password, Logindata.department, Logindata.designation, Logindata.contactNo],
      callback
    );
  },
  calllog: function (Logindata, callback) {
    console.log("user: ", Logindata);

    return db.query(
      "CALL mining.sp_calllog(?,?,?,?,?,?,?)",
      [Logindata.mode, Logindata.userID, Logindata.toID, Logindata.startDate, Logindata.endDate, Logindata.callStatus, Logindata.uID],
      callback
    );
  },	
  verify: function (Logindata, callback) {
    console.log("verify: ", Logindata);

    return db.query(
      "CALL sp_verification(?,?,?,?)",
      [Logindata.mode, Logindata.userID, Logindata.password, Logindata.extra],
      callback
    );
  },
  };

module.exports = Data;
