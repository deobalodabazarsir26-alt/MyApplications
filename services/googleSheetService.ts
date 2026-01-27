
import { AppData } from '../types';
import { GSHEET_API_URL } from '../constants';

export const syncService = {
  async fetchAllData(): Promise<AppData | null> {
    if (!GSHEET_API_URL) return null;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // Increased to 60s for slow GAS instances

    try {
      const response = await fetch(GSHEET_API_URL, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      return await response.json();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Fetch request timed out after 60 seconds');
      } else {
        console.error('Error fetching data from cloud:', error);
      }
      return null;
    }
  },

  async saveData(action: string, payload: any): Promise<{success: boolean, error?: string}> {
    if (!GSHEET_API_URL) return { success: true };
    
    // We increase timeout for POST requests too, as scripts can take time to process
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(GSHEET_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, payload }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      if (result.status === 'error') {
        return { success: false, error: result.message };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Error saving to cloud:', error);
      const message = error.name === 'AbortError' ? 'Request timed out (60s)' : (error instanceof Error ? error.message : 'Network error');
      return { success: false, error: message };
    }
  }
};
