# Figma Browser

Browse your Figma projects and frames with a simple web interface.

## Install

```bash
npm install -g figma-browser
```

## Use

```bash
figma-browser
```

Opens at `http://localhost:3000`. Enter your:
- Figma personal access token
- Team ID from your Figma team URL

## Get Your Token

1. Go to [Figma Developer Settings](https://www.figma.com/developers/api#access-tokens)
2. Create new token
3. Copy the token (starts with `figd_`)

## Get Your Team ID

From your Figma team URL: `https://www.figma.com/team/123456/TeamName`
The Team ID is: `123456`

## Options

```bash
figma-browser --port 8080     # Different port
figma-browser --no-browser    # Don't open browser
figma-browser --help          # Show help
```

**Requirements:** Node.js 16+

---
MIT License
