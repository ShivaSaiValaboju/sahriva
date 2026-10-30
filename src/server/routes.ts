/**
 * Express API routes for Nexora Store
 */

import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import { db } from './db';
import {
  calculateOrderTotals,
  generateLicenseKey,
  verifyDownloadEntitlement,
  canActivateDevice,
} from '../utils/rules';
import type {
  CartItem,
  OrderRecord,
  Entitlement,
  DownloadAuthorization,
  PlatformId,
} from '../types/store';

export const apiRouter = Router();

// In-memory token store for signed downloads (token -> metadata)
const signedDownloadTokens = new Map<
  string,
  {
    appId: string;
    buildId: string;
    userId?: string;
    expiresAt: number;
    filename: string;
    fileSizeBytes: number;
    sha256Checksum: string;
    platform: PlatformId;
    version: string;
  }
>();

// Helper to extract demo user from Authorization or session header
function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/, '').trim();
  // Simple token resolution for demo: "user-demo-1" or "user-admin-1" or "usr_<id>"
  if (token.startsWith('usr_')) {
    const id = token.replace('usr_', '');
    return db.getUserById(id);
  }
  return db.getUserById(token);
}

// ----------------------------------------------------
// Public Catalog Routes
// ----------------------------------------------------

apiRouter.get('/categories', (_req: Request, res: Response) => {
  res.json(db.getCategories());
});

apiRouter.get('/apps', (req: Request, res: Response) => {
  const { platform, category, search, freeOnly, sort } = req.query;
  const apps = db.getApplications({
    platform: platform as string,
    category: category as string,
    search: search as string,
    freeOnly: freeOnly === 'true',
    sort: sort as string,
  });
  res.json(apps);
});

apiRouter.get('/apps/:slug', (req: Request, res: Response) => {
  const app = db.getApplicationBySlug(req.params.slug);
  if (!app) {
    return res.status(404).json({ error: 'Application not found' });
  }
  const reviews = db.getReviewsForApp(app.id);
  res.json({ ...app, reviews });
});

apiRouter.get('/search', (req: Request, res: Response) => {
  const q = (req.query.q as string) || '';
  if (!q.trim()) {
    return res.json([]);
  }
  const results = db.getApplications({ search: q });
  res.json(results);
});

// ----------------------------------------------------
// Authentication Routes
// ----------------------------------------------------

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Demo password validation: any password accepted for demo users
  const token = `usr_${user.id}`;
  const { passwordHash: _, ...profile } = user;
  res.json({ token, user: profile });
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const user = db.createUser(name, email, 'hash_' + password);
  const token = `usr_${user.id}`;
  res.status(201).json({ token, user });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json(user);
});

// ----------------------------------------------------
// Library & Entitlements
// ----------------------------------------------------

apiRouter.get('/library', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const entitlements = db.getUserEntitlements(user.id);
  // Join application info
  const items = entitlements.map((ent) => {
    const app = db.getApplicationBySlug(ent.appId);
    return {
      entitlement: ent,
      app,
    };
  });

  res.json(items);
});

// Activate a device for an entitlement
apiRouter.post('/library/activate', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { entitlementId, deviceName, platform } = req.body;
  const entitlements = db.getUserEntitlements(user.id);
  const ent = entitlements.find((e) => e.id === entitlementId);

  if (!ent) {
    return res.status(404).json({ error: 'Entitlement not found' });
  }

  const check = canActivateDevice(ent, deviceName, platform);
  if (!check.allowed) {
    return res.status(400).json({ error: check.reason });
  }

  const existing = ent.activeDevices.find(
    (d) => d.deviceName.toLowerCase() === deviceName.trim().toLowerCase()
  );
  if (!existing) {
    ent.activeDevices.push({
      deviceName: deviceName.trim(),
      platform,
      activatedAt: new Date().toISOString(),
    });
    ent.activationsUsed = ent.activeDevices.length;
  }

  res.json({ success: true, entitlement: ent });
});

// ----------------------------------------------------
// Wishlist Routes
// ----------------------------------------------------

apiRouter.get('/wishlist', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.json([]);
  }
  const appIds = db.getUserWishlist(user.id);
  const apps = appIds.map((id) => db.getApplicationBySlug(id)).filter(Boolean);
  res.json(apps);
});

apiRouter.post('/wishlist/toggle', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const { appId } = req.body;
  if (!appId) {
    return res.status(400).json({ error: 'appId is required' });
  }
  const updatedList = db.toggleWishlist(user.id, appId);
  res.json({ wishlist: updatedList });
});

