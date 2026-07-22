import fs from 'fs/promises';
import nodemailer from 'nodemailer';
import path from 'path';

function getTransporter() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error(
            'Configuração SMTP incompleta. Verifique as variáveis de ambiente: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS',
        );
    }

    const port = Number(process.env.SMTP_PORT);
    const isSecure = port === 465;

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: isSecure,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });
}

function replaceCommonPlaceholders(html: string): string {
    return html
        .replace(/{{SUPPORT_LINK}}/g, process.env.SUPPORT_LINK || '#')
        .replace(/{{PRIVACY_LINK}}/g, process.env.PRIVACY_LINK || '#')
        .replace(/{{TERMS_LINK}}/g, process.env.TERMS_LINK || '#');
}

export async function sendVerificationEmail(email: string, token: string) {
    const verificationLink = `${process.env.FRONTEND_URL}/api/users/verify-email?token=${token}`;
    const transporter = getTransporter();

    const templatePath = path.join(process.cwd(), 'src', 'utils', 'email-templates', 'verification-email.html');
    let html = await fs.readFile(templatePath, 'utf-8');
    html = html.replace(/{{verificationLink}}/g, verificationLink);
    html = replaceCommonPlaceholders(html);

    try {
        await transporter.sendMail({
            from: `"Velunix" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Confirme seu e-mail para acessar o Velunix',
            html: html,
        });
        console.log(`Email de verificação enviado para: ${email}`);
    } catch (error) {
        console.error('Erro ao enviar email de verificação:', error);
        throw error;
    }
}
