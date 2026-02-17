const { Op } = require("sequelize");
const Appointment = require("../../Models/Appointment");
const SiteSetting = require("../../Models/SiteSetting");
const logError = require("../../logger/log");
const logMiddleware = require("../middlewares/logMiddleware");
const helperFunc = require("../../helpers/helperFunc");
const globalVariable = require("../../config/globalVariable");
const sendEmail = require("../../helpers/emailsent");
const Country = require("../../Models/Country");
const sequelize = require("../../config/dbconfig");
const DisabledDateforAppointment = require("../../Models/DisabledDateforAppointment");
const DisabledTimeSlotsForAppointment = require("../../Models/DisabledTimeSlotsForAppointment");
const dateFunc = require("../../helpers/dateFunc");
const appointmentController = () => {
    return {
        create: async (req, res) => {
            const transaction = req.transaction || null;
            try {

                // Validation for required fields
                if (!req.body.email || req.body.email === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter your email",
                    });
                }

                // Email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(req.body.email)) {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter a valid email address",
                    });
                }

                if (!req.body.first_name || req.body.first_name === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter your first name",
                    });
                }

                if (!req.body.last_name || req.body.last_name === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter your last name",
                    });
                }

                if (!req.body.phone_number || req.body.phone_number === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please enter your phone number",
                    });
                }

                if (!req.body.date || req.body.date === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please select an appointment date",
                    });
                }

                if (!req.body.time_slot || req.body.time_slot === "") {
                    return res.status(409).json({
                        success: false,
                        message: "Please select a time slot",
                    });
                }

                // Phone number validation
                if (req.body.phone_number) {
                    const phoneRegex = /^[0-9]{10,15}$/;
                    if (!phoneRegex.test(req.body.phone_number.replace(/[\s\-\(\)]/g, ''))) {
                        return res.status(409).json({
                            success: false,
                            message: "Please enter a valid phone number",
                        });
                    }
                }

                // Prepare appointment data
                const appointmentData = {
                    first_name: req.body.first_name.trim(),
                    last_name: req.body.last_name.trim(),
                    email: req.body.email.trim(),
                    phone_number: req.body.phone_number.trim(),
                    date: req.body.date,
                    time_slot: req.body.time_slot.trim(),
                };

                if (req.body.country && req.body.country !== "") {
                    appointmentData.country = req.body.country.trim();
                }

                if (req.body.description && req.body.description !== "") {
                    appointmentData.description = req.body.description.trim();
                }

                // Save appointment to database
                const appointment = await Appointment.create(appointmentData, { transaction });

                // Get language_id from params (body or query) and determine message
                const language_id = req.body.language_id || req.query.language_id || globalVariable.languageId.English;
                let inquiryMessage;
                
                if (language_id == globalVariable.languageId.English || language_id == 1) {
                    inquiryMessage = "Thank you for your inquiry. We will be in touch soon.";
                } else if (language_id == globalVariable.languageId.Finnish || language_id == 2) {
                    inquiryMessage = "Kiitos yhteydenotostasi. Olemme teihin yhteydessä mahdollisimman pian.";
                } else {
                    // Default to English if language_id doesn't match
                    inquiryMessage = "Thank you for your inquiry. We will be in touch soon.";
                }

                // Fetch site logo from site-settings
                const siteSetting = await SiteSetting.findOne({ order: [['id', 'ASC']] });
                const logoUrl = siteSetting && siteSetting.site_logo_url ? siteSetting.site_logo_url : null;

                // Prepare email content
                const emailSubject = "Appointment Confirmation";
                const emailHtml = `
                    <html>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                                ${logoUrl ? `
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <img src="${logoUrl}" alt="Logo" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" />
                                </div>
                                ` : ''}
                                <h2 style="color: #4a5568; text-align: center;">Appointment Confirmation</h2>
                                <p>Dear ${appointmentData.first_name} ${appointmentData.last_name},</p>
                                <p>${inquiryMessage}</p>
                                <div style="background-color: #f7fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                    <p><strong>Name:</strong> ${appointmentData.first_name} ${appointmentData.last_name}</p>
                                    <p><strong>Email:</strong> ${appointmentData.email}</p>
                                    <p><strong>Phone:</strong> ${appointmentData.phone_number}</p>
                                    ${appointmentData.country ? `<p><strong>Country:</strong> ${appointmentData.country}</p>` : ''}
                                    <p><strong>Date:</strong> ${appointmentData.date}</p>
                                    <p><strong>Time Slot:</strong> ${appointmentData.time_slot}</p>
                                    ${appointmentData.description ? `<p><strong>Description:</strong> ${appointmentData.description}</p>` : ''}
                                </div>
                                <p>Kind regards,<br>Korkeila Helsinki</p>
                            </div>
                        </body>
                    </html>
                `;

                // Send email
                try {
                    await sendEmail(appointmentData.email, emailSubject, emailHtml);
                } catch (emailError) {
                    console.log("Email sending failed:", emailError);
                    // Log error but don't fail the appointment creation
                    logError(emailError, req);
                }

                return res.status(200).json({
                    success: true,
                    message: "Appointment created successfully and confirmation email sent",
                    data: {
                        id: appointment.id,
                        first_name: appointment.first_name,
                        last_name: appointment.last_name,
                        email: appointment.email,
                        phone_number: appointment.phone_number,
                        country: appointment.country || null,
                        date: appointment.date,
                        time_slot: appointment.time_slot,
                        description: appointment.description || null,
                    },
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
        getTimeSlots: async (req, res) => {
            try {
                const timeSlots = [];
                const startHour = 10;
                const endHour = 18;
                const slotDuration = 30;

                for (let hour = startHour; hour < endHour; hour++) {
                    for (let minute = 0; minute < 60; minute += slotDuration) {
                        const startTime = new Date();
                        startTime.setHours(hour, minute, 0, 0);
                        
                        const endTime = new Date();
                        endTime.setHours(hour, minute + slotDuration, 0, 0);
                        
                        const formatTime = (date) => {
                            let hours = date.getHours();
                            const minutes = date.getMinutes();
                            const ampm = hours >= 12 ? 'PM' : 'AM';
                            hours = hours % 12;
                            hours = hours ? hours : 12;
                            const minutesStr = minutes < 10 ? '0' + minutes : minutes;
                            return `${hours}:${minutesStr} ${ampm}`;
                        };

                        const startTimeFormatted = formatTime(startTime);
                        const endTimeFormatted = formatTime(endTime);

                        timeSlots.push(`${startTimeFormatted} to ${endTimeFormatted}`);
                    }
                }

                return res.status(200).json({
                    success: true,
                    message: "Time slots retrieved successfully",
                    data: timeSlots
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
        getCountries: async (req, res) => {
            try {
                
                const countries = await Country.findAll({
                    order: [['country_name', 'ASC']]
                });
                const countryData = countries.map(country => ({
                    id: country.id,
                    country: country.country_name,
                    iso_code: country.iso_code,
                    phone_code: `+${country.phone_code}`,
                }));
                
                return res.status(200).json({
                    success: true,
                    message: "Countries retrieved successfully",
                    data: countryData
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
        disableDateAndTimeSlots: async (req, res) => {
            const transaction = await sequelize.transaction();
            try {
                const payload = req.body;
                const adminId = req.user.id;

                for (const item of payload) {
                    if (!item.date) {
                        await transaction.rollback();
                        return res.status(400).json({
                            success: false,
                            message: "Each item must have a date.",
                        });
                    }

                    // Create the disabled date record
                    const disabledDate = await DisabledDateforAppointment.create(
                        {
                            admin_id: adminId,
                            date: item.date,
                            flag: 0,
                        },
                        { transaction }
                    );

                    // Create time slot records if any are provided
                    if (Array.isArray(item.disabled_timeSlots) && item.disabled_timeSlots.length > 0) {
                        const timeSlotsData = item.disabled_timeSlots.map((slot) => ({
                            admin_id: adminId,
                            disabled_date_for_appointment_id: disabledDate.id,
                            time_slot: slot.time_slot,
                            flag: slot.flag !== undefined ? slot.flag : 0,
                        }));

                        await DisabledTimeSlotsForAppointment.bulkCreate(timeSlotsData, { transaction });
                    }
                }

                await transaction.commit();

                return res.status(200).json({
                    success: true,
                    message: "Date and time slots disabled successfully",
                });
            } catch (error) {
                await transaction.rollback();
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        },
        getDisabledDateAndTimeSlots: async (req, res) => {
            try {
                const today = new Date().toISOString().split('T')[0];

                const disabledDates = await DisabledDateforAppointment.findAll({
                    where: { deleted_at: null, date: { [Op.gte]: today } },
                    include: [
                        {
                            model: DisabledTimeSlotsForAppointment,
                            as: 'disabled_time_slots',
                            where: { deleted_at: null },
                            required: false,
                        },
                    ],
                    order: [['date', 'ASC']],
                });

                const bookedAppointments = await Appointment.findAll({
                    where: { deleted_at: null, date: { [Op.gte]: today } },
                    order: [['date', 'ASC']],
                });

                // Group by date using a map
                const dateMap = {};

                // Add disabled time slots with flag 0
                for (const item of disabledDates) {
                    const date = item.date;
                    if (!dateMap[date]) {
                        dateMap[date] = { date_id: item.id, date, disabled_timeSlots: [] };
                    }
                    if (item.disabled_time_slots && item.disabled_time_slots.length > 0) {
                        for (const slot of item.disabled_time_slots) {
                            dateMap[date].disabled_timeSlots.push({
                                time_slot_id: slot.id,
                                time_slot: slot.time_slot,
                                flag: 0,
                            });
                        }
                    }
                }

                // Add booked appointments with flag 1
                for (const appointment of bookedAppointments) {
                    const date = appointment.date;
                    if (!dateMap[date]) {
                        dateMap[date] = { date_id: null, date, disabled_timeSlots: [] };
                    }
                    dateMap[date].disabled_timeSlots.push({
                        time_slot: appointment.time_slot,
                        flag: 1,
                    });
                }

                // Convert map to array sorted by date ascending
                const result = Object.values(dateMap)
                    .sort((a, b) => new Date(a.date) - new Date(b.date));

                return res.status(200).json({
                    success: true,
                    message: "Disabled date and time slots retrieved successfully",
                    data: result,
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
        deleteDisabledDateAndTimeSlots: async (req, res) => {
            const transaction = await sequelize.transaction();
            try {
                const date_id = req.params.date_id;
                const time_slot_id = req.params.time_slot_id;
                const adminId = req.user.id;

                const disabledDate = await DisabledDateforAppointment.findOne({
                    where: { deleted_at: null, id: date_id, admin_id: adminId },
                    transaction,
                });

                if (!disabledDate) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: "Disabled date not found.",
                    });
                }

                const dateTime = dateFunc();

                if (!time_slot_id) {
                    // No time_slot_id provided — delete main date record and all its child time slots
                    await DisabledDateforAppointment.update({ deleted_at: dateTime }, { where: { id: date_id }, transaction });
                    await DisabledTimeSlotsForAppointment.update({ deleted_at: dateTime }, { where: { disabled_date_for_appointment_id: date_id }, transaction });

                    await transaction.commit();
                    return res.status(200).json({
                        success: true,
                        message: "Disabled date and all time slots deleted successfully",
                    });
                }

                // time_slot_id provided — delete only that one time slot
                await DisabledTimeSlotsForAppointment.update(
                    { deleted_at: dateTime },
                    { where: { disabled_date_for_appointment_id: date_id, id: time_slot_id }, transaction }
                );

                // Check if any active time slots remain for this date
                const remainingSlots = await DisabledTimeSlotsForAppointment.count({
                    where: { disabled_date_for_appointment_id: date_id, deleted_at: null },
                    transaction,
                });

                if (remainingSlots === 0) {
                    // All time slots deleted — also delete the main date record
                    await DisabledDateforAppointment.update({ deleted_at: dateTime }, { where: { id: date_id }, transaction });
                }

                await transaction.commit();
                return res.status(200).json({
                    success: true,
                    message: remainingSlots === 0
                        ? "Disabled date and all time slots deleted successfully"
                        : "Time slot deleted successfully",
                });
            } catch (error) {
                await transaction.rollback();
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        }
    };
};
module.exports = appointmentController;
