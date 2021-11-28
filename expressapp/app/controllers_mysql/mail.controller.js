const mailjet = require('node-mailjet');
const nodemailer = require('nodemailer');
const SENDGRID_API_KEY = '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';


exports.mailjet = (req, res) => {
    mailjet.connect('314daaf1e040fc3fa3d6eef6defdd211', '8bec2e6eac84c06d7f51e41255ef48bc')
    const request = mailjet
        .post("send", { 'version': 'v3.1' })
        .request({
            "Messages": [
                {
                    "From": {
                        "Email": "debadeep.sen@bandhan.org",
                        "Name": "Debadeep via MailJet"
                    },
                    "To": [
                        {
                            "Email": "debadeep.sen@bandhan.org",
                            "Name": "Debadeep"
                        },
                        {
                            "Email": "debadeep.sen@gmail.org",
                            "Name": "Debadeep"
                        }
                    ],
                    "Subject": "Greetings from Mailjet.",
                    "TextPart": "My first Mailjet email",
                    "HTMLPart": "<h3>Dear passenger 1, welcome to <a href='https://www.mailjet.com/'>Mailjet</a>!</h3><br />May the delivery force be with you!",
                    "CustomID": "AppGettingStartedTest"
                }
            ]
        })
    request
        .then((result) => {
            console.log(result.body)
        })
        .catch((err) => {
            console.log(err.statusCode)
        })
}

exports.sendgrid = (req, res) => {

    let url = `https://api.sendgrid.com/v3/mail/send`;
    let header = { "Authorization": `Bearer ${SENDGRID_API_KEY}`, "Content-Type": 'application/json' };
    let data = '{"personalizations": [{"to": [{"email": "debadeep.sen@bandhan.org"}]}],"from": {"email": "test@example.com"},"subject": "Sending with SendGrid is Fun","content": [{"type": "text/html", "value": "and <b><i>easy</i></b> to do anywhere,<hr> even with cURL"}]}'

    fetch(url, {
        method: 'POST',
        headers: header,
        body: data
    })
        .then(r => r.json())
        .then(d => {
            res.status(200).send({
                success: true,
                data: d
            })
        });
}

exports.sendsmtp = (req, res) => {

    let transport = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
            user: 'apikey',
            pass: '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'
        }
    });

    const message = {
        from: 'sepm.admin@bandhan.org', // Sender address
        to: 'debadeep.sen@bandhan.org',         // List of recipients
        subject: 'You have deadlines approaching', // Subject line
        text: 'Have the most fun you can in a car. Get your Tesla today!' // Plain text body
    };

    transport.sendMail(message, function (err, info) {
        if (err) {
            res.status(400).send({
                error: err,
                data: null
            });
        } else {
            res.status(200).send({
                error: null,
                data: info
            });
        }
    });

}

exports.sendgmail = (req, res) => {

    let transport = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
            user: 'sepm.management@gmail.com',
            pass: 'softwareprocessadmin'
        }
    });

    // const message = {
    //     from: '"🔔 SEPM Admin"  sepm.management@gmail.com', // Sender address
    //     to: 'debadeep.sen@bandhan.org',         // List of recipients
    //     subject: 'Reminder to submit your timesheet', // Subject line
    //     html: '<h2 style="color:#7ad">Your timesheet is pending submission</h2><p>If you do not submit your timesheet, it will be <i>auto-submitted</i> on Saturday, 28 December, 2019, at 11:59PM.</p>',
    //     attachments: [
    //         { // Use a URL as an attachment
    //             filename: 'this_is_a_test_attachment.jpg',
    //             path: 'https://miro.medium.com/max/3016/0*i1XbVjul86E_CSyf.jpg'
    //         }
    //     ]
    // };

    // console.log(req.body);
    // return res.send('ok');

    const message = req.body.message;

    transport.sendMail(message, function (err, info) {
        if (err) {
            res.status(400).send({
                error: err,
                data: null
            });
        } else {
            res.status(200).send({
                error: null,
                data: info
            });
        }
    });

}

exports.sendgmailfunction = (emailObj) => {

    let transport = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
            user: 'sepm.management@gmail.com',
            pass: 'softwareprocessadmin'
        }
    });

    const message = emailObj.message;

    console.log('------')
    console.log(message)
    console.log('------')

    transport.sendMail(message, function (err, info) {
        console.log(err);
        console.log(info);
    });
}