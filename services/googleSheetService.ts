
import { AppData, Employee, Office, Bank, BankBranch } from '../types';
import { GSHEET_API_URL } from '../constants';

export const syncService = {
  async fetchAllData(): Promise<AppData | null> {
    if (!GSHEET_API_URL) return null;
    try {
      const response = await fetch(GSHEET_API_URL);
      if (!response.ok) throw new Error('Failed to fetch from Google Sheets');
      return await response.json();
    } catch (error) {
      console.error('Error syncing with Google Sheets:', error);
      return null;
    }
  },

  async saveData(action: string, payload: any): Promise<boolean> {
    if (!GSHEET_API_URL) return true; // Fail silently if no URL (uses local only)
    try {
      const response = await fetch(GSHEET_API_URL, {
        method: 'POST',
        body: JSON.stringify({ action, payload }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      return false;
    }
  }
};
