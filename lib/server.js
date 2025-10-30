import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import FigmaAPI from './figma-api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
// Serve static files from the public directory (one level up)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Personal token connection endpoint
app.post('/api/connect', async (req, res) => {
  const { token, teamId } = req.body;
  
  console.log('🔗 /api/connect called with teamId:', teamId);
  
  if (!token) {
    console.log('❌ No token provided');
    return res.status(400).json({ 
      error: 'Token is required',
      success: false 
    });
  }
  
  if (!teamId) {
    console.log('❌ No teamId provided');
    return res.status(400).json({ 
      error: 'Team ID is required',
      success: false 
    });
  }
  
  try {
    console.log('🚀 Creating FigmaAPI instance and fetching projects...');
    const figma = new FigmaAPI(token);
    
    // Get projects for specific team ID with file information
    const projects = await figma.getProjectsWithTeamId(teamId);
    console.log('✅ Projects fetched successfully:', projects?.projects?.length || 0, 'projects');
    
    res.json({
      success: true,
      data: projects,
      tokenType: 'personal'
    });
  } catch (error) {
    console.error('❌ Figma API Error:', error.message);
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

export function startServer(customPort = null) {
  const serverPort = customPort || port;
  
  return app.listen(serverPort, () => {
    console.log(`🚀 Server running on http://localhost:${serverPort}`);
    console.log('📁 Serving frontend from /public directory');
    console.log('🔑 Ready for personal token authentication');
  });
}

// Start server automatically if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}