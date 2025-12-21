const logError = require("../../logger/log");
const MetalRateMaster = require("../../Models/MetalRateMaster");
const Karat = require("../../Models/Karat");
const Metal = require("../../Models/Metal");
const metalRateMasterController = () => {
    return {
        create: async (req, res) => {
            try {
                if (!req.body.karat_id || req.body.karat_id === "") {
                    return res.status(409).json({
                        success: true,
                        message: "Please enter karat id",
                    });
                }

                if (!req.body.metal_id || req.body.metal_id === "") {
                    return res.status(409).json({
                        success: true,
                        message: "Please enter metal id",
                    });
                }

                const karat = await Karat.findByPk(req.body.karat_id);
                if (!karat) {
                    return res.status(409).json({
                        success: true,
                        message: "Karat not found",
                    });
                }

                const metal = await Metal.findByPk(req.body.metal_id);
                if (!metal) {
                    return res.status(409).json({
                        success: true,
                        message: "Metal not found",
                    });
                }

                const date = req.body.date ? new Date(req.body.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

                // Check if record exists with same karat_id, metal_id and date
                const existingRecord = await MetalRateMaster.findOne({
                    where: {
                        karat_id: req.body.karat_id,
                        metal_id: req.body.metal_id,
                        date: date
                    }
                });

                let mydata;
                let message;
                if (existingRecord) {
                    // Update existing record
                    await existingRecord.update({
                        rate: parseFloat(req.body.rate || 0)
                    });
                    mydata = existingRecord;
                    message = "Metal rate master updated successfully";
                } else {
                    // Create new record
                    const data = {
                        karat_id: req.body.karat_id,
                        metal_id: req.body.metal_id,
                        rate: parseFloat(req.body.rate || 0),
                        date: date,
                    };
                    mydata = await MetalRateMaster.create(data);
                    message = "Metal rate master created successfully";
                }

                return res.status(200).json({
                    success: true,
                    message: message,
                    data: mydata,
                });

            } catch (error) {
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error"
                });
            }
        },
        read: async (req, res) => {
            try {

                const mydata = await MetalRateMaster.findAll({
                    include: [
                        {
                            model: Karat,
                            as: 'karat',
                            attributes: ['id', 'karat'],
                        },
                        {
                            model: Metal,
                            as: 'metal',
                            attributes: ['id', 'metal_name']
                        }
                    ],
                    order: [['id', 'DESC']]
                });

                const data = mydata.map((x) => {
                    return {
                        id: x.dataValues.id,
                        karat_id: x.dataValues.karat ? x.dataValues.karat.dataValues.id : null,
                        metal_id: x.dataValues.metal ? x.dataValues.metal.dataValues.id : null,
                        metal_name: x.dataValues.metal ? x.dataValues.metal.dataValues.metal_name : null,
                        karat: x.dataValues.karat ? x.dataValues.karat.dataValues.karat : null,
                        rate: x.dataValues.rate,
                        date: x.dataValues.date,
                    };
                });

                return res.status(200).json({
                    success: true,
                    message: "Metal rate master fetched successfully",
                    data: data,
                });
            } catch (error) {
                console.log(error)
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        },
        karatRead: async (req, res) => {
            try {

                const mydata = await Karat.findAll({
                    include: [{
                        model: require("../../Models/Metal"),
                        as: 'metal',
                        attributes: ['id', 'metal_name']
                    }]
                });

                const data = mydata.map((x) => {
                    return {
                        id: x.dataValues.id,
                        metal_type: x.dataValues.metal && x.dataValues.metal.dataValues ? x.dataValues.metal.dataValues.metal_name : null,
                        karat_value: x.dataValues.karat_value,
                        karat: x.dataValues.karat,
                    };
                });

                return res.status(200).json({
                    success: true,
                    message: "Karat fetched successfully",
                    data: data,
                });
            } catch (error) {
                console.log(error)
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        },
    };
};  
module.exports = metalRateMasterController;
