import nodemailer from 'nodemailer';

// For development - use ethereal.email (fake SMTP)
const createTestTransporter = async () => {
  const testAccount = await nodemailer.createTestAccount();
  
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

// For production - use real SMTP
const createRealTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send verification email
export const sendVerificationEmail = async (email, username, token) => {
  try {
    // ===== OPTION 3: Use real transporter if SMTP credentials exist =====
    let transporter;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      console.log('📧 Using real Gmail SMTP');
      transporter = createRealTransporter();
    } else {
      console.log('📧 Using Ethereal test email (check preview URL)');
      transporter = await createTestTransporter();
    }

    const verificationUrl = `http://192.168.100.143:3000/api/users/verify-email/${token}`;

    const mailOptions = {
      from: '"GymBro" <noreply@gymbro.app>',
      to: email,
      subject: 'Verify Your Email - GymBro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #39FF14;">Welcome to GymBro, ${username}!</h2>
          <p>Please verify your email address to start your fitness journey.</p>
          <a href="${verificationUrl}" style="display: inline-block; background-color: #39FF14; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
          <p>Or copy this link: ${verificationUrl}</p>
          <p>This link expires in 24 hours.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Log appropriate message
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
    } else {
      console.log(`✅ Verification email sent to ${email}`);
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};