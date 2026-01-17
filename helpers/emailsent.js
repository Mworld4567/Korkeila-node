const nodemailer = require('nodemailer')
sendEmail = async (email, subject, htmlString, attachment) => {
    // Port 465 uses direct SSL/TLS, port 587 uses STARTTLS
    const port = parseInt(process.env.SMTP_PORT) || 587;
    const isSecure = port === 465;

    var mail = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: isSecure,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_USER_PASS
        },
        // For port 587, require TLS
        ...(port === 587 && { requireTLS: true })
    });
    var mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        // cc: 'nirmitrshah@aol.in',
        bcc: 'nirmitrshah@aol.in', 
        subject: subject,
        html: htmlString,
        attachments: attachment
    };
    return mail.sendMail(mailOptions)
}
module.exports = sendEmail