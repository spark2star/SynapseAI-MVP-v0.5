import { apiService } from '@/services/api';

export const symptomAPI = {
  /**
   * Search for symptoms (global + custom)
   */
  async search(query: string) {
    try {
      const response = await apiService.get('/intake/symptoms', {
        q: query,
        limit: 20
      });

      if (response.status === 'success' && response.data) {
        return response.data.symptoms || [];
      }

      return [];
    } catch (error) {
      console.error('Symptom search error:', error);
      throw error;
    }
  },

  /**
   * Get all custom symptoms for the current user
   */
  async getCustomSymptoms() {
    try {
      const response = await apiService.get('/intake/user_symptoms');

      if (response.status === 'success' && response.data) {
        return response.data.symptoms || [];
      }

      return [];
    } catch (error) {
      console.error('Get custom symptoms error:', error);
      throw error;
    }
  },

  /**
   * Create a new custom symptom
   */
  async createCustomSymptom(symptomData: {
    name: string;
    description?: string;
    categories?: string[];
  }) {
    try {
      const response = await apiService.post('/intake/user_symptoms', symptomData);

      if (response.status === 'success') {
        return response.data;
      }

      throw new Error('Failed to create custom symptom');
    } catch (error) {
      console.error('Create custom symptom error:', error);
      throw error;
    }
  },

  /**
   * Get symptom details by ID
   */
  async getSymptomById(symptomId: string) {
    try {
      const response = await apiService.get(`/intake/symptoms/${symptomId}`);

      if (response.status === 'success' && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Get symptom by ID error:', error);
      throw error;
    }
  },

  /**
   * Get all global symptoms (with pagination)
   */
  async getGlobalSymptoms(params?: {
    limit?: number;
    offset?: number;
    category?: string;
  }) {
    try {
      const response = await apiService.get('/intake/symptoms/global', params);

      if (response.status === 'success' && response.data) {
        return {
          symptoms: response.data.symptoms || [],
          total: response.data.total || 0,
          pagination: response.data.pagination
        };
      }

      return { symptoms: [], total: 0 };
    } catch (error) {
      console.error('Get global symptoms error:', error);
      throw error;
    }
  }
};
