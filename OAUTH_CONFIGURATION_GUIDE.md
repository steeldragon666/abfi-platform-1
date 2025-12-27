# OAuth Configuration Guide for ABFI Platform

## Issue: Emissions Calculator Cannot Get API Login

The emissions calculator and all authenticated features require OAuth configuration. Currently, the platform shows the error:

```
OAuth configuration missing: VITE_OAUTH_PORTAL_URL or VITE_APP_ID not set
```

This prevents users from signing in and accessing protected features like the emissions calculator.

---

## Solution: Configure OAuth Environment Variables

### Option 1: Vercel Dashboard (Recommended for Production)

**Step 1:** Go to Vercel Project Settings
- Visit: https://vercel.com/one-483ce2d0/abfi-platform-1/settings/environment-variables

**Step 2:** Add Environment Variables
Add the following variables:

```
VITE_OAUTH_PORTAL_URL=<your_oauth_portal_url>
VITE_APP_ID=<your_app_id>
```

**Step 3:** Redeploy
- Vercel will automatically redeploy with the new environment variables
- Or manually trigger a redeploy from the Deployments tab

---

### Option 2: Local Development (.env file)

**Step 1:** Create/Update .env File
```bash
cd /path/to/abfi-platform-1
nano .env
```

**Step 2:** Add OAuth Configuration
```env
# OAuth Configuration
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com
VITE_APP_ID=your-app-id-here

# Database (if needed)
DATABASE_URL=mysql://user:password@host:3306/database

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
OAUTH_SERVER_URL=http://localhost:3000
```

**Step 3:** Restart Development Server
```bash
pnpm run dev
```

---

### Option 3: Mock Authentication (For Testing Only)

If you don't have OAuth credentials yet, you can implement a mock authentication system for testing:

**Step 1:** Create Mock Auth Context
```typescript
// client/src/_core/contexts/MockAuthContext.tsx
import { createContext, useContext, useState } from 'react';

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'grower' | 'developer' | 'financier' | 'admin';
}

const MockAuthContext = createContext<{
  user: MockUser | null;
  login: (role: string) => void;
  logout: () => void;
}>({
  user: null,
  login: () => {},
  logout: () => {},
});

export const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<MockUser | null>(null);

  const login = (role: string) => {
    setUser({
      id: 'mock-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: role as any,
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <MockAuthContext.Provider value={{ user, login, logout }}>
      {children}
    </MockAuthContext.Provider>
  );
};

export const useMockAuth = () => useContext(MockAuthContext);
```

**Step 2:** Update App.tsx to Use Mock Auth
```typescript
// Wrap your app with MockAuthProvider for testing
import { MockAuthProvider } from './_core/contexts/MockAuthContext';

// In your App component:
<MockAuthProvider>
  <YourAppContent />
</MockAuthProvider>
```

---

## Where to Get OAuth Credentials

### If Using Manus OAuth:
Contact Manus support at https://help.manus.im to get:
- OAuth Portal URL
- App ID
- Any additional configuration needed

### If Using Custom OAuth Provider:
You'll need to set up an OAuth 2.0 provider with:
- Authorization endpoint
- Token endpoint
- User info endpoint
- Client ID and Client Secret

### Popular OAuth Providers:
- **Auth0**: https://auth0.com
- **Supabase Auth**: https://supabase.com/docs/guides/auth
- **Firebase Auth**: https://firebase.google.com/docs/auth
- **Clerk**: https://clerk.com
- **NextAuth.js**: https://next-auth.js.org

---

## Testing Authentication

Once OAuth is configured:

**Step 1:** Visit the Platform
- Go to: https://abfi-platform-1.vercel.app

**Step 2:** Click "Sign In"
- Located in the sidebar at the bottom

**Step 3:** Complete OAuth Flow
- You should be redirected to the OAuth portal
- Sign in with your credentials
- Be redirected back to the platform

**Step 4:** Access Protected Features
- Navigate to: https://abfi-platform-1.vercel.app/emissions
- The calculator should now be accessible
- No more "Sign In to Continue" gate

---

## Verifying OAuth Configuration

### Check Environment Variables
```bash
# In Vercel dashboard
vercel env ls

# Or check in your .env file
cat .env | grep OAUTH
```

### Check Console for Errors
Open browser console (F12) and look for:
- ✅ No OAuth configuration warnings
- ✅ Successful authentication requests
- ❌ Any OAuth-related errors

### Test Authentication Flow
1. Click "Sign In"
2. Should redirect to OAuth portal
3. After login, should redirect back
4. User info should be displayed
5. Protected pages should be accessible

---

## Common Issues

### Issue: "OAuth configuration missing" still showing
**Solution:** 
- Verify environment variables are set correctly
- Ensure variable names start with `VITE_` for client-side access
- Redeploy after adding variables

### Issue: Redirect loop after login
**Solution:**
- Check `OAUTH_SERVER_URL` matches your deployment URL
- Verify redirect URLs are configured in OAuth provider
- Check for CORS issues

### Issue: "Invalid client ID"
**Solution:**
- Verify `VITE_APP_ID` is correct
- Check OAuth provider dashboard for correct client ID
- Ensure no extra spaces or quotes in environment variable

---

## Production Checklist

Before deploying to production with OAuth:

- [ ] OAuth credentials obtained from provider
- [ ] Environment variables added to Vercel
- [ ] Redirect URLs configured in OAuth provider
- [ ] Test authentication flow works
- [ ] Test protected pages are accessible
- [ ] Test logout functionality
- [ ] Verify user data is being saved correctly
- [ ] Check for any console errors
- [ ] Test on multiple browsers
- [ ] Test on mobile devices

---

## Security Best Practices

1. **Never commit OAuth credentials to git**
   - Use `.env` files (already in `.gitignore`)
   - Use Vercel environment variables for production

2. **Use HTTPS in production**
   - Vercel provides automatic HTTPS
   - Never use OAuth over HTTP

3. **Validate tokens server-side**
   - Don't trust client-side token validation
   - Verify tokens with OAuth provider

4. **Implement token refresh**
   - Handle expired tokens gracefully
   - Implement automatic token refresh

5. **Use secure session storage**
   - Don't store sensitive data in localStorage
   - Use httpOnly cookies when possible

---

## Support

If you need help configuring OAuth:

1. **Check Vercel Logs**
   - https://vercel.com/one-483ce2d0/abfi-platform-1/logs

2. **Check OAuth Provider Documentation**
   - Each provider has specific setup instructions

3. **Contact Manus Support**
   - https://help.manus.im
   - Provide error messages and screenshots

4. **Check Repository Issues**
   - https://github.com/steeldragon666/abfi-platform-1/issues

---

## Summary

To fix the "emissions calculator cant get API login" issue:

1. **Get OAuth credentials** from your OAuth provider (or Manus)
2. **Add environment variables** to Vercel project settings:
   - `VITE_OAUTH_PORTAL_URL`
   - `VITE_APP_ID`
3. **Redeploy** the application
4. **Test** the sign-in flow and calculator access

Once OAuth is configured, all authenticated features including the emissions calculator will work correctly.
