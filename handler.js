'use strict';
const axios = require('axios');
const aws = require('aws-sdk');

const ses = new aws.SES({ region: 'us-west-2' });
const url = 'https://www.philippineconsulatela.org/wp-admin/admin-ajax.php';
const link = 'https://www.philippineconsulatela.org/cgasc1';

async function checkSlotsForMonth(month, year) {
  const params = {
    location: 1,
    service: 1,
    worker: 1,
    action: 'ea_month_status',
    month, year
  };
  try {
    const resp = await axios.get(url, { params })
    const days = resp.data;
    const hasAvailable = Object.values(days).some(d => (d!=='busy' && d!=='no-slots'));
    if (hasAvailable) {
      const msg = `New Appointment Slots found for month ${month} year ${year}`;
      console.log(msg);
      //send email
      sendEmail('Passport Appointment Slots Available', `
        ${msg}
        visit ${link}
      `);
    } else {
      console.log(`No slots found for month ${month} year ${year}`);
      // sendEmail('NO Passport Appointment Slots Available', `No slots found for month ${month} year ${year}`);
    }
  } catch (error) {
    console.error('error parsing response', error); 
  }
}

function sendEmail(subject, body) {
  ses.sendEmail({
    Source: 'charton.sapinoso@gmail.com',
    Destination: {
      ToAddresses: ['csapinoso@me.com', 'sapfam@googlegroups.com'],
    },
    Message: {
      Subject: { Data: subject },
      Body: {
        Text: {
          Data: body,
        },
      },
    },
  }, (err, data) => {
    if (err) {
      console.log('Error sending email: ', err);
    }
    if (data) {
      console.log('Email sent:', data);
    }
  });
}

module.exports.checkAvailability = async (event, context) => {
  // get the next 3 months from now
  const today = new Date();
  let month = today.getMonth();
  for (let index = 1; index <= 3; index++) {
    await checkSlotsForMonth(month+index, today.getFullYear());
  }
};
