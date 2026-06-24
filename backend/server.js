const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== EMAIL TRANSPORTER =====
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendEmail(to, subject, html, text) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('⚠️ Email not configured. Skipping email send.');
      return { success: false, reason: 'not_configured' };
    }
    const info = await transporter.sendMail({
      from: `"Konjyosom Tech Solutions" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text
    });
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Email error:', err.message);
    return { success: false, error: err.message };
  }
}

function getBookingConfirmationEmail(data) {
  return {
    subject: `Booking Confirmed - ${data.reference}`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#0ea5e9,#0284c7);padding:30px;text-align:center;color:white;">
        <h1 style="margin:0;font-size:1.5rem;">✅ Booking Confirmed!</h1>
        <p style="margin:8px 0 0 0;opacity:0.9;">Konjyosom Tech Solutions Pvt. Ltd.</p>
      </div>
      <div style="padding:30px;background:#f8fafc;">
        <p style="font-size:1.05rem;color:#1e293b;">Dear <strong>${data.name}</strong>,</p>
        <p style="color:#475569;line-height:1.6;">Thank you for booking with us! Your installation has been received and is being processed.</p>
        <div style="background:white;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e2e8f0;">
          <h3 style="margin:0 0 15px 0;color:#0ea5e9;font-size:1.1rem;">📋 Booking Details</h3>
          <table style="width:100%;font-size:0.95rem;color:#475569;">
            <tr><td style="padding:6px 0;width:40%;"><strong>Reference:</strong></td><td style="padding:6px 0;font-family:monospace;color:#0ea5e9;font-weight:600;">${data.reference}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Service:</strong></td><td style="padding:6px 0;">${data.service}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Property Type:</strong></td><td style="padding:6px 0;">${data.property || 'N/A'}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Preferred Date:</strong></td><td style="padding:6px 0;">${data.preferredDate || data.date || 'TBD'}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Preferred Time:</strong></td><td style="padding:6px 0;">${data.time || 'TBD'}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Address:</strong></td><td style="padding:6px 0;">${data.address || 'N/A'}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Status:</strong></td><td style="padding:6px 0;"><span style="background:#f59e0b15;color:#f59e0b;padding:3px 10px;border-radius:20px;font-size:0.8rem;font-weight:600;">PENDING</span></td></tr>
          </table>
        </div>
        <p style="color:#475569;line-height:1.6;">Our team will contact you within <strong>24 hours</strong> to confirm your booking and schedule a site visit.</p>
        <div style="background:#0ea5e915;border-left:4px solid #0ea5e9;padding:15px;margin:20px 0;border-radius:0 8px 8px 0;">
          <p style="margin:0;color:#0ea5e9;font-size:0.95rem;"><strong>📞 Need help?</strong> Call us at <a href="tel:+9779865057546" style="color:#0ea5e9;">+977 9865057546</a></p>
        </div>
        <p style="text-align:center;margin-top:25px;">
          <a href="${process.env.FRONTEND_URL || 'https://konjyosom-website.onrender.com'}/booking-tracker.html" style="background:#0ea5e9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Track Your Booking</a>
        </p>
      </div>
      <div style="background:#f1f5f9;padding:20px;text-align:center;font-size:0.85rem;color:#64748b;">
        <p style="margin:0;">© 2026 Konjyosom Tech Solutions Pvt. Ltd. | Nepal</p>
        <p style="margin:5px 0 0 0;">This is an automated confirmation email. Please do not reply.</p>
      </div>
    </div>`,
    text: `Booking Confirmed - ${data.reference}\n\nDear ${data.name},\n\nThank you for booking with Konjyosom Tech Solutions! Your installation has been received.\n\nReference: ${data.reference}\nService: ${data.service}\nDate: ${data.preferredDate || data.date || 'TBD'}\nTime: ${data.time || 'TBD'}\nAddress: ${data.address || 'N/A'}\nStatus: PENDING\n\nOur team will contact you within 24 hours.\n\nTrack your booking: ${process.env.FRONTEND_URL || 'https://konjyosom-website.onrender.com'}/booking-tracker.html\n\nNeed help? Call +977 9865057546`
  };
}

