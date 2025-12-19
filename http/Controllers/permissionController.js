const Permission = require("../../Models/Permission");
const logError = require("../../logger/log");
const RolePermission = require("../../Models/RolePermission");

const PermissionController = () => {
    return {
        read: async (req, res) => {
            try {

                const mydata = await Permission.findAll({
                    where: {
                        deleted_at: null
                    }
                });

                var finalData = {};
                let MasterfinalData = {};
                Object.keys(mydata).forEach(function (key) {
                    var val = mydata[key].dataValues;
                    MasterfinalData[val.type] = {};
                    if (finalData.hasOwnProperty(val.type)) {
                        finalData[val.type].push(val);
                    } else {
                        finalData[val.type] = [val];
                    }
                });

                Object.keys(finalData).forEach(function (key) {
                    var valss = finalData[key];
                    Object.keys(valss).forEach(function (keysss) {
                        var val = valss[keysss];
                        if (MasterfinalData[val.type].hasOwnProperty(val.rights)) {
                            MasterfinalData[val.type][val.rights].push(val);
                        } else {
                            MasterfinalData[val.type][val.rights] = [val];
                        }
                    })
                });

                if (!mydata.length) {
                    return res.status(204).json({
                        success: true,
                        message: "No permissions found",
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Permissions fetched successfully",
                    data: MasterfinalData,
                });
            } catch (error) {
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        },
        readUserPermission: async (req, res) => {
            try {
                let mydata = await RolePermission.findAll({
                    where: {
                        role_id: req.user.role_id,
                        permission_id: req.user.permissionarray,
                    },
                    include: [
                        {
                            model: Permission,
                            as: 'userRolePermission',
                            required: true
                        }
                    ]
                });

                mydata = mydata.map((x) => {
                    return x.dataValues.userRolePermission
                });

                var finalData = {};
                let MasterfinalData = {};
                Object.keys(mydata).forEach(function (key) {
                    var val = mydata[key].dataValues;
                    MasterfinalData[val.type] = {};
                    if (finalData.hasOwnProperty(val.type)) {
                        finalData[val.type].push(val);
                    } else {
                        finalData[val.type] = [val];
                    }
                });
                Object.keys(finalData).forEach(function (key) {
                    var valss = finalData[key];
                    Object.keys(valss).forEach(function (keysss) {
                        var val = valss[keysss];
                        if (MasterfinalData[val.type].hasOwnProperty(val.rights)) {
                            MasterfinalData[val.type][val.rights].push(val);
                        } else {
                            MasterfinalData[val.type][val.rights] = [val];
                        }
                    })
                });

                if (!mydata.length) {
                    return res.status(204).json({ 
                        success: true,
                        message: "No permissions found",
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Permissions fetched successfully",
                    data: MasterfinalData,
                });

            } catch (error) {
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        },
    };
};

module.exports = PermissionController;