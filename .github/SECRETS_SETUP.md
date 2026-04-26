# GitHub Secrets Setup

## Required Secrets

### For CI (all repos)
- None required (uses default GITHUB_TOKEN)

### For CD (Deploy workflow)
| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `RAILWAY_TOKEN` | Railway deployment token | Railway → Settings → Tokens |
| `DISCORD_WEBHOOK` | Discord notification webhook | Discord Server Settings → Integrations |
| `PRODUCTION_URL` | Production API URL | Your deployed backend URL |

## How to Add Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret from the table above

## Local Testing

```bash
# Test CI locally with act
brew install act
act push