/// <reference types="chrome"/>

// Type definitions
interface CookieResult {
  youtubeMusic?: Record<string, string>;
  spotify?: {
    sp_dc?: string;
  };
}

interface NetscapeResponse {
  netscapeFormat: string;
}

interface MessageResponse {
  success: boolean;
  data?: CookieResult | NetscapeResponse;
  error?: string;
}

// DOM Elements
const extractYTMusicBtn = document.getElementById('extract-youtube-music') as HTMLButtonElement;
const copyYTMusicBtn = document.getElementById('copy-youtube-music') as HTMLButtonElement;
const ytMusicResult = document.getElementById('youtube-music-result') as HTMLTextAreaElement;
const formatSelect = document.getElementById('format-select') as HTMLSelectElement;

const extractSpotifyBtn = document.getElementById('extract-spotify') as HTMLButtonElement;
const copySpotifyBtn = document.getElementById('copy-spotify') as HTMLButtonElement;
const spotifyResult = document.getElementById('spotify-result') as HTMLTextAreaElement;

const statusEl = document.getElementById('status') as HTMLDivElement;

// Helper function to display status messages
const showStatus = (message: string, isError = false) => {
  statusEl.textContent = message;
  statusEl.className = isError ? 'status error' : 'status success';
  
  setTimeout(() => {
    statusEl.textContent = '';
    statusEl.className = 'status';
  }, 3000);
};

// Convert cookies object to string format
const formatCookiesAsString = (cookies: Record<string, string>): string => {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
};

// Function to extract YouTube Music cookies
const extractYouTubeMusicCookies = () => {
  ytMusicResult.value = 'Loading...';
  const selectedFormat = formatSelect.value;
  
  const action = selectedFormat === 'netscape' ? 'getYouTubeMusicCookiesNetscape' : 'getYouTubeMusicCookies';
  
  chrome.runtime.sendMessage({ action }, (response: MessageResponse) => {
    if (chrome.runtime.lastError) {
      showStatus(`Error: ${chrome.runtime.lastError.message}`, true);
      return;
    }

    if (response.success && response.data) {
      if (selectedFormat === 'netscape') {
        // Type guard for NetscapeResponse
        if ('netscapeFormat' in response.data) {
          const netscapeData = response.data as NetscapeResponse;
          if (netscapeData.netscapeFormat) {
            ytMusicResult.value = netscapeData.netscapeFormat;
            copyYTMusicBtn.disabled = false;
            showStatus('YouTube Music cookies extracted in Netscape format!');
          } else {
            ytMusicResult.value = 'No YouTube Music cookies found';
          }
        } else {
          ytMusicResult.value = 'Invalid response format';
        }
      } else {
        // Type guard for CookieResult
        if ('youtubeMusic' in response.data) {
          const cookieData = response.data as CookieResult;
          if (cookieData.youtubeMusic && Object.keys(cookieData.youtubeMusic).length > 0) {
            ytMusicResult.value = formatCookiesAsString(cookieData.youtubeMusic);
            copyYTMusicBtn.disabled = false;
            showStatus('YouTube Music cookies extracted successfully!');
          } else {
            ytMusicResult.value = 'No YouTube Music cookies found';
          }
        } else {
          ytMusicResult.value = 'Invalid response format';
        }
      }
    } else {
      ytMusicResult.value = '';
      showStatus(`Failed to extract YouTube Music cookies: ${response.error}`, true);
    }
  });
};

// Function to extract Spotify cookies only
const extractSpotifyCookies = () => {
  spotifyResult.value = 'Loading...';
  chrome.runtime.sendMessage({ action: 'getSpotifyCookies' }, (response: MessageResponse) => {
    if (chrome.runtime.lastError) {
      showStatus(`Error: ${chrome.runtime.lastError.message}`, true);
      return;
    }

    if (response.success && response.data) {
      // Type guard for CookieResult with spotify
      if ('spotify' in response.data) {
        const cookieData = response.data as CookieResult;
        const spotifySpDc = cookieData.spotify?.sp_dc;
        if (spotifySpDc) {
          spotifyResult.value = spotifySpDc;
          copySpotifyBtn.disabled = false;
          showStatus('Spotify cookies extracted successfully!');
        } else {
          spotifyResult.value = 'sp_dc cookie not found';
        }
      } else {
        spotifyResult.value = 'Invalid response format';
      }
    } else {
      spotifyResult.value = '';
      showStatus(`Failed to extract Spotify cookies: ${response.error}`, true);
    }
  });
};

// Copy text to clipboard function
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy: ', err);
    return false;
  }
};

// Event listeners
extractYTMusicBtn.addEventListener('click', extractYouTubeMusicCookies);
extractSpotifyBtn.addEventListener('click', extractSpotifyCookies);

// Clear result when format changes
formatSelect.addEventListener('change', () => {
  ytMusicResult.value = '';
  copyYTMusicBtn.disabled = true;
});

copyYTMusicBtn.addEventListener('click', async () => {
  const success = await copyToClipboard(ytMusicResult.value);
  showStatus(success ? 'YouTube Music cookies copied!' : 'Failed to copy', !success);
});

copySpotifyBtn.addEventListener('click', async () => {
  const success = await copyToClipboard(spotifyResult.value);
  showStatus(success ? 'Spotify cookie copied!' : 'Failed to copy', !success);
});

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
  // Reset UI
  ytMusicResult.value = '';
  spotifyResult.value = '';
  copyYTMusicBtn.disabled = true;
  copySpotifyBtn.disabled = true;
}); 