// ----------------------------------------------------
// Cart & Checkout Routes
// ----------------------------------------------------

apiRouter.post('/checkout/validate', (req: Request, res: Response) => {
  const { items, couponCode } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Items array is required' });
  }

  // Security: Re-verify real prices from database rather than trusting client numbers
  const verifiedItems = items.map((item: CartItem) => {
    const app = db.getApplicationBySlug(item.appId);
    if (!app) return { priceUsd: 0 };
    const plan = app.licensePlans.find((p) => p.id === item.planId);
    return { priceUsd: plan ? plan.priceUsd : app.basePriceUsd };
  });

  const calculation = calculateOrderTotals(verifiedItems, couponCode);
  res.json(calculation);
});

apiRouter.post('/checkout/complete', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Please sign in to complete purchase' });
  }

  const { items, couponCode, paymentMethod } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // Server-authoritative price calculation
  const verifiedItemsWithMeta = items.map((item: CartItem) => {
    const app = db.getApplicationBySlug(item.appId);
    if (!app) {
      throw new Error(`Invalid application: ${item.appId}`);
    }
    const plan = app.licensePlans.find((p) => p.id === item.planId) || {
      id: 'default',
      name: 'Standard License',
      priceUsd: app.basePriceUsd,
      maxDeviceActivations: 2,
    };
    return {
      app,
      plan,
      priceUsd: plan.priceUsd,
    };
  });

  const totals = calculateOrderTotals(
    verifiedItemsWithMeta.map((i) => ({ priceUsd: i.priceUsd })),
    couponCode
  );

  const orderId = `ord-${Date.now()}`;
  const orderNumber = `NEX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const orderItems = verifiedItemsWithMeta.map((entry) => {
    const licenseKey = generateLicenseKey();

    // Create persistent entitlement for each purchased app
    const entitlement: Entitlement = {
      id: `ent-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      appId: entry.app.id,
      licensePlanId: entry.plan.id,
      orderId,
      purchasedAt: new Date().toISOString(),
      licenseKey,
      status: 'active',
      activationsUsed: 0,
      maxActivations: entry.plan.maxDeviceActivations || 2,
      activeDevices: [],
    };
    db.addEntitlement(entitlement);

    return {
      appId: entry.app.id,
      appName: entry.app.name,
      planId: entry.plan.id,
      planName: entry.plan.name,
      unitPriceUsd: entry.priceUsd,
      licenseKey,
    };
  });

  const order: OrderRecord = {
    id: orderId,
    orderNumber,
    userId: user.id,
    userEmail: user.email,
    createdAt: new Date().toISOString(),
    items: orderItems,
    subtotalUsd: totals.subtotal,
    discountUsd: totals.discount,
    couponCode: totals.appliedCoupon?.code,
    taxUsd: totals.tax,
    totalUsd: totals.total,
    paymentMethod: paymentMethod || 'demo_credit_card',
    status: 'completed',
  };

  db.createOrder(order);
  res.status(201).json({ success: true, order });
});

apiRouter.get('/orders', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const orders = db.getUserOrders(user.id);
  res.json(orders);
});

