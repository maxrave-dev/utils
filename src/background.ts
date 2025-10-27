// Background script for handling cookies extraction

// Type definitions for cookies
interface CookieResult {
  youtubeMusic?: Record<string, string>;
  spotify?: {
    sp_dc?: string;
  };
}

interface MessageRequest {
  action: string;
}

interface NetscapeResponse {
  netscapeFormat: string;
}

interface MessageResponse {
  success: boolean;
  data?: CookieResult | NetscapeResponse;
  error?: string;
}

// Function to get YouTube Music cookies
const getYouTubeMusicCookies = async (): Promise<Record<string, string>> => {
  // Try to get cookies from both domains since YouTube Music uses cookies from youtube.com
  const musicCookies = await chrome.cookies.getAll({
    domain: 'music.youtube.com'
  });
  
  const youtubeCookies = await chrome.cookies.getAll({
    domain: '.youtube.com'
  });
  
  const result: Record<string, string> = {};
  
  // Add cookies from music.youtube.com
  for (const cookie of musicCookies) {
    result[cookie.name] = cookie.value;
  }
  
  // Add cookies from .youtube.com
  for (const cookie of youtubeCookies) {
    result[cookie.name] = cookie.value;
  }

  return result;
};

// Function to get YouTube Music cookies in Netscape format
const getYouTubeMusicCookiesNetscape = async (): Promise<string> => {
  const musicCookies = await chrome.cookies.getAll({
    domain: 'music.youtube.com'
  });
  
  const youtubeCookies = await chrome.cookies.getAll({
    domain: '.youtube.com'
  });
  
  const allCookies = [...musicCookies, ...youtubeCookies];
  
  // Netscape cookie file format header
  let netscapeFormat = '# Netscape HTTP Cookie File\n';
  netscapeFormat += '# This is a generated file by SimpMusic Utils! Do not edit.\n\n';
  
  // Convert cookies to Netscape format
  for (const cookie of allCookies) {
    // Keep the domain as-is, preserving the leading dot if present
    const domain = cookie.domain;
    // The flag indicates if the cookie is valid for subdomains
    const includeSubdomains = cookie.domain.startsWith('.') ? 'TRUE' : 'FALSE';
    const path = cookie.path || '/';
    const secure = cookie.secure ? 'TRUE' : 'FALSE';
    const expires = cookie.expirationDate ? cookie.expirationDate.toString() : '0';
    
    netscapeFormat += `${domain}\t${includeSubdomains}\t${path}\t${secure}\t${expires}\t${cookie.name}\t${cookie.value}\n`;
  }
  
  return netscapeFormat;
};


// Function to get Spotify cookies (specifically sp_dc)
const getSpotifyCookies = async (): Promise<{ sp_dc?: string }> => {
  const cookies = await chrome.cookies.getAll({
    domain: '.spotify.com'
  });

  const result: { sp_dc?: string } = {};
  
  for (const cookie of cookies) {
    if (cookie.name === 'sp_dc') {
      result.sp_dc = cookie.value;
      break;
    }
  }

  return result;
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message: MessageRequest, sender: chrome.runtime.MessageSender, sendResponse: (response: MessageResponse) => void) => {
  // Handle YouTube Music cookies extraction
  if (message.action === 'getYouTubeMusicCookies') {
    (async () => {
      try {
        const youtubeMusic = await getYouTubeMusicCookies();
        
        const result: CookieResult = {
          youtubeMusic
        };
        
        sendResponse({ success: true, data: result });
      } catch (error) {
        console.error('Error extracting YouTube Music cookies:', error);
        sendResponse({ success: false, error: (error as Error).message });
      }
    })();
    
    // Return true to indicate that the response is sent asynchronously
    return true;
  }
  
  // Handle YouTube Music cookies extraction in Netscape format
  if (message.action === 'getYouTubeMusicCookiesNetscape') {
    (async () => {
      try {
        const netscapeFormat = await getYouTubeMusicCookiesNetscape();
        
        sendResponse({ success: true, data: { netscapeFormat } });
      } catch (error) {
        console.error('Error extracting YouTube Music cookies in Netscape format:', error);
        sendResponse({ success: false, error: (error as Error).message });
      }
    })();
    
    // Return true to indicate that the response is sent asynchronously
    return true;
  }
  
  // Handle Spotify cookies extraction
  if (message.action === 'getSpotifyCookies') {
    (async () => {
      try {
        const spotify = await getSpotifyCookies();
        
        const result: CookieResult = {
          spotify
        };
        
        sendResponse({ success: true, data: result });
      } catch (error) {
        console.error('Error extracting Spotify cookies:', error);
        sendResponse({ success: false, error: (error as Error).message });
      }
    })();
    
    // Return true to indicate that the response is sent asynchronously
    return true;
  }
  
  // Keep the old getCookies action for backward compatibility
  if (message.action === 'getCookies') {
    (async () => {
      try {
        const youtubeMusic = await getYouTubeMusicCookies();
        const spotify = await getSpotifyCookies();
        
        const result: CookieResult = {
          youtubeMusic,
          spotify
        };
        
        sendResponse({ success: true, data: result });
      } catch (error) {
        console.error('Error extracting cookies:', error);
        sendResponse({ success: false, error: (error as Error).message });
      }
    })();
    
    // Return true to indicate that the response is sent asynchronously
    return true;
  }
}); 