const logError = require("../../logger/log");
const MetalRateMaster = require("../../Models/MetalRateMaster");
const Karat = require("../../Models/Karat");
const Metal = require("../../Models/Metal");
const { Op } = require("sequelize");
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

                // Check if record exists with same karat_id and metal_id
                const existingRecord = await MetalRateMaster.findOne({
                    where: {
                        karat_id: req.body.karat_id,
                        metal_id: req.body.metal_id,
                    }
                });

                if (existingRecord) {
                    return res.status(409).json({
                        success: false,
                        message: "Metal rate master with this karat and metal already exists",
                    });
                }

                // Create new record
                const data = {
                    karat_id: req.body.karat_id,
                    metal_id: req.body.metal_id,
                    rate: parseFloat(req.body.rate || 0),
                    // date: date,
                };
                const mydata = await MetalRateMaster.create(data);

                return res.status(200).json({
                    success: true,
                    message: "Metal rate master created successfully",
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
                        // date: x.dataValues.date,
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
        metalRateMasterDropdown: async (req, res) => {
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
                            attributes: ['id', 'metal_name', 'metal_code']
                        }
                    ],
                    order: [['id', 'DESC']]
                });

                const data = mydata.map((x) => {
                    const metal = x.dataValues.metal ? x.dataValues.metal.dataValues : null;
                    const metalCode = metal ? (metal.metal_code || metal.metal_name) : null;
                    const karat = x.dataValues.karat ? x.dataValues.karat.dataValues.karat : null;
                    const name = metalCode && karat ? `${metalCode} ${karat}` : (metalCode || karat || '');
                    
                    return {
                        id: x.dataValues.id,
                        name: name
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
        update: async (req, res) => {
            try {
                const metalRateData = await MetalRateMaster.findByPk(req.params.id);
                if (!metalRateData) {
                    return res.status(409).json({
                        success: true,
                        message: "Metal rate master not found",
                    });
                }
 
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
 
                // const date = req.body.date ? new Date(req.body.date).toISOString().split('T')[0] : metalRateData.date;
 
                // Check if record exists with same karat_id, metal_id and date (excluding current record)
                const existingRecord = await MetalRateMaster.findOne({
                    where: {
                        karat_id: req.body.karat_id,
                        metal_id: req.body.metal_id,
                        // date: date,
                        id: { [Op.ne]: parseInt(req.params.id) }
                    }
                });
 
                if (existingRecord) {
                    return res.status(409).json({
                        success: false,
                        message: "Metal rate master with this karat and metal already exists",
                    });
                }
 
                const data = {
                    karat_id: req.body.karat_id,
                    metal_id: req.body.metal_id,
                    rate: parseFloat(req.body.rate || 0),
                    // date: date,
                };
 
                await MetalRateMaster.update(data, {
                    where: { id: req.params.id }
                });
 
                const updatedData = await MetalRateMaster.findByPk(req.params.id, {
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
                    ]
                });
 
                const responseData = {
                    id: updatedData.dataValues.id,
                    karat_id: updatedData.dataValues.karat ? updatedData.dataValues.karat.dataValues.id : null,
                    metal_id: updatedData.dataValues.metal ? updatedData.dataValues.metal.dataValues.id : null,
                    metal_name: updatedData.dataValues.metal ? updatedData.dataValues.metal.dataValues.metal_name : null,
                    karat: updatedData.dataValues.karat ? updatedData.dataValues.karat.dataValues.karat : null,
                    rate: updatedData.dataValues.rate,
                    // date: updatedData.dataValues.date,
                };
 
                return res.status(200).json({
                    success: true,
                    message: "Metal rate master updated successfully",
                    data: responseData,
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
        delete: async (req, res) => {
            try {
                const metalRateData = await MetalRateMaster.findByPk(req.params.id);
                if (!metalRateData) {
                    return res.status(409).json({
                        success: false,
                        message: "Metal rate master not found",
                    });
                }

                await MetalRateMaster.destroy({
                    where: { id: req.params.id }
                });

                return res.status(200).json({
                    success: true,
                    message: "Metal rate master deleted successfully",
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
module.exports = metalRateMasterController;