apiRouter.get('/orders/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const order = db.getOrderById(req.params.id);
  if (!order || (order.userId !== user.id && user.role !== 'admin')) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

// ----------------------------------------------------
// Secure Downloads Infrastructure
// ----------------------------------------------------

apiRouter.post('/downloads/authorize', (req: Request, res: Response) => {
  const { appId, buildId } = req.body;
  if (!appId || !buildId) {
    return res.status(400).json({ error: 'appId and buildId are required' });
  }

  const app = db.getApplicationBySlug(appId);
  if (!app) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const build = app.builds.find((b) => b.id === buildId);
  if (!build) {
    return res.status(404).json({ error: 'Requested platform build not found' });
  }

  // Check user entitlement
  const user = getAuthUser(req);
  const entitlements = user ? db.getUserEntitlements(user.id) : [];
  const entitlementCheck = verifyDownloadEntitlement(app, entitlements);

  if (!entitlementCheck.authorized) {
    return res.status(403).json({
      error: 'Entitlement required',
      message: 'This application requires an authorized license or active purchase.',
      appId: app.id,
      basePriceUsd: app.basePriceUsd,
    });
  }

  // Issue short-lived cryptographic signed token (valid for 60 minutes)
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + 60 * 60 * 1000;

  // Build filename based on app and format
  const extension = build.packageFormat === 'dmg' ? '.dmg' : build.packageFormat === 'exe' ? '.exe' : build.packageFormat === 'msi' ? '.msi' : build.packageFormat === 'appimage' ? '.AppImage' : build.packageFormat === 'deb' ? '.deb' : build.packageFormat === 'apk' ? '.apk' : '.bin';
  const cleanAppName = app.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const filename = `${cleanAppName}-${build.version}-${build.architecture}${extension}`;

  signedDownloadTokens.set(token, {
    appId: app.id,
    buildId: build.id,
    userId: user?.id,
    expiresAt,
    filename,
    fileSizeBytes: build.fileSizeBytes,
    sha256Checksum: build.sha256Checksum,
    platform: build.platform,
    version: build.version,
  });

  if (user) {
    db.recordDownload(user.id, build.id);
  }

  const authData: DownloadAuthorization = {
    token,
    appId: app.id,
    appName: app.name,
    buildId: build.id,
    platform: build.platform,
    version: build.version,
    filename,
    fileSizeBytes: build.fileSizeBytes,
    sha256Checksum: build.sha256Checksum,
    expiresAt: new Date(expiresAt).toISOString(),
    downloadUrl: `/api/downloads/file/${token}`,
    requiresLicense: build.requiresLicense,
    entitlementId: entitlementCheck.licenseKey,
  };

  res.json(authData);
});

// Stream verified installer file payload
apiRouter.get('/downloads/file/:token', (req: Request, res: Response) => {
  const token = req.params.token;
  const tokenData = signedDownloadTokens.get(token);

  if (!tokenData) {
    return res.status(403).send('Download link is invalid or has expired. Please re-authorize in SAHRIVA Store.');
  }

  if (Date.now() > tokenData.expiresAt) {
    signedDownloadTokens.delete(token);
    return res.status(403).send('Download link has expired. Please request a fresh authorization token.');
  }

  // Set verified download headers
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${tokenData.filename}"`);
  res.setHeader('X-Nexora-SHA256', tokenData.sha256Checksum);
  res.setHeader('X-Nexora-Platform', tokenData.platform);
  res.setHeader('X-Nexora-Version', tokenData.version);

  // Generate an authentic installer archive header and mock verified package buffer
  const payloadHeader = `NEXORA_AUTHORIZED_PACKAGE\nApp: ${tokenData.appId}\nVersion: ${tokenData.version}\nPlatform: ${tokenData.platform}\nSHA256: ${tokenData.sha256Checksum}\nTimestamp: ${new Date().toISOString()}\n`;
  const buffer = Buffer.from(payloadHeader.padEnd(2048, '\0'));

  res.send(buffer);
});

// ----------------------------------------------------
// Reviews & Support
// ----------------------------------------------------

apiRouter.post('/apps/:appId/reviews', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Please sign in to submit a review' });
  }

  const { rating, title, comment, platformUsed } = req.body;
  if (!rating || !comment || !title) {
    return res.status(400).json({ error: 'Rating, title, and comment are required' });
  }

  const entitlements = db.getUserEntitlements(user.id);
  const isVerifiedBuyer = entitlements.some((e) => e.appId === req.params.appId);

  const review = {
    id: `rev-${Date.now()}`,
    appId: req.params.appId,
    userName: user.name,
    rating: Math.max(1, Math.min(5, Number(rating))),
    title,
    comment,
    date: new Date().toISOString().split('T')[0],
    platformUsed: platformUsed || 'macos',
    verifiedBuyer: isVerifiedBuyer,
  };

  db.addReview(review);
  res.status(201).json({ success: true, review });
});

apiRouter.post('/support/tickets', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { userEmail, subject, message, category } = req.body;

  if (!subject || !message || (!user && !userEmail)) {
    return res.status(400).json({ error: 'Email, subject, and message are required' });
  }

  const ticket = {
    id: `ticket-${Date.now()}`,
    userId: user?.id,
    userEmail: user ? user.email : userEmail,
    subject,
    message,
    category: category || 'other',
    status: 'open' as const,
    createdAt: new Date().toISOString(),
  };

  db.createTicket(ticket);
  res.status(201).json({ success: true, ticket });
});

// ----------------------------------------------------
// Admin Routes
// ----------------------------------------------------

