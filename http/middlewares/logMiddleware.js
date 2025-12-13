const AdminLog = require('../../Models/AdminLog')
 
const adminLog =  async (actionId,adminId,remark,ipAddress,actionModule, transaction = null)=> {
    const logData = {
       action_id:actionId,
       admin_id:adminId,
       remark:remark,
       ip_address:ipAddress,
       action_module: actionModule,
    }
     
  return AdminLog.create(logData, { transaction })

}
module.exports = adminLog