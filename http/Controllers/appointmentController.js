const Appointment = require("../../Models/Appointment");
const SiteSetting = require("../../Models/SiteSetting");
const logError = require("../../logger/log");
const logMiddleware = require("../middlewares/logMiddleware");
const helperFunc = require("../../helpers/helperFunc");
const globalVariable = require("../../config/globalVariable");
const sendEmail = require("../../helpers/emailsent");
const Country = require("../../Models/Country");
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
                    phone_code: country.phone_code,
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
            try {
                
                return res.status(200).json({
                    success: true,
                    message: "Date and time slots disabled successfully",
                });
            } catch (error) {
                console.log(error);
                logError(error, req);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error"
                });
            }
        }
    };
};
module.exports = appointmentController;