apiRouter.get('/admin/overview', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required' });
  }

  const apps = db.getApplications();
  const orders = db.getAllOrders();
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalUsd, 0);

  const platformCount: Record<string, number> = {
    macos: 0,
    windows: 0,
    linux: 0,
    android: 0,
  };

  apps.forEach((app) => {
    app.supportedPlatforms.forEach((p) => {
      platformCount[p] = (platformCount[p] || 0) + 1;
    });
  });

  res.json({
    totalApps: apps.length,
    totalOrders: orders.length,
    totalRevenueUsd: Math.round(totalRevenue * 100) / 100,
    platformCount,
    recentOrders: orders.slice(0, 5),
    tickets: db.getTickets(),
  });
});

apiRouter.post('/admin/apps', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required' });
  }

  const appData = req.body;
  if (!appData.name || !appData.slug) {
    return res.status(400).json({ error: 'App name and slug are required' });
  }

  db.addApplication(appData);
  res.status(201).json({ success: true, app: appData });
});

// ----------------------------------------------------
// Gemini AI Concierge & Chatbot Route
// ----------------------------------------------------

const genaiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const STORE_AI_SYSTEM_INSTRUCTION = `You are the SAHRIVA Store AI Concierge & Software Architect Advisor, created under the visionary direction of store architect and principal curator Shiva Sai Valaboju.

Your mission is to provide sophisticated, technically precise, and friendly assistance to users browsing the SAHRIVA Store. You help users:
1. Discover the ideal cross-platform software tailored to their exact workflow (Creative, Engineering, Security, Productivity, System Utilities).
2. Compare features, system requirements, architecture targets (Apple Silicon M-series ARM64, Windows x86_64 / ARM64, Linux, Android), and performance benchmarks (e.g. 120 FPS Metal/Vulkan engines).
3. Explain genuine offline licensing: SAHRIVA Store issues perpetual cryptographic keys (format: NEX-XXXX-XXXX-XXXX-XXXX) that validate locally on client hardware with zero background telemetry, zero phone-home surveillance, and zero cloud lock-in.
4. Assist with active promotional vouchers:
   - 'LAUNCH25' grants 25% discount on orders above $20.00.
   - 'SAHRIVA10' grants 10% welcome voucher with no minimum order.
5. Clarify store trust policies: 14-day direct refund policy, cryptographically verified SHA-256 package checksums, Apple Notarization, and Windows EV Authenticode digital signatures.

Here is the current verified SAHRIVA Store application catalog:
- DaVinci Resolve Studio 21 (Featured Spotlight): Hollywood's #1 post-production suite for professional 8K editing, color grading, Fusion VFX & Fairlight audio ($295.00 perpetual) by Black Magic. Available for macOS (Apple Silicon Metal 3), Windows (CUDA 12/DirectX 12), and Linux. Features DaVinci Neural Engine AI, Magic Mask, Dolby Vision, and Dolby Atmos.
- CapCut Pro (#1 Trending): AI-powered all-in-one video creation suite with optical curve speed, auto captions & lossless 4K 60fps HDR export ($39.00 perpetual). Available for Android (native APK), Windows (MSI), and macOS (Metal 3 native).
- InShot Pro (#2 Trending): Ultra-fast HD video maker, precision music sync & keyframe editor with zero watermark ($29.00 perpetual). Available for Android (APK), Windows, and macOS.
- HyperFlow Studio (#3 Trending): Professional node-based 120 FPS motion graphics and UI prototype engine ($49.00, perpetual). Available for macOS (Apple Silicon native), Windows (MSI/EXE), and Linux. Features Metal 3 / Vulkan 1.3 acceleration, spline curves, and Lottie export.
- Orbit Terminal (#4 Trending): Ultra-low latency GPU-accelerated terminal and cloud environment orchestrator (Free / Open Source). Available for Android, Windows, macOS, and Linux. Built-in SSH session clustering, multiplexing, and WebAssembly plugin runtime.
- PixelForge Vector (#5 Trending): Resolution-independent vector illustration and typography suite ($79.00, perpetual). Available for macOS, Windows, and Linux. Precision Bézier algorithms, multi-layer CMYK color spaces, and SVG/PDF export.
- Vortex DB Studio: Visual database schema modeler, query profiler, and real-time connection debugger ($59.00, perpetual). Available for macOS, Windows, and Linux. Supports PostgreSQL, Cloud SQL, SQLite, and Redis with SSL tunneling.
- CipherGuard Pro (#6 Trending): Hardware-bound security enclave, passkey manager, and zero-knowledge secrets vault ($45.00, perpetual). Available for Android, Windows, macOS, and Linux. FIDO2 / WebAuthn, YubiKey biometric integration, AES-256-GCM encryption.
- Zenith Markdown Editor: Distraction-free technical writing suite, LaTeX mathematics renderer, and static site publisher (Free / Open Source). Available for Android, Windows, macOS, and Linux. Real-time split preview, Mermaid diagrams, and GitHub Flavored Markdown.
- SoundWave Studio: Multi-track digital audio workstation (DAW) with real-time VST3 / AU effects processing ($89.00, perpetual). 64-bit float audio pipeline, MIDI sequencing, and multi-channel mastering.

Tone Guidelines:
- Professional, elegant, knowledgeable, and respectful of software craftsmanship.
- Whenever appropriate, cite Shiva Sai Valaboju as the store owner, architect, and principal creator.
- When recommending an app, include its price, supported platforms, and standout performance characteristics.
- Format responses cleanly with Markdown (bold headers, bullet points, concise paragraphs). Keep replies readable, scannable, and engaging.`;

