# 📋 GitHub SSH Authentication - Setup Guide

## Current Status

✅ SSH key pair generated locally
✅ Git remote configured for SSH
⚠️ **Public key NOT yet added to GitHub** (needed)

## Your Public SSH Key

**Copy this entire key:**

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKxrRI1PQqeqmv8JC5hvstl0BLdOYtaHeGP3LcH46GO+ facial-attendance-v2@binus.ac.id
```

## Step-by-Step: Add Key to GitHub

### 1. Open GitHub SSH Settings
Go to: **https://github.com/settings/keys**

Or navigate manually:
- Click your profile picture (top right)
- Select "Settings"
- Click "SSH and GPG keys" (left sidebar)

### 2. Click "New SSH key"

### 3. Fill in the Form
- **Title**: `Facial Attendance V2 - SSH Key`
- **Key type**: `Authentication Key` (default)
- **Key**: Paste the public key above (entire key, one line)

### 4. Click "Add SSH key"
- GitHub will ask for password confirmation
- Enter your GitHub account password

### 5. Verify Success
Open terminal and run:
```bash
ssh -T git@github.com
```

Expected response:
```
Hi BINUS-Simprug-AI-Club! You've successfully authenticated, but GitHub does not provide shell access.
```

## After Adding SSH Key: Push Your Code

Once the key is added and verified, run:

```bash
cd /home/pandora/facial-attendance-v2
git push origin main
```

This will upload:
- ✅ Face cropping implementation
- ✅ All documentation (4 files)
- ✅ Updated dependencies
- ✅ All commits (5 new commits)

## Key Information

| Item | Value |
|------|-------|
| **Key Type** | ED25519 (secure) |
| **Location** | `~/.ssh/id_ed25519` |
| **Repository** | BINUS-Simprug-AI-Club/facial-attendance-v2 |
| **Branch** | main |

## Troubleshooting

### "Permission denied (publickey)" when pushing
**Solution:**
1. Make sure SSH key is added to GitHub
2. Wait 1-2 minutes for GitHub to sync
3. Verify: `ssh -T git@github.com`
4. Try push again

### Key not appearing in SSH settings
**Solution:**
1. Copy the entire key (no spaces at start/end)
2. Paste into GitHub key field
3. Verify key size: should be ~80 characters long
4. Make sure key type is "Authentication Key"

### Multiple GitHub accounts
**Solution:**
1. You may need different keys per account
2. Current key is configured for:
   - **Account**: BINUS-Simprug-AI-Club
   - **Repository**: facial-attendance-v2

## What Happens After Push

1. ✅ Code pushed to GitHub
2. ✅ GitHub stores your commits
3. ✅ Vercel detects new commits (if connected)
4. ✅ Vercel auto-builds and deploys
5. ✅ New URL with face cropping live

## Timeline

```
Now              Add SSH key to GitHub      Push code           Vercel deploys
 |                    |                        |                    |
 |------- 2 min ------| -------- 1 min ------- | ----- 3-5 min ---- |
                      
⚠️ Waiting             ✅ Ready to push         🚀 Uploading         ✨ Live!
```

## Quick Reference

**Add SSH Key** (2 minutes):
1. Go to https://github.com/settings/keys
2. New SSH key
3. Paste key from above
4. Click Add

**Verify** (30 seconds):
```bash
ssh -T git@github.com
```

**Push Code** (1 minute):
```bash
cd /home/pandora/facial-attendance-v2
git push origin main
```

---

**Next Action**: Add SSH key to GitHub, then verify with `ssh -T git@github.com`