function getEnquiryConfirmationEmail(data) {
  return {
    subject: `Enquiry Received - ${data.reference}`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#10b981,#059669);padding:30px;text-align:center;color:white;">
        <h1 style="margin:0;font-size:1.5rem;">📨 Enquiry Received!</h1>
        <p style="margin:8px 0 0 0;opacity:0.9;">Konjyosom Tech Solutions Pvt. Ltd.</p>
      </div>
      <div style="padding:30px;background:#f8fafc;">
        <p style="font-size:1.05rem;color:#1e293b;">Dear <strong>${data.name}</strong>,</p>
        <p style="color:#475569;line-height:1.6;">Thank you for reaching out! We have received your enquiry and our team will get back to you shortly.</p>
        <div style="background:white;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e2e8f0;">
          <h3 style="margin:0 0 15px 0;color:#10b981;font-size:1.1rem;">📋 Enquiry Details</h3>
          <table style="width:100%;font-size:0.95rem;color:#475569;">
            <tr><td style="padding:6px 0;width:40%;"><strong>Reference:</strong></td><td style="padding:6px 0;font-family:monospace;color:#10b981;font-weight:600;">${data.reference}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Service Type:</strong></td><td style="padding:6px 0;">${data.serviceType || 'General'}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Subject:</strong></td><td style="padding:6px 0;">${data.subject || 'N/A'}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Budget Range:</strong></td><td style="padding:6px 0;">${data.budgetRange || 'Not specified'}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Status:</strong></td><td style="padding:6px 0;"><span style="background:#3b82f615;color:#3b82f6;padding:3px 10px;border-radius:20px;font-size:0.8rem;font-weight:600;">NEW</span></td></tr>
          </table>
        </div>
        <p style="color:#475569;line-height:1.6;">We aim to respond to all enquiries within <strong>24-48 hours</strong>.</p>
        <div style="background:#10b98115;border-left:4px solid #10b981;padding:15px;margin:20px 0;border-radius:0 8px 8px 0;">
          <p style="margin:0;color:#059669;font-size:0.95rem;"><strong>📞 Need help?</strong> Call us at <a href="tel:+9779865057546" style="color:#059669;">+977 9865057546</a></p>
        </div>
        <p style="text-align:center;margin-top:25px;">
          <a href="${process.env.FRONTEND_URL || 'https://konjyosom-website.onrender.com'}/booking-tracker.html" style="background:#10b981;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Track Your Enquiry</a>
        </p>
      </div>
      <div style="background:#f1f5f9;padding:20px;text-align:center;font-size:0.85rem;color:#64748b;">
        <p style="margin:0;">© 2026 Konjyosom Tech Solutions Pvt. Ltd. | Nepal</p>
        <p style="margin:5px 0 0 0;">This is an automated confirmation email. Please do not reply.</p>
      </div>
    </div>`,
    text: `Enquiry Received - ${data.reference}\n\nDear ${data.name},\n\nThank you for reaching out to Konjyosom Tech Solutions! We have received your enquiry.\n\nReference: ${data.reference}\nService Type: ${data.serviceType || 'General'}\nSubject: ${data.subject || 'N/A'}\nStatus: NEW\n\nWe will respond within 24-48 hours.\n\nTrack your enquiry: ${process.env.FRONTEND_URL || 'https://konjyosom-website.onrender.com'}/booking-tracker.html\n\nNeed help? Call +977 9865057546`
  };
}

function getAdminNotificationEmail(type, data) {
  const isBooking = type === 'booking';
  return {
    subject: `New ${isBooking ? 'Booking' : 'Enquiry'} - ${data.reference}`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:${isBooking ? '#0ea5e9' : '#10b981'};padding:20px;text-align:center;color:white;">
        <h2 style="margin:0;font-size:1.3rem;">🔔 New ${isBooking ? 'Booking' : 'Enquiry'} Alert</h2>
      </div>
      <div style="padding:25px;background:#f8fafc;">
        <p style="color:#475569;">A new ${isBooking ? 'booking' : 'enquiry'} has been submitted on your website.</p>
        <div style="background:white;border-radius:10px;padding:15px;margin:15px 0;border:1px solid #e2e8f0;">
          <table style="width:100%;font-size:0.9rem;color:#475569;">
            <tr><td style="padding:5px 0;width:35%;"><strong>Reference:</strong></td><td style="padding:5px 0;font-family:monospace;">${data.reference}</td></tr>
            <tr><td style="padding:5px 0;"><strong>Name:</strong></td><td style="padding:5px 0;">${data.name}</td></tr>
            <tr><td style="padding:5px 0;"><strong>Email:</strong></td><td style="padding:5px 0;">${data.email}</td></tr>
            <tr><td style="padding:5px 0;"><strong>Phone:</strong></td><td style="padding:5px 0;">${data.phone}</td></tr>
            ${isBooking ? `<tr><td style="padding:5px 0;"><strong>Service:</strong></td><td style="padding:5px 0;">${data.service}</td></tr>
            <tr><td style="padding:5px 0;"><strong>Date:</strong></td><td style="padding:5px 0;">${data.preferredDate || data.date || 'TBD'}</td></tr>
            <tr><td style="padding:5px 0;"><strong>Address:</strong></td><td style="padding:5px 0;">${data.address || 'N/A'}</td></tr>` : `<tr><td style="padding:5px 0;"><strong>Service Type:</strong></td><td style="padding:5px 0;">${data.serviceType || 'General'}</td></tr>
            <tr><td style="padding:5px 0;"><strong>Subject:</strong></td><td style="padding:5px 0;">${data.subject || 'N/A'}</td></tr>`}
          </table>
        </div>
        <p style="text-align:center;">
          <a href="${process.env.FRONTEND_URL || 'https://konjyosom-website.onrender.com'}" style="background:${isBooking ? '#0ea5e9' : '#10b981'};color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Go to Admin Panel</a>
        </p>
      </div>
    </div>`,
    text: `New ${isBooking ? 'Booking' : 'Enquiry'} Alert\n\nReference: ${data.reference}\nName: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\n${isBooking ? `Service: ${data.service}\nDate: ${data.preferredDate || data.date || 'TBD'}` : `Service Type: ${data.serviceType || 'General'}\nSubject: ${data.subject || 'N/A'}`}\n\nView in admin panel.`
  };
}

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.options('*', cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== IN-MEMORY FALLBACK (when MongoDB is down) =====
let useMemoryDb = false;
const memoryBookings = [];
const memoryInquiries = [];
const memoryTechnicians = [];

// MongoDB Connection - DON'T EXIT ON FAILURE, USE FALLBACK
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('⚠️ MONGODB_URI not set - running in MEMORY-ONLY mode');
  useMemoryDb = true;
} else {
  mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => {
      console.error('❌ MongoDB connection error:', err.message);
      console.log('⚠️ Falling back to IN-MEMORY mode - data will be lost on restart');
      useMemoryDb = true;
    });
}

