import axios from 'axios';

class FigmaAPI {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseURL = 'https://api.figma.com/v1';
    this.headers = {
      'X-Figma-Token': accessToken,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get file information including all frames
   * @param {string} fileKey - The Figma file key from the URL
   * @returns {Promise} - File data with frames
   */
  async getFile(fileKey) {
    try {
      const response = await axios.get(`${this.baseURL}/files/${fileKey}`, {
        headers: this.headers
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch file: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get specific nodes (frames) from a file
   * @param {string} fileKey - The Figma file key
   * @param {string[]} nodeIds - Array of node IDs to fetch
   * @returns {Promise} - Node data
   */
  async getNodes(fileKey, nodeIds) {
    try {
      const ids = nodeIds.join(',');
      const response = await axios.get(`${this.baseURL}/files/${fileKey}/nodes`, {
        headers: this.headers,
        params: { ids }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch nodes: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Extract all frames from file data
   * @param {Object} fileData - The file data from getFile()
   * @returns {Array} - Array of frame objects with their info
   */
  extractFrames(fileData) {
    const frames = [];
    
    function traverseNode(node, path = []) {
      if (node.type === 'FRAME') {
        frames.push({
          id: node.id,
          name: node.name,
          type: node.type,
          path: [...path, node.name],
          absoluteBoundingBox: node.absoluteBoundingBox,
          backgroundColor: node.backgroundColor,
          children: node.children ? node.children.length : 0,
          constraints: node.constraints,
          layoutMode: node.layoutMode,
          primaryAxisSizingMode: node.primaryAxisSizingMode,
          counterAxisSizingMode: node.counterAxisSizingMode,
          paddingLeft: node.paddingLeft,
          paddingRight: node.paddingRight,
          paddingTop: node.paddingTop,
          paddingBottom: node.paddingBottom,
          itemSpacing: node.itemSpacing
        });
      }
      
      if (node.children) {
        node.children.forEach(child => 
          traverseNode(child, [...path, node.name])
        );
      }
    }
    
    if (fileData.document) {
      traverseNode(fileData.document);
    }
    
    return frames;
  }

  /**
   * Get all frames from a Figma file
   * @param {string} fileKey - The Figma file key
   * @returns {Promise<Array>} - Array of frame information
   */
  async getAllFrames(fileKey) {
    try {
      const fileData = await this.getFile(fileKey);
      const frames = this.extractFrames(fileData);
      return {
        fileInfo: {
          name: fileData.name,
          version: fileData.version,
          lastModified: fileData.lastModified
        },
        frames: frames
      };
    } catch (error) {
      throw new Error(`Failed to get frames: ${error.message}`);
    }
  }

  /**
   * Get frame thumbnails
   * @param {string} fileKey - The Figma file key
   * @param {string[]} nodeIds - Frame node IDs
   * @param {Object} options - Thumbnail options (scale, format)
   * @returns {Promise} - Thumbnail URLs
   */
  async getFrameThumbnails(fileKey, nodeIds, options = {}) {
    try {
      const params = {
        ids: nodeIds.join(','),
        scale: options.scale || 1,
        format: options.format || 'png'
      };

      const response = await axios.get(`${this.baseURL}/images/${fileKey}`, {
        headers: this.headers,
        params
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get thumbnails: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get user information
   * @returns {Promise} - User data
   */
  async getMe() {
    try {
      const response = await axios.get(`${this.baseURL}/me`, {
        headers: this.headers
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch user info: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get all teams for the authenticated user
   * @returns {Promise} - Teams data
   */
  async getTeams() {
    try {
      const response = await axios.get(`${this.baseURL}/teams`, {
        headers: this.headers
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch teams: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get all projects for a team (Works with personal access tokens!)
   * @param {string} teamId - The team ID
   * @returns {Promise} - Projects data
   */
  async getTeamProjects(teamId) {
    try {
      const response = await axios.get(`${this.baseURL}/teams/${teamId}/projects`, {
        headers: this.headers
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch team projects: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get files in a project
   * @param {string} projectId - The project ID
   * @returns {Promise} - Project files data
   */
  async getProjectFiles(projectId) {
    try {
      const response = await axios.get(`${this.baseURL}/projects/${projectId}/files`, {
        headers: this.headers
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch project files: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Sleep utility for rate limiting
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get thumbnail for a file with rate limiting
   * @param {string} fileKey - The file key
   * @returns {Promise} - Thumbnail data
   */
  async getFileThumbnail(fileKey) {
    try {
      // Add small delay to avoid rate limiting
      await this.sleep(100);
      
      const response = await axios.get(`${this.baseURL}/images/${fileKey}`, {
        headers: this.headers,
        params: {
          format: 'png',
          scale: '0.25' // Even smaller scale for faster loading
        }
      });
      return response.data;
    } catch (error) {
      // Silently handle thumbnail errors - they're not critical
      if (error.response?.status === 429) {
        console.warn(`Rate limited when getting thumbnail for ${fileKey}`);
      } else if (error.response?.status === 400) {
        console.warn(`Invalid file for thumbnail: ${fileKey}`);
      }
      return null;
    }
  }

  /**
   * Get frames from all files in a project
   * @param {string} projectId - The project ID
   * @returns {Promise} - All frames from project files
   */
  async getProjectFrames(projectId) {
    try {
      // Get all files in the project
      const projectFiles = await this.getProjectFiles(projectId);
      
      if (!projectFiles.files || projectFiles.files.length === 0) {
        return {
          projectId: projectId,
          files: [],
          frames: [],
          totalFrames: 0
        };
      }

      console.log(`Getting frames from ${projectFiles.files.length} files in project ${projectId}...`);
      
      const filesWithFrames = [];
      let totalFrames = 0;

      // Process files in batches to avoid rate limiting
      const batchSize = 3;
      for (let i = 0; i < projectFiles.files.length; i += batchSize) {
        const batch = projectFiles.files.slice(i, i + batchSize);
        
        const batchResults = await Promise.all(
          batch.map(async (file, index) => {
            try {
              // Add delay between files
              await this.sleep(index * 150);
              
              // Get file data with frames
              const fileData = await this.getFile(file.key);
              const frames = this.extractFrames(fileData);
              
              totalFrames += frames.length;
              
              return {
                key: file.key,
                name: file.name,
                lastModified: file.last_modified,
                thumbnailUrl: file.thumbnail_url,
                frames: frames,
                frameCount: frames.length
              };
            } catch (error) {
              console.warn(`Could not get frames from file ${file.name}: ${error.message}`);
              return {
                key: file.key,
                name: file.name,
                lastModified: file.last_modified,
                thumbnailUrl: file.thumbnail_url,
                frames: [],
                frameCount: 0,
                error: error.message
              };
            }
          })
        );
        
        filesWithFrames.push(...batchResults);
        
        // Add delay between batches
        if (i + batchSize < projectFiles.files.length) {
          await this.sleep(400);
        }
      }

      // Flatten all frames with file context
      const allFrames = [];
      filesWithFrames.forEach(file => {
        file.frames.forEach(frame => {
          allFrames.push({
            ...frame,
            fileName: file.name,
            fileKey: file.key
          });
        });
      });

      return {
        projectId: projectId,
        files: filesWithFrames,
        frames: allFrames,
        totalFrames: totalFrames
      };
      
    } catch (error) {
      throw new Error(`Failed to get project frames: ${error.message}`);
    }
  }

  /**
   * Get projects for a specific team ID with file information
   * @param {string} teamId - The team ID from your Figma URL
   * @returns {Promise} - Formatted projects data with file counts
   */
  async getProjectsWithTeamId(teamId) {
    try {
      const userInfo = await this.getMe();
      const teamProjects = await this.getTeamProjects(teamId);
      
      // Get file information for each project (no thumbnails)
      const enhancedProjects = [];
      const projects = teamProjects.projects || [];
      
      console.log(`Getting file information for ${projects.length} projects...`);
      
      // Process projects in batches to avoid rate limiting
      const batchSize = 5;
      for (let i = 0; i < projects.length; i += batchSize) {
        const batch = projects.slice(i, i + batchSize);
        
        const batchResults = await Promise.all(
          batch.map(async (project, index) => {
            try {
              // Add small delay between projects
              await this.sleep(index * 100);
              
              // Get files in this project
              const projectFiles = await this.getProjectFiles(project.id);
              
              return {
                ...project,
                fileCount: projectFiles.files ? projectFiles.files.length : 0,
                files: projectFiles.files || [],
                thumbnail: null // No thumbnails
              };
            } catch (error) {
              if (error.response?.status === 429) {
                console.warn(`Rate limited for project ${project.name}, using basic info`);
              } else {
                console.warn(`Could not get files for project ${project.name}: ${error.message}`);
              }
              return {
                ...project,
                fileCount: 0,
                files: [],
                thumbnail: null
              };
            }
          })
        );
        
        enhancedProjects.push(...batchResults);
        
        // Add delay between batches
        if (i + batchSize < projects.length) {
          await this.sleep(300);
        }
      }
      
      return {
        user: {
          id: userInfo.id,
          email: userInfo.email,
          handle: userInfo.handle,
          img_url: userInfo.img_url
        },
        teamId: teamId,
        projects: enhancedProjects,
        method: 'team-id-with-files',
        success: true
      };
      
    } catch (error) {
      throw new Error(`Failed to get projects for team ${teamId}: ${error.message}`);
    }
  }

  /**
   * Get all projects from all teams
   * @returns {Promise} - All projects organized by team
   */
  async getAllProjects() {
    try {
      const userInfo = await this.getMe();
      const allProjects = [];
      
      try {
        // Try to get teams
        const teamsResponse = await this.getTeams();
        
        if (teamsResponse.teams && teamsResponse.teams.length > 0) {
          // Get projects for each team
          for (const team of teamsResponse.teams) {
            try {
              const teamProjects = await this.getTeamProjects(team.id);
              if (teamProjects.projects && teamProjects.projects.length > 0) {
                allProjects.push({
                  teamId: team.id,
                  teamName: team.name,
                  projects: teamProjects.projects
                });
              }
            } catch (error) {
              console.warn(`Could not fetch projects for team ${team.name}: ${error.message}`);
            }
          }
        }
        
        return {
          user: {
            id: userInfo.id,
            email: userInfo.email,
            handle: userInfo.handle,
            img_url: userInfo.img_url
          },
          teams: allProjects,
          success: true
        };
        
      } catch (error) {
        // No teams accessible with this token
        return {
          user: {
            id: userInfo.id,
            email: userInfo.email,
            handle: userInfo.handle,
            img_url: userInfo.img_url
          },
          teams: [],
          limitation: {
            title: "No Teams Access",
            message: "This token doesn't have access to team/project endpoints.",
            solution: "Ensure your personal access token has the necessary permissions."
          }
        };
      }
      
    } catch (error) {
      throw new Error(`Failed to get projects: ${error.message}`);
    }
  }


}

export default FigmaAPI;