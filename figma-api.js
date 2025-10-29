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
   * Get all teams for the authenticated user (OAuth only)
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
   * Get thumbnail for a file
   * @param {string} fileKey - The file key
   * @returns {Promise} - Thumbnail data
   */
  async getFileThumbnail(fileKey) {
    try {
      const response = await axios.get(`${this.baseURL}/images/${fileKey}`, {
        headers: this.headers,
        params: {
          format: 'png',
          scale: '0.5' // Smaller scale for thumbnails
        }
      });
      return response.data;
    } catch (error) {
      // Don't throw error for thumbnails, just return null
      console.warn(`Failed to get thumbnail for ${fileKey}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get projects for a specific team ID with thumbnails
   * @param {string} teamId - The team ID from your Figma URL
   * @returns {Promise} - Formatted projects data with thumbnails
   */
  async getProjectsWithTeamId(teamId) {
    try {
      const userInfo = await this.getMe();
      const teamProjects = await this.getTeamProjects(teamId);
      
      // Enhance projects with thumbnails
      const enhancedProjects = await Promise.all(
        (teamProjects.projects || []).map(async (project) => {
          try {
            // Get files in this project
            const projectFiles = await this.getProjectFiles(project.id);
            
            // Get thumbnail from the first file if available
            let thumbnail = null;
            if (projectFiles.files && projectFiles.files.length > 0) {
              const firstFile = projectFiles.files[0];
              const thumbnailData = await this.getFileThumbnail(firstFile.key);
              if (thumbnailData && thumbnailData.images) {
                // Get the first thumbnail URL
                const thumbnailUrls = Object.values(thumbnailData.images);
                if (thumbnailUrls.length > 0) {
                  thumbnail = thumbnailUrls[0];
                }
              }
            }
            
            return {
              ...project,
              thumbnail: thumbnail,
              fileCount: projectFiles.files ? projectFiles.files.length : 0,
              files: projectFiles.files || []
            };
          } catch (error) {
            console.warn(`Could not enhance project ${project.name}: ${error.message}`);
            return {
              ...project,
              thumbnail: null,
              fileCount: 0,
              files: []
            };
          }
        })
      );
      
      return {
        user: {
          id: userInfo.id,
          email: userInfo.email,
          handle: userInfo.handle,
          img_url: userInfo.img_url
        },
        teamId: teamId,
        projects: enhancedProjects,
        method: 'team-id',
        success: true
      };
      
    } catch (error) {
      throw new Error(`Failed to get projects for team ${teamId}: ${error.message}`);
    }
  }

  /**
   * Get all projects from all teams (OAuth only)
   * @returns {Promise} - All projects organized by team
   */
  async getAllProjects() {
    try {
      const userInfo = await this.getMe();
      const allProjects = [];
      
      try {
        // Try to get teams (this will work with OAuth tokens)
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
        // This means we're using a personal token, not OAuth
        return {
          user: {
            id: userInfo.id,
            email: userInfo.email,
            handle: userInfo.handle,
            img_url: userInfo.img_url
          },
          teams: [],
          limitation: {
            title: "Personal Access Token Limitation",
            message: "Personal access tokens cannot access team/project endpoints. To browse your teams and projects, you need to use OAuth authentication.",
            solution: "Click 'Login with OAuth' below to get full access to your teams and projects."
          }
        };
      }
      
    } catch (error) {
      throw new Error(`Failed to get projects: ${error.message}`);
    }
  }

  /**
   * Generate OAuth authorization URL
   * @param {string} clientId - OAuth client ID
   * @param {string} redirectUri - Redirect URI
   * @param {string} state - Random state for security
   * @returns {string} - Authorization URL
   */
  static generateOAuthUrl(clientId, redirectUri, state) {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      state: state,
      response_type: 'code'
      // Removing scope temporarily to test if it's required
    });
    
    return `https://www.figma.com/oauth?${params.toString()}`;
  }

  /**
   * Exchange OAuth code for access token
   * @param {string} code - Authorization code
   * @param {string} clientId - OAuth client ID
   * @param {string} clientSecret - OAuth client secret
   * @param {string} redirectUri - Redirect URI
   * @returns {Promise} - Token data
   */
  static async exchangeCodeForToken(code, clientId, clientSecret, redirectUri) {
    try {
      const response = await axios.post('https://www.figma.com/api/oauth/token', {
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code,
        grant_type: 'authorization_code'
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to exchange code for token: ${error.response?.data?.message || error.message}`);
    }
  }
}

export default FigmaAPI;