// ===== SCHEMAS (only if MongoDB connected) =====
let Booking, Inquiry, Technician;

if (!useMemoryDb) {
  const bookingSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    reference: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    service: { type: String, required: true },
    property: { type: String, default: '' },
    preferredDate: { type: String, default: '' },
    date: { type: String, default: '' },
    time: { type: String, default: '' },
    notes: { type: String, default: '' },
    message: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
    assignedTechnician: { type: String, default: null },
    technicianNotes: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  });

  const inquirySchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    reference: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    subject: { type: String, default: '' },
    serviceType: { type: String, default: 'General' },
    budgetRange: { type: String, default: '' },
    message: { type: String, required: true },
    status: { type: String, enum: ['new', 'in-progress', 'resolved'], default: 'new' },
    assignedTechnician: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
  });

  const technicianSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, default: '' },
    password: { type: String, required: true },
    role: { type: String, enum: ['technician', 'admin'], default: 'technician' },
    specialization: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  });

  Booking = mongoose.model('Booking', bookingSchema);
  Inquiry = mongoose.model('Inquiry', inquirySchema);
  Technician = mongoose.model('Technician', technicianSchema);
}

// ===== MEMORY DB HELPERS =====
function memoryFindOne(collection, query) {
  // Simple query matcher for memory DB
  return collection.find(item => {
    for (const [key, value] of Object.entries(query)) {
      if (key === '$or') {
        return value.some(cond => Object.entries(cond).every(([k, v]) => item[k] === v));
      }
      if (item[key] !== value) return false;
    }
    return true;
  }) || null;
}

