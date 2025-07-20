// Background script for handling cookies extraction

// Type definitions for cookies
interface CookieResult {
  youtubeMusic?: Record<string, string>;
  spotify?: {
    sp_dc?: string;
  };
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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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