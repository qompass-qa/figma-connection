# FigmaAPI

A lightweight Node.js wrapper for the [Figma REST API v1](https://www.figma.com/developers/api) built with `axios`.
It supports **personal access tokens** for fetching files, frames, projects, and teams.

---

## 🚀 Features

* Fetch and parse full Figma file data
* Extract all frames with layout metadata
* Retrieve frames, projects, and files for teams
* Get user info and thumbnails
* Personal access token authentication
* Handles rate limiting with built-in delays
* Graceful error handling with detailed messages

---

## 📦 Installation

```bash
npm install axios
```

Then import the class:

```js
import FigmaAPI from './FigmaAPI.js';
```

---

## 🔐 Authentication

Generate a personal access token from your [Figma Account Settings](https://www.figma.com/developers/api#access-tokens).

```js
const figma = new FigmaAPI('YOUR_PERSONAL_ACCESS_TOKEN');
```

---

## 🧭 Usage Examples

### Get file and extract all frames

```js
const fileKey = 'your-file-key';
const { fileInfo, frames } = await figma.getAllFrames(fileKey);

console.log(fileInfo.name, 'contains', frames.length, 'frames');
```

---

### Get specific nodes (frames) from a file

```js
const nodes = await figma.getNodes(fileKey, ['123:45', '678:90']);
console.log(nodes);
```

---

### Get frame thumbnails

```js
const thumbnails = await figma.getFrameThumbnails(fileKey, ['123:45'], { scale: 2 });
console.log(thumbnails.images);
```

---

### Get team projects

```js
const projects = await figma.getTeamProjects('team-id');
console.log(projects);
```

---

### Get all frames from all files in a project

```js
const projectFrames = await figma.getProjectFrames('project-id');
console.log('Total frames:', projectFrames.totalFrames);
```

---

### Get user information

```js
const me = await figma.getMe();
console.log('Logged in as:', me.handle);
```

---

## 🧩 Available Methods

| Method                                           | Description                             |
| ------------------------------------------------ | --------------------------------------- |
| `getFile(fileKey)`                               | Fetch full file data                    |
| `getNodes(fileKey, nodeIds)`                     | Fetch specific nodes by ID              |
| `extractFrames(fileData)`                        | Recursively extract all frames          |
| `getAllFrames(fileKey)`                          | Get file info + all frames              |
| `getFrameThumbnails(fileKey, nodeIds, options)`  | Get thumbnail URLs for frames           |
| `getMe()`                                        | Get current user info                   |
| `getTeams()`                                     | Get teams                               |
| `getTeamProjects(teamId)`                        | Get projects in a team                  |
| `getProjectFiles(projectId)`                     | Get files in a project                  |
| `getProjectFrames(projectId)`                    | Get frames from all project files       |
| `getProjectsWithTeamId(teamId)`                  | Get projects + file info for a team     |
| `getAllProjects()`                               | Get all teams and projects              |
| `getFileThumbnail(fileKey)`                      | Get a single thumbnail (with delay)     |
| `sleep(ms)`                                      | Utility for delaying requests           |

---

## ⚙️ Error Handling

Each API call throws an `Error` with a detailed message from Figma’s API, e.g.:

```
Failed to fetch file: Not authorized to access this file
```

You can wrap calls in `try/catch` blocks for graceful handling:

```js
try {
  const data = await figma.getFile(fileKey);
} catch (error) {
  console.error(error.message);
}
```

---

## 🧠 Notes & Limitations

* Figma rate-limits requests (~60/min).
  This client includes `sleep()` delays to reduce throttling.
* Team endpoints require a personal access token with appropriate permissions.
* `extractFrames()` collects layout-related metadata for analysis or export.

---

## 🪪 License

MIT License © 2025 — Built for developers exploring Figma API integration.
