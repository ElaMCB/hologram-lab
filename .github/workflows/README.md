# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automating repository tasks.

## Available Workflows

### Weekly Hologram Generation

**File**: `weekly-hologram.yml`

**Purpose**: Automatically generates a new hologram simulation animation each week and commits it to the repository.

**Schedule**: Runs every Monday at 00:00 UTC

**Manual Trigger**: Can be manually triggered from the Actions tab in GitHub

**What it does**:
1. Checks out the repository
2. Sets up Python 3.9
3. Installs dependencies from `requirements.txt`
4. Runs the hologram generation script (`.github/scripts/generate_weekly_hologram.py`)
5. Commits the generated GIF to the `demos/` directory
6. Pushes the changes to the repository

**Output**: A new GIF file in `demos/weekly-hologram-YYYYMMDD.gif`

**Note**: This workflow requires write permissions. Make sure your repository settings allow GitHub Actions to write to the repository. You may need to adjust permissions in Settings > Actions > General > Workflow permissions.

## Adding New Workflows

To add a new workflow:

1. Create a new `.yml` file in this directory
2. Follow the GitHub Actions workflow syntax
3. Test locally using [act](https://github.com/nektos/act) if desired
4. Commit and push to trigger

## Workflow Permissions

If workflows need to write to the repository:

1. Go to repository Settings
2. Navigate to Actions > General
3. Under "Workflow permissions", select "Read and write permissions"
4. Check "Allow GitHub Actions to create and approve pull requests"

## Troubleshooting

**Workflow fails to commit/push:**
- Check workflow permissions (see above)
- Ensure `GITHUB_TOKEN` has write access
- Verify git configuration in workflow

**Script errors:**
- Check Python version compatibility
- Verify all dependencies are in `requirements.txt`
- Review script output in Actions logs

**Schedule not running:**
- GitHub Actions schedules can be delayed
- Free tier has rate limits
- Check Actions tab for execution history

