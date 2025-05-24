const nodemailer = require('nodemailer');

/**
 * SMTP Utility functions for the main server application
 * This module provides functions to get SMTP configuration from database
 * and create email transporters
 */

/**
 * Get SMTP configuration from webappserver API
 * Falls back to environment variables if API is not available
 */
const getSmtpConfiguration = async () => {
  try {
    // Try to get configuration from webappserver API
    const WEBAPPSERVER_URL = process.env.WEBAPPSERVER_URL || 'http://localhost:3002';
    
    const response = await fetch(`${WEBAPPSERVER_URL}/api/smtp-configurations/default`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        console.log('✅ Using database SMTP configuration:', data.data.configName);
        return {
          host: data.data.smtpHost,
          port: data.data.smtpPort,
          secure: data.data.smtpSecure,
          auth: {
            user: data.data.smtpUser,
            pass: data.data.smtpPassword // Note: In production, implement proper decryption
          },
          from: `${data.data.smtpFromName} <${data.data.smtpFrom}>`,
          fromAddress: data.data.smtpFrom,
          fromName: data.data.smtpFromName,
          source: 'database'
        };
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not fetch SMTP configuration from database:', error.message);
  }

  // Fallback to environment variables
  console.log('📧 Using environment variable SMTP configuration');
  return {
    host: process.env.REACT_APP_SMTP_HOST,
    port: process.env.REACT_APP_SMTP_PORT,
    secure: process.env.REACT_APP_SMTP_PORT === '465',
    auth: {
      user: process.env.REACT_APP_SMTP_USER,
      pass: process.env.REACT_APP_SMTP_PASS
    },
    from: process.env.REACT_APP_SMTP_FROM,
    fromAddress: process.env.REACT_APP_SMTP_FROM,
    fromName: 'Truck Fleet Tracker',
    source: 'environment'
  };
};

/**
 * Create email transporter with current SMTP configuration
 */
const createEmailTransporter = async () => {
  const config = await getSmtpConfiguration();

  // Check if configuration is complete
  if (!config.host || !config.port || !config.auth.user || !config.auth.pass) {
    console.error('❌ SMTP configuration is incomplete');
    
    // Return mock transporter for demo purposes
    return {
      sendMail: (mailOptions) => {
        console.log('MOCK EMAIL SENT:');
        console.log('From:', mailOptions.from);
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('Text:', mailOptions.text);
        return Promise.resolve({ messageId: 'mock-email-id-' + Date.now() });
      },
      isMock: true
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: parseInt(config.port),
      secure: config.secure,
      auth: config.auth
    });

    // Add configuration info to transporter
    transporter.smtpConfig = config;
    transporter.isMock = false;

    console.log(`✅ Email transporter initialized (${config.source})`);
    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error);
    throw error;
  }
};

/**
 * Send email using current SMTP configuration
 */
const sendEmail = async (options) => {
  const transporter = await createEmailTransporter();
  const config = transporter.smtpConfig || {};

  const mailOptions = {
    from: config.from || options.from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    if (transporter.isMock) {
      console.log('📧 Mock email sent');
      return { success: true, messageId: info.messageId, mock: true };
    } else {
      console.log('📧 Email sent:', info.messageId);
      return { success: true, messageId: info.messageId, mock: false };
    }
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification email with standard formatting
 */
const sendNotificationEmail = async (options) => {
  const { to, title, message, type = 'info' } = options;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h2 style="color: #333; margin-top: 0;">${title}</h2>
        <div style="background-color: white; padding: 20px; border-radius: 5px; border-left: 4px solid ${type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#007bff'};">
          <p style="margin: 0; line-height: 1.6;">${message}</p>
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 12px;">
          <p>This is an automated message from the Truck Fleet Tracker system.</p>
          <p>Sent at: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Truck Fleet Tracker: ${title}`,
    text: `${title}\n\n${message}\n\nThis is an automated message from the Truck Fleet Tracker system.`,
    html
  });
};

/**
 * Test SMTP configuration
 */
const testSmtpConfiguration = async (testEmail = 'test@example.com') => {
  try {
    const result = await sendNotificationEmail({
      to: testEmail,
      title: 'SMTP Configuration Test',
      message: 'This is a test email to verify that your SMTP configuration is working correctly.',
      type: 'info'
    });

    return result;
  } catch (error) {
    console.error('❌ SMTP test failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getSmtpConfiguration,
  createEmailTransporter,
  sendEmail,
  sendNotificationEmail,
  testSmtpConfiguration
};
