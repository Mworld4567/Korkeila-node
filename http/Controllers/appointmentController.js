const Appointment = require("../../Models/Appointment");
const logError = require("../../logger/log");
const logMiddleware = require("../middlewares/logMiddleware");
const helperFunc = require("../../helpers/helperFunc");
const globalVariable = require("../../config/globalVariable");
const sendEmail = require("../../helpers/emailsent");
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

                // Prepare email content
                const emailSubject = "Appointment Confirmation";
                const emailHtml = `
                    <html>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                                <h2 style="color: #4a5568;">Appointment Confirmation</h2>
                                <p>Dear ${appointmentData.first_name} ${appointmentData.last_name},</p>
                                <p>Thank you for scheduling an appointment with us. Your appointment details are as follows:</p>
                                <div style="background-color: #f7fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                    <p><strong>Name:</strong> ${appointmentData.first_name} ${appointmentData.last_name}</p>
                                    <p><strong>Email:</strong> ${appointmentData.email}</p>
                                    <p><strong>Phone:</strong> ${appointmentData.phone_number}</p>
                                    ${appointmentData.country ? `<p><strong>Country:</strong> ${appointmentData.country}</p>` : ''}
                                    <p><strong>Date:</strong> ${appointmentData.date}</p>
                                    <p><strong>Time Slot:</strong> ${appointmentData.time_slot}</p>
                                    ${appointmentData.description ? `<p><strong>Description:</strong> ${appointmentData.description}</p>` : ''}
                                </div>
                                <p>We look forward to meeting you!</p>
                                <p>Best regards,<br>Korkeila Team</p>
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
        }
    };
};
module.exports = appointmentController;
