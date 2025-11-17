const nodemailer = require('nodemailer');
const Busboy = require('busboy');

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        let parsedData = {};
        let attachment = null;
        let attachmentName = null;
        let attachmentType = null;

        // Parse multipart form data
        return new Promise((resolve, reject) => {
            const busboy = Busboy({ 
                headers: event.headers,
                limits: {
                    fileSize: 10 * 1024 * 1024 // 10MB limit
                }
            });

            busboy.on('field', (fieldname, value) => {
                parsedData[fieldname] = value;
            });

            busboy.on('file', (fieldname, file, info) => {
                const { filename, encoding, mimeType } = info;
                attachmentName = filename;
                attachmentType = mimeType;
                
                const chunks = [];
                file.on('data', (data) => {
                    chunks.push(data);
                });
                
                file.on('end', () => {
                    attachment = Buffer.concat(chunks);
                });
            });

            busboy.on('finish', async () => {
                try {
                    await sendEmail(parsedData, attachment, attachmentName, attachmentType);
                    resolve({
                        statusCode: 200,
                        body: JSON.stringify({ 
                            message: 'تم إرسال الإيميل بنجاح',
                            success: true 
                        })
                    });
                } catch (error) {
                    reject({
                        statusCode: 500,
                        body: JSON.stringify({ 
                            error: 'حدث خطأ أثناء إرسال الإيميل: ' + error.message 
                        })
                    });
                }
            });

            busboy.on('error', (error) => {
                reject({
                    statusCode: 500,
                    body: JSON.stringify({ 
                        error: 'خطأ في معالجة البيانات: ' + error.message 
                    })
                });
            });

            // Handle base64 encoded body from Netlify
            if (event.isBase64Encoded) {
                busboy.end(Buffer.from(event.body, 'base64'));
            } else {
                busboy.end(event.body);
            }
        });

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'حدث خطأ: ' + error.message 
            })
        };
    }
};

async function sendEmail(parsedData, attachment, attachmentName, attachmentType) {
    // Get email configuration from environment variables
    const {
        SMTP_HOST,
        SMTP_PORT,
        SMTP_USER,
        SMTP_PASS,
        TO_EMAIL
    } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !TO_EMAIL) {
        throw new Error('Email configuration is missing. Please set up environment variables in Netlify.');
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || '587'),
        secure: SMTP_PORT === '465',
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    });

    // Prepare email content
    const exerciseNames = [
        'Incline DB Press (دامبل عالي للصدر)',
        'Tricep Pushdown (تراي بوش داون)',
        'Wide Lat Pull Down (سحب عالي واسع)',
        'T-Bar Row (سحب عالتي بار)'
    ];

    let emailHtml = `
        <html dir="ltr" lang="en">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; direction: ltr; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%); color: #d4af37; padding: 20px; border-radius: 10px 10px 0 0; border-bottom: 3px solid #b8860b; }
                .content { background: #f8f8f8; padding: 20px; border: 2px solid #b8860b; }
                .section { margin-bottom: 20px; }
                .label { font-weight: bold; color: #b8860b; }
                .exercise { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #b8860b; border: 2px solid #d4af37; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>🏋️ Daily Workout Tracking Form</h2>
                </div>
                <div class="content">
                    <div class="section">
                        <h3>Personal Information</h3>
                        <p><span class="label">Name:</span> ${parsedData.name || 'Not specified'}</p>
                        <p><span class="label">Email:</span> ${parsedData.email || 'Not specified'}</p>
                        <p><span class="label">Weight:</span> ${parsedData.weight || 'Not specified'} kg</p>
                        <p><span class="label">Date:</span> ${parsedData.date || 'Not specified'}</p>
                    </div>
                    
                    <div class="section">
                        <h3>Exercises</h3>
                        ${[1, 2, 3, 4].map(i => {
                            const numSets = parseInt(parsedData[`exercise${i}_sets`]) || 0;
                            let setsHtml = '';
                            
                            for (let j = 1; j <= numSets; j++) {
                                const reps = parsedData[`exercise${i}_set${j}_reps`] || 'N/A';
                                const weight = parsedData[`exercise${i}_set${j}_weight`] || 'N/A';
                                setsHtml += `<p style="margin: 5px 0; padding-left: 20px;">Set ${j}: ${reps} reps × ${weight} kg</p>`;
                            }
                            
                            return `
                                <div class="exercise">
                                    <h4>${exerciseNames[i - 1]}</h4>
                                    <p><span class="label">Number of Sets:</span> ${numSets}</p>
                                    ${setsHtml || '<p>No sets specified</p>'}
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    ${attachment ? `<div class="section"><p><span class="label">Attachment:</span> ${attachmentName}</p></div>` : ''}
                </div>
            </div>
        </body>
        </html>
    `;

    let emailText = `
Daily Workout Tracking Form

Personal Information:
- Name: ${parsedData.name || 'Not specified'}
- Email: ${parsedData.email || 'Not specified'}
- Weight: ${parsedData.weight || 'Not specified'} kg
- Date: ${parsedData.date || 'Not specified'}

Exercises:
${[1, 2, 3, 4].map(i => {
    const numSets = parseInt(parsedData[`exercise${i}_sets`]) || 0;
    let setsText = '';
    
    for (let j = 1; j <= numSets; j++) {
        const reps = parsedData[`exercise${i}_set${j}_reps`] || 'N/A';
        const weight = parsedData[`exercise${i}_set${j}_weight`] || 'N/A';
        setsText += `   Set ${j}: ${reps} reps × ${weight} kg\n`;
    }
    
    return `
${i}. ${exerciseNames[i - 1]}:
   - Number of Sets: ${numSets}
${setsText || '   - No sets specified'}
`;
}).join('')}

${attachment ? `Attachment: ${attachmentName}` : ''}
    `;

    // Prepare email options
    const mailOptions = {
        from: `"Workout Form" <${SMTP_USER}>`,
        to: TO_EMAIL,
        subject: `Daily Workout Tracking - ${parsedData.name || 'Client'} - ${parsedData.date || new Date().toLocaleDateString('en-US')}`,
        text: emailText,
        html: emailHtml
    };

    // Add attachment if present
    if (attachment) {
        mailOptions.attachments = [{
            filename: attachmentName,
            content: attachment,
            contentType: attachmentType
        }];
    }

    // Send email
    await transporter.sendMail(mailOptions);
}

