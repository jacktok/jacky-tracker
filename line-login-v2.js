// Custom LINE Login v2 implementation
import fetch from 'node-fetch';

class LineLoginV2 {
  constructor(channelId, channelSecret, callbackUrl) {
    this.channelId = channelId;
    this.channelSecret = channelSecret;
    this.callbackUrl = callbackUrl;
    this.authUrl = 'https://access.line.me/oauth2/v2.1/authorize';
    this.tokenUrl = 'https://api.line.me/oauth2/v2.1/token';
    this.profileUrl = 'https://api.line.me/v2/profile';
  }

  getAuthUrl(state) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.channelId,
      redirect_uri: this.callbackUrl,
      state: state,
      scope: 'profile openid email'
    });
    
    return `${this.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code) {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.callbackUrl,
        client_id: this.channelId,
        client_secret: this.channelSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  async getUserProfile(accessToken) {
    const response = await fetch(this.profileUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Profile fetch failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  async getIdTokenUser(idToken) {
    // For LINE Login v2, we can also decode the ID token to get user info
    // This is more reliable than making an API call
    try {
      const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
      return {
        id: payload.sub,
        displayName: payload.name,
        pictureUrl: payload.picture,
        email: payload.email || null
      };
    } catch (error) {
      throw new Error('Failed to decode ID token');
    }
  }
}

export default LineLoginV2;
