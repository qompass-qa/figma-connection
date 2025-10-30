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

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log('📁 Serving frontend from /public directory');
  console.log('🔑 Ready for personal token authentication');
});