apiRouter.post('/chat', async (req: Request, res: Response) => {
  const messages: any[] = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const model = req.body?.model;

  if (messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  try {

    // Model selection per skill guidelines
    // gemini-3.8-flash for general tasks (default)
    // gemini-3.1-flash-lite for fast tasks
    // gemini-4-argon for complex tasks
    const requestedModel = typeof model === 'string' ? model.trim() : '';
    let selectedModel = 'gemini-3.8-flash';
    if (requestedModel === 'gemini-3.1-flash-lite' || requestedModel === 'fast') {
      selectedModel = 'gemini-3.1-flash-lite';
    } else if (requestedModel === 'gemini-4-argon' || requestedModel === 'complex') {
      selectedModel = 'gemini-4-argon';
    } else if (requestedModel === 'gemini-3.8-flash') {
      selectedModel = 'gemini-3.8-flash';
    }

    // Convert multi-turn history to @google/genai format
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '') }],
    }));

    const response = await genaiClient.models.generateContent({
      model: selectedModel,
      contents,
      config: {
        systemInstruction: STORE_AI_SYSTEM_INSTRUCTION,
      },
    });

    const reply = response.text || 'I could not generate a response. Please try asking again.';

    res.json({
      reply,
      model: selectedModel,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Gemini Chat API error:', error);

    const errorMessage = error?.message || 'Internal server error';
    const isApiKeyIssue =
      errorMessage.includes('API key') ||
      errorMessage.includes('PERMISSION_DENIED') ||
      errorMessage.includes('API_KEY_INVALID');

    if (isApiKeyIssue) {
      const lastUserMsg =
        [...messages]
          .reverse()
          .find((m: any) => m.role === 'user' || m.role === 'usr')
          ?.content?.toLowerCase() || '';

      let reply = '';

      if (lastUserMsg.includes('davinci') || lastUserMsg.includes('black magic') || lastUserMsg.includes('blackmagic') || lastUserMsg.includes('resolve')) {
        reply =
          "🎞️ **DaVinci Resolve Studio 21** ($295.00 perpetual, **Featured Spotlight**) by **Black Magic** is Hollywood's gold standard for professional 8K multi-track editing, legendary color grading, Fusion VFX, and Fairlight audio post-production. It includes the DaVinci Neural Engine AI, automated Magic Mask, Dolby Vision HDR, and multi-GPU acceleration for **macOS (Metal 3)**, **Windows (CUDA 12/DirectX 12)**, and **Linux**.";
      } else if (lastUserMsg.includes('capcut')) {
        reply =
          "🎬 **CapCut Pro** ($39.00 perpetual, **#1 Trending**) is the industry-favorite AI-assisted video editing suite. It features optical flow super-smooth slow motion, real-time auto captions, 3D camera tracking, and lossless 4K 60FPS export with zero watermarks. Available for **Android (APK)**, **Windows (MSI)**, and **macOS (Metal 3 native)**.";
      } else if (lastUserMsg.includes('inshot')) {
        reply =
          "✂️ **InShot Pro** ($29.00 perpetual, **#2 Trending**) offers lightning-fast HD and 4K video editing, precision music beat sync, and keyframe animations with 100% watermark-free export. Ideal for rapid content creation on **Android (APK)**, **Windows**, and **macOS**.";
      } else if (lastUserMsg.includes('video') || lastUserMsg.includes('trending')) {
        reply =
          "🔥 **Top Trending Video Editors in SAHRIVA Store:**\n\n1. **CapCut Pro (#1 Trending)** — $39.00 perpetual. Smart curve speed, AI auto-captions, 4K 60fps export for Android, Windows & Mac.\n2. **InShot Pro (#2 Trending)** — $29.00 perpetual. Precision music sync, keyframe animations, zero watermark for Android, Windows & Mac.\n3. **HyperFlow Studio (#3 Trending)** — $49.00 perpetual. 120 FPS node-based motion graphics & UI animation engine.";
      } else if (lastUserMsg.includes('hyperflow')) {
        reply =
          "⚡ **HyperFlow Studio** ($49.00 perpetual, **#3 Trending**) is our premier 120 FPS node-based motion graphics, micro-interaction, and UI animation suite. Engineered for extreme GPU efficiency via Metal 3 and Vulkan 1.3, it offers sub-pixel spline editing, real-time shaders, and instant Lottie / WebM export. Available for macOS (Apple Silicon native), Windows, and Linux.";
      } else if (lastUserMsg.includes('android')) {
        reply =
          "📱 **Android Applications in SAHRIVA Store:**\n\n- **CapCut Pro (#1 Trending)** ($39.00) — Native APK with 4K 60fps hardware export.\n- **InShot Pro (#2 Trending)** ($29.00) — Native APK with zero watermark.\n- **Orbit Terminal** (Free / Open Source) — Ultra-low latency GPU terminal with SSH multiplexing.\n- **CipherGuard Pro** ($45.00) — Hardware passkey & zero-knowledge vault with biometric unlock.\n- **Zenith Markdown Editor** (Free / Open Source) — Clean distraction-free LaTeX & Markdown writing environment.\n\nAll builds are APK signed and verified for Android ARM64.";
      } else if (lastUserMsg.includes('license') || lastUserMsg.includes('offline') || lastUserMsg.includes('activation')) {
        reply =
          "🔑 **Perpetual Offline Licensing Model:**\n\nEvery paid software purchase in SAHRIVA Store comes with a cryptographically signed perpetual license key (`NEX-XXXX-XXXX-XXXX-XXXX`). Our licenses:\n- Validate 100% offline directly on your machine without requiring persistent internet.\n- Support activation on up to **2-3 personal devices** simultaneously.\n- Feature zero telemetry and zero phone-home surveillance.";
      } else if (lastUserMsg.includes('coupon') || lastUserMsg.includes('discount') || lastUserMsg.includes('promo') || lastUserMsg.includes('code')) {
        reply =
          "🏷️ **Active SAHRIVA Store Promotional Coupons:**\n\n- **`LAUNCH25`**: Grants an instant **25% discount** on any cart total exceeding $20.00.\n- **`SAHRIVA10`**: Grants a **10% welcome discount** on all applications with no minimum spend required.\n\nEnter these codes in the Cart Drawer at checkout!";
      } else if (lastUserMsg.includes('zenith') || lastUserMsg.includes('markdown')) {
        reply =
          "📝 **Zenith Markdown Editor** (Free / Open Source) provides distraction-free technical writing, real-time KaTeX math rendering, and instant static-site publishing. Available on Android, Windows, macOS, and Linux.";
      } else if (lastUserMsg.includes('shiva') || lastUserMsg.includes('creator') || lastUserMsg.includes('author') || lastUserMsg.includes('who')) {
        reply =
          "✨ **SAHRIVA Store** is engineered, designed, and curated under the leadership of **Shiva Sai Valaboju**, dedicated to building ultra-fast, respectful, and aesthetically transcendent software without bloat.";
      } else {
        reply =
          "👋 I am the **SAHRIVA Store AI Concierge**, curated by **Shiva Sai Valaboju**.\n\nWe feature verified perpetual-license software across Android, macOS, Windows, and Linux, including **CapCut Pro (#1 Trending)** ($39.00), **InShot Pro (#2 Trending)** ($29.00), **HyperFlow Studio** ($49.00), **Orbit Terminal** (Free), and **CipherGuard Pro** ($45.00).\n\nUse promo voucher `LAUNCH25` for 25% off orders over $20!\n\n*(Note: To enable unlimited generative open-ended queries, update your Gemini API key in the Settings > Secrets panel.)*";
      }

      return res.status(200).json({
        reply,
        model: 'catalog-knowledge',
        isNotice: true,
      });
    }

    res.status(500).json({
      error: 'Unable to process chat request with Gemini API',
      details: errorMessage,
    });
  }
});
