import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// Create account
router.post('/createAccount', (req: any, res: any) => {
  try {
    const { handle, password, email, profile } = req.body;

    if (!handle || !password) {
      return res.status(400).json({ error: 'Handle and password are required' });
    }

    // Check if handle already exists
    const existingUser = req.repository.getUserByHandle(handle);
    if (existingUser) {
      return res.status(400).json({ error: 'Handle already exists' });
    }

    // Create user
    const user = req.repository.createUser({
      handle,
      password, // In production, hash this password
      email,
      profile
    });

    // Create session
    const { accessJwt, refreshJwt } = req.repository.createSession(user.did);

    res.status(201).json({
      accessJwt,
      refreshJwt,
      handle: user.handle,
      did: user.did,
      profile: user.profile
    });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login
router.post('/createSession', (req: any, res: any) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }

    // Find user by handle or email
    const user = req.repository.getUserByHandle(identifier);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // In production, verify password hash here
    // For demo purposes, we'll skip password verification

    // Create session
    const { accessJwt, refreshJwt } = req.repository.createSession(user.did);

    res.json({
      accessJwt,
      refreshJwt,
      handle: user.handle,
      did: user.did,
      profile: user.profile
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get session info
router.get('/getSession', authenticateToken, (req: any, res: any) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = req.repository.getUser(req.user.did);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      handle: user.handle,
      did: user.did,
      profile: user.profile
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// Delete session (logout)
router.post('/deleteSession', authenticateToken, (req: any, res: any) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      req.repository.deleteSession(token);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

export { router as authRoutes };