function memoryFind(collection, query = {}) {
  return collection.filter(item => {
    for (const [key, value] of Object.entries(query)) {
      if (item[key] !== value) return false;
    }
    return true;
  });
}

function memoryCount(collection, query = {}) {
  return memoryFind(collection, query).length;
}

// ===== HELPERS =====
function generateId(prefix) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function generateReference(type) {
  const prefix = type === 'booking' ? 'BK' : 'EN';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}

// ===== AUTH =====
const validTokens = new Map();

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized - No token' });
  }
  const token = authHeader.replace('Bearer ', '');
  const session = validTokens.get(token);
  if (session) {
    req.user = session;
    next();
  } else {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied - Insufficient permissions' });
    }
    next();
  };
}

// ===== ROUTES =====

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'KTS API is running', 
    timestamp: new Date().toISOString(),
    mode: useMemoryDb ? 'memory' : 'mongodb'
  });
});

// Admin Login
app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return res.status(500).json({ success: false, message: 'Admin password not configured' });
    }

    if (password === adminPassword) {
      const token = 'kts-admin-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
      validTokens.set(token, { role: 'admin', userId: 'admin', email: 'admin@konjyosom.com' });
      res.json({ success: true, token, role: 'admin', message: 'Login successful' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Technician Login
app.post('/api/auth/technician-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    let technician;
    if (useMemoryDb) {
      technician = memoryFindOne(memoryTechnicians, { email: email.toLowerCase(), isActive: true });
    } else {
      technician = await Technician.findOne({ email: email.toLowerCase(), isActive: true });
    }

    if (!technician) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (password !== technician.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = 'kts-tech-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    validTokens.set(token, { role: technician.role, userId: technician.id, email: technician.email, name: technician.name });

    res.json({ 
      success: true, 
      token, 
      role: technician.role,
      technician: { id: technician.id, name: technician.name, email: technician.email, specialization: technician.specialization }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Change Password
app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (req.user.role === 'admin') {
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        return res.status(500).json({ success: false, message: 'Admin password not configured' });
      }
      if (currentPassword !== adminPassword) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
      if (!newPassword || newPassword.length < 4) {
        return res.status(400).json({ success: false, message: 'New password must be at least 4 characters' });
      }
      process.env.ADMIN_PASSWORD = newPassword;
      validTokens.clear();
      return res.json({ success: true, message: 'Password updated. Please login again.' });
    }

    let technician;
    if (useMemoryDb) {
      technician = memoryFindOne(memoryTechnicians, { id: req.user.userId });
      if (technician) {
        if (currentPassword !== technician.password) {
          return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }
        technician.password = newPassword;
      }
    } else {
      technician = await Technician.findOne({ id: req.user.userId });
      if (!technician) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      if (currentPassword !== technician.password) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
      if (!newPassword || newPassword.length < 4) {
        return res.status(400).json({ success: false, message: 'New password must be at least 4 characters' });
      }
      technician.password = newPassword;
      await technician.save();
    }

    validTokens.clear();
    res.json({ success: true, message: 'Password updated. Please login again.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== TECHNICIAN MANAGEMENT (Admin Only) =====

app.post('/api/technicians', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { name, email, phone, password, specialization } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    let existing;
    if (useMemoryDb) {
      existing = memoryFindOne(memoryTechnicians, { email: email.toLowerCase() });
    } else {
      existing = await Technician.findOne({ email: email.toLowerCase() });
    }

    if (existing) {
      return res.status(409).json({ success: false, message: 'Technician with this email already exists' });
    }

    const technician = {
      id: generateId('TECH'),
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      password,
      specialization: specialization || '',
      isActive: true,
      createdAt: new Date()
    };

    if (useMemoryDb) {
      memoryTechnicians.push(technician);
    } else {
      const newTech = new Technician(technician);
      await newTech.save();
    }

    // Send welcome email to technician
    const welcomeEmail = {
      subject: 'Welcome to Konjyosom Tech Solutions - Technician Account',
      html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0ea5e9,#0284c7);padding:30px;text-align:center;color:white;">
          <h1 style="margin:0;font-size:1.5rem;">👋 Welcome, ${name}!</h1>
          <p style="margin:8px 0 0 0;opacity:0.9;">Konjyosom Tech Solutions Pvt. Ltd.</p>
        </div>
        <div style="padding:30px;background:#f8fafc;">
          <p style="color:#475569;line-height:1.6;">Your technician account has been created successfully. You can now log in to view and manage your assigned bookings.</p>
          <div style="background:white;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e2e8f0;">
            <h3 style="margin:0 0 15px 0;color:#0ea5e9;font-size:1.1rem;">🔐 Login Credentials</h3>
            <table style="width:100%;font-size:0.95rem;color:#475569;">
              <tr><td style="padding:6px 0;width:40%;"><strong>Email:</strong></td><td style="padding:6px 0;">${email}</td></tr>
              <tr><td style="padding:6px 0;"><strong>Password:</strong></td><td style="padding:6px 0;font-family:monospace;background:#f1f5f9;padding:4px 8px;border-radius:4px;">${password}</td></tr>
              <tr><td style="padding:6px 0;"><strong>Login URL:</strong></td><td style="padding:6px 0;"><a href="${process.env.FRONTEND_URL || 'https://konjyosom-website.onrender.com'}/technician-login.html" style="color:#0ea5e9;">Technician Portal</a></td></tr>
            </table>
          </div>
          <p style="color:#475569;line-height:1.6;">Please change your password after your first login for security.</p>
        </div>
      </div>`,
      text: `Welcome to Konjyosom Tech Solutions!\n\nYour technician account has been created.\n\nEmail: ${email}\nPassword: ${password}\n\nLogin: ${process.env.FRONTEND_URL || 'https://konjyosom-website.onrender.com'}/technician-login.html\n\nPlease change your password after first login.`
    };
    await sendEmail(email, welcomeEmail.subject, welcomeEmail.html, welcomeEmail.text);

    res.status(201).json({ 
      success: true, 
      data: { id: technician.id, name: technician.name, email: technician.email, specialization: technician.specialization },
      message: 'Technician created successfully' 
    });
  } catch (error) {
    console.error('Create technician error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/technicians', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    let technicians;
    if (useMemoryDb) {
      technicians = memoryTechnicians.filter(t => t.isActive).sort((a, b) => b.createdAt - a.createdAt);
    } else {
      technicians = await Technician.find({ isActive: true }).select('-password').sort({ createdAt: -1 });
    }
    res.json({ success: true, data: technicians });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/technicians/all', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    let technicians;
    if (useMemoryDb) {
      technicians = [...memoryTechnicians].sort((a, b) => b.createdAt - a.createdAt);
    } else {
      technicians = await Technician.find().select('-password').sort({ createdAt: -1 });
    }
    res.json({ success: true, data: technicians });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.patch('/api/technicians/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { name, phone, specialization, isActive } = req.body;
    let technician;

    if (useMemoryDb) {
      technician = memoryTechnicians.find(t => t.id === req.params.id);
      if (technician) {
        if (name !== undefined) technician.name = name;
        if (phone !== undefined) technician.phone = phone;
        if (specialization !== undefined) technician.specialization = specialization;
        if (isActive !== undefined) technician.isActive = isActive;
      }
    } else {
      const update = {};
      if (name !== undefined) update.name = name;
      if (phone !== undefined) update.phone = phone;
      if (specialization !== undefined) update.specialization = specialization;
      if (isActive !== undefined) update.isActive = isActive;
      technician = await Technician.findOneAndUpdate({ id: req.params.id }, update, { new: true }).select('-password');
    }

    if (!technician) return res.status(404).json({ success: false, message: 'Technician not found' });
    res.json({ success: true, data: technician });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/technicians/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    let technician;
    if (useMemoryDb) {
      const idx = memoryTechnicians.findIndex(t => t.id === req.params.id);
      if (idx !== -1) {
        technician = memoryTechnicians[idx];
        memoryTechnicians.splice(idx, 1);
      }
    } else {
      technician = await Technician.findOneAndDelete({ id: req.params.id });
    }
    if (!technician) return res.status(404).json({ success: false, message: 'Technician not found' });
    res.json({ success: true, message: 'Technician deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== BOOKINGS =====

app.post('/api/bookings', async (req, res) => {
  try {
    const { name, phone, email, address, service, property, preferredDate, date, time, notes, message, reference } = req.body;
    const booking = {
      id: generateId('BK'),
      reference: reference || generateReference('booking'),
      name, phone, email: email || '', address: address || '',
      service, property: property || '',
      preferredDate: preferredDate || date || '', date: date || preferredDate || '',
      time: time || '', notes: notes || '', message: message || notes || '',
      status: 'pending',
      assignedTechnician: null,
      technicianNotes: '',
      createdAt: new Date()
    };

    if (useMemoryDb) {
      memoryBookings.push(booking);
    } else {
      const newBooking = new Booking(booking);
      await newBooking.save();
    }

    // Send confirmation email to client
    if (email) {
      const emailData = getBookingConfirmationEmail(booking);
      await sendEmail(email, emailData.subject, emailData.html, emailData.text);
    }

    // Send notification to admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      const notif = getAdminNotificationEmail('booking', booking);
      await sendEmail(adminEmail, notif.subject, notif.html, notif.text);
    }

    res.status(201).json({ success: true, data: booking, message: 'Booking created successfully' });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/bookings/:id', authMiddleware, async (req, res) => {
  try {
    let booking;
    if (useMemoryDb) {
      booking = memoryFindOne(memoryBookings, { id: req.params.id });
    } else {
      booking = await Booking.findOne({ id: req.params.id });
    }
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/bookings/track', async (req, res) => {
  try {
    const { ref, email } = req.query;
    if (!ref) return res.status(400).json({ success: false, message: 'Reference number required' });
    const cleanRef = ref.trim().toUpperCase();

    let booking;
    if (useMemoryDb) {
      booking = memoryBookings.find(b => 
        (b.reference === cleanRef || b.id === cleanRef) && 
        (!email || b.email === email.trim())
      ) || null;
    } else {
      let query = { $or: [{ reference: cleanRef }, { id: cleanRef }] };
      if (email) query.email = email.trim();
      booking = await Booking.findOne(query);
    }

    if (booking) return res.json({ success: true, found: true, booking });
    res.json({ success: true, found: false, message: 'Booking not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/bookings', authMiddleware, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'technician') {
      query = { assignedTechnician: req.user.userId };
    }

    let bookings;
    if (useMemoryDb) {
      bookings = memoryFind(memoryBookings, req.user.role === 'technician' ? query : {})
        .sort((a, b) => b.createdAt - a.createdAt);
    } else {
      bookings = await Booking.find(query).sort({ createdAt: -1 });
    }
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.patch('/api/bookings/:id', authMiddleware, async (req, res) => {
  try {
    const { status, assignedTechnician, technicianNotes } = req.body;
    let booking;

    if (useMemoryDb) {
      booking = memoryBookings.find(b => b.id === req.params.id);
      if (booking) {
        if (status !== undefined) booking.status = status;
        if (assignedTechnician !== undefined) booking.assignedTechnician = assignedTechnician;
        if (technicianNotes !== undefined) booking.technicianNotes = technicianNotes;
      }
    } else {
      const update = {};
      if (status !== undefined) update.status = status;
      if (assignedTechnician !== undefined) update.assignedTechnician = assignedTechnician;
      if (technicianNotes !== undefined) update.technicianNotes = technicianNotes;
      booking = await Booking.findOneAndUpdate({ id: req.params.id }, update, { new: true });
    }

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== INQUIRIES =====

app.post('/api/inquiries', async (req, res) => {
  try {
    const { name, email, phone, subject, serviceType, budgetRange, message, reference } = req.body;
    const inquiry = {
      id: generateId('INQ'),
      reference: reference || generateReference('enquiry'),
      name, email, phone: phone || '', subject: subject || '',
      serviceType: serviceType || 'General', budgetRange: budgetRange || '',
      message, status: 'new',
      assignedTechnician: null,
      createdAt: new Date()
    };

    if (useMemoryDb) {
      memoryInquiries.push(inquiry);
    } else {
      const newInquiry = new Inquiry(inquiry);
      await newInquiry.save();
    }

    // Send confirmation email to client
    const emailData = getEnquiryConfirmationEmail(inquiry);
    await sendEmail(email, emailData.subject, emailData.html, emailData.text);

    // Send notification to admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      const notif = getAdminNotificationEmail('enquiry', inquiry);
      await sendEmail(adminEmail, notif.subject, notif.html, notif.text);
    }

    res.status(201).json({ success: true, data: inquiry, message: 'Inquiry submitted successfully' });
  } catch (error) {
    console.error('Create inquiry error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/inquiries', authMiddleware, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'technician') {
      query = { assignedTechnician: req.user.userId };
    }

    let inquiries;
    if (useMemoryDb) {
      inquiries = memoryFind(memoryInquiries, req.user.role === 'technician' ? query : {})
        .sort((a, b) => b.createdAt - a.createdAt);
    } else {
      inquiries = await Inquiry.find(query).sort({ createdAt: -1 });
    }
    res.json({ success: true, data: inquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/inquiries/:id', authMiddleware, async (req, res) => {
  try {
    let inquiry;
    if (useMemoryDb) {
      inquiry = memoryFindOne(memoryInquiries, { id: req.params.id });
    } else {
      inquiry = await Inquiry.findOne({ id: req.params.id });
    }
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    res.json({ success: true, data: inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/enquiries/track', async (req, res) => {
  try {
    const { ref, email } = req.query;
    if (!ref) return res.status(400).json({ success: false, message: 'Reference number required' });
    const cleanRef = ref.trim().toUpperCase();

    let inquiry;
    if (useMemoryDb) {
      inquiry = memoryInquiries.find(i => 
        (i.reference === cleanRef || i.id === cleanRef) && 
        (!email || i.email === email.trim())
      ) || null;
    } else {
      let query = { $or: [{ reference: cleanRef }, { id: cleanRef }] };
      if (email) query.email = email.trim();
      inquiry = await Inquiry.findOne(query);
    }

    if (inquiry) return res.json({ success: true, found: true, enquiry: inquiry });
    res.json({ success: true, found: false, message: 'Enquiry not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.patch('/api/inquiries/:id', authMiddleware, async (req, res) => {
  try {
    const { status, assignedTechnician } = req.body;
    let inquiry;

    if (useMemoryDb) {
      inquiry = memoryInquiries.find(i => i.id === req.params.id);
      if (inquiry) {
        if (status !== undefined) inquiry.status = status;
        if (assignedTechnician !== undefined) inquiry.assignedTechnician = assignedTechnician;
      }
    } else {
      const update = {};
      if (status !== undefined) update.status = status;
      if (assignedTechnician !== undefined) update.assignedTechnician = assignedTechnician;
      inquiry = await Inquiry.findOneAndUpdate({ id: req.params.id }, update, { new: true });
    }

    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    res.json({ success: true, data: inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/inquiries/:id', authMiddleware, async (req, res) => {
  try {
    let inquiry;
    if (useMemoryDb) {
      const idx = memoryInquiries.findIndex(i => i.id === req.params.id);
      if (idx !== -1) {
        inquiry = memoryInquiries[idx];
        memoryInquiries.splice(idx, 1);
      }
    } else {
      inquiry = await Inquiry.findOneAndDelete({ id: req.params.id });
    }
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    res.json({ success: true, message: 'Inquiry deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== DASHBOARD =====

app.get('/api/dashboard', authMiddleware, async (req, res) => {
  try {
    let bookingQuery = {};
    let inquiryQuery = {};

    if (req.user.role === 'technician') {
      bookingQuery = { assignedTechnician: req.user.userId };
      inquiryQuery = { assignedTechnician: req.user.userId };
    }

    let totalBookings, totalInquiries, pendingBookings, newInquiries, recentBookings, recentInquiries, technicianCount;

    if (useMemoryDb) {
      const bks = memoryFind(memoryBookings, req.user.role === 'technician' ? bookingQuery : {});
      const inqs = memoryFind(memoryInquiries, req.user.role === 'technician' ? inquiryQuery : {});
      totalBookings = bks.length;
      totalInquiries = inqs.length;
      pendingBookings = bks.filter(b => b.status === 'pending').length;
      newInquiries = inqs.filter(i => i.status === 'new').length;
      recentBookings = bks.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
      recentInquiries = inqs.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
      technicianCount = req.user.role === 'admin' ? memoryTechnicians.filter(t => t.isActive).length : 0;
    } else {
      totalBookings = await Booking.countDocuments(bookingQuery);
      totalInquiries = await Inquiry.countDocuments(inquiryQuery);
      pendingBookings = await Booking.countDocuments({ ...bookingQuery, status: 'pending' });
      newInquiries = await Inquiry.countDocuments({ ...inquiryQuery, status: 'new' });
      recentBookings = await Booking.find(bookingQuery).sort({ createdAt: -1 }).limit(5);
      recentInquiries = await Inquiry.find(inquiryQuery).sort({ createdAt: -1 }).limit(5);
      technicianCount = req.user.role === 'admin' ? await Technician.countDocuments({ isActive: true }) : 0;
    }

    res.json({ success: true, data: { 
      totalBookings, totalInquiries, pendingBookings, newInquiries, 
      recentBookings, recentInquiries, technicianCount,
      role: req.user.role
    }});
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== ME (Current User) =====
app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.json({ success: true, user: { role: 'admin', email: req.user.email } });
    }
    let technician;
    if (useMemoryDb) {
      technician = memoryTechnicians.find(t => t.id === req.user.userId);
    } else {
      technician = await Technician.findOne({ id: req.user.userId }).select('-password');
    }
    if (!technician) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: { ...technician, role: technician.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Serve frontend - MUST BE LAST
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 KTS server running on port ${PORT}`);
  console.log(`📊 Mode: ${useMemoryDb ? 'IN-MEMORY (data will be lost on restart)' : 'MongoDB'}`);
});
