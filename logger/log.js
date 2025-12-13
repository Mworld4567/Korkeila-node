const logger = require('./index')
const email = require("nodemailer")
const url = require('url')
// function to generate file and send mail for error 
function errorlog(err, req) {
  var parsedUrl = url.parse(req.url, true)
  const errObj = {
    ipAddres: req.ip,
    message: err.message,
    errStatus: err.status || 500,
    originalUrl: req.originalUrl,
    parameters: parsedUrl.query,
    reqMethod: req.method,
    search: parsedUrl.search,
    log: console.log(err)
  }
  // creating log files of error
  logger.info(errObj);
  // logger.error(`${err.status || 500} - ${res.statusMessage} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  const subject = JSON.stringify(errObj)

  // //sending error mail 
  // const transport = email.createTransport({
  //   host: process.env.SMTP_HOST,
  //   port: process.env.SMTP_PORT,
  //   secure: process.env.SMTP_USER === "vkjdbbk@gmail.com" ? false : true,
  //   auth: {
  //       user: process.env.SMTP_USER,
  //       pass: process.env.SMTP_USER_PASS
  //   }
  //   });

  // const mailOptions = {
  //     from: process.env.SMTP_USER,
  //     to: 'shivamgarala1010@gmail.com',
  //     subject: 'VKJ:error:LOG: '+process.env.WEBSITE_URL,
  //     text: subject
  //   };

  //   transport.sendMail(mailOptions,function(error, info){
  //     if (error) {
  //       console.log('VKJ:error:LOG' + error);
  //     } else {
  //       console.log('Email sent: ' + info.response);
  //     }
  // })

}

module.exports = errorlog