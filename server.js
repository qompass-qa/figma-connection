import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import FigmaAPI from './figma-api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Store OAuth state for security
const oauthStates = new Map();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Personal token connection endpoint
app.post('/api/connect', async (req, res) => {
  const { token, teamId } = req.body;
  
  if (!token) {
    return res.status(400).json({ 
      error: 'Token is required',
      success: false 
    });
  }
  
  if (!teamId) {
    return res.status(400).json({ 
      error: 'Team ID is required',
      success: false 
    });
  }
  
  try {
    const figma = new FigmaAPI(token);
    
    // Get projects for specific team ID with file information
    const projects = await figma.getProjectsWithTeamId(teamId);
    
    res.json({
      success: true,
      data: projects,
      tokenType: 'personal'
    });
  } catch (error) {
    console.error('Figma API Error:', error.message);
    res.status(500).json({ 
      error: error.message,
      success: false 
    });
  }
});

// Get frames for a specific project
app.post('/api/project-frames', async (req, res) => {
  const { token, projectId } = req.body;
  
  if (!token) {
    return res.status(400).json({ 
      error: 'Token is required',
      success: false 
    });
  }
  
  if (!projectId) {
    return res.status(400).json({ 
      error: 'Project ID is required',
      success: false 
    });
  }
  
  try {
    const figma = new FigmaAPI(token);
    
    // Get all frames from the project
    const projectFrames = await figma.getProjectFrames(projectId);
    
    res.json({
      success: true,
      data: projectFrames
    });
  } catch (error) {
    console.error('Project Frames API Error:', error.message);
    res.status(500).json({ 
      error: error.message,
      success: false 
    });
  }
});

// OAuth authorization initiation
app.get('/auth/figma', (req, res) => {
  const state = Math.random().toString(36).substring(7);
  oauthStates.set(state, Date.now());
  
  const authUrl = FigmaAPI.generateOAuthUrl(
    process.env.FIGMA_CLIENT_ID,
    process.env.FIGMA_REDIRECT_URI,
    state
  );
  
  res.redirect(authUrl);
});

// OAuth callback handler
app.get('/auth/figma/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    return res.redirect('/?error=authorization_denied');
  }
  
  // Verify state
  if (!state || !oauthStates.has(state)) {
    return res.redirect('/?error=invalid_state');
  }
  
  // Clean up state
  oauthStates.delete(state);
  
  try {
    const tokenData = await FigmaAPI.exchangeCodeForToken(
      code,
      process.env.FIGMA_CLIENT_ID,
      process.env.FIGMA_CLIENT_SECRET,
      process.env.FIGMA_REDIRECT_URI
    );
    
    // Get user's projects with OAuth token
    const figma = new FigmaAPI(tokenData.access_token);
    const projects = await figma.getAllProjects();
    
    // For simplicity, we'll pass the data via URL params (in production, use sessions)
    const dataStr = encodeURIComponent(JSON.stringify({
      success: true,
      data: projects,
      tokenType: 'oauth',
      token: tokenData.access_token
    }));
    
    res.redirect(`/?oauth_success=true&data=${dataStr}`);
    
  } catch (error) {
    console.error('OAuth Error:', error.message);
    res.redirect(`/?error=${encodeURIComponent(error.message)}`);
  }
});

// Clean up old OAuth states periodically
setInterval(() => {
  const now = Date.now();
  for (const [state, timestamp] of oauthStates.entries()) {
    if (now - timestamp > 10 * 60 * 1000) { // 10 minutes
      oauthStates.delete(state);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log('📁 Serving frontend from /public directory');
  console.log('🔑 Ready for both personal tokens and OAuth authentication');
});