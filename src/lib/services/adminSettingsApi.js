/**
 * Admin Settings API Service
 * Handles all admin settings operations including settings, collections, and user management
 */

import { api } from './api';
import adminApiClient from './adminApiClient';

// Settings API
export const adminSettingsApi = {
  // Get settings (use admin token so backend can require auth later)
  async getSettings() {
    const res = await adminApiClient.get('/admin/settings');
    return res?.data ?? res;
  },

  // Update settings (use admin token for authenticated request)
  async updateSettings(settingsData) {
    const res = await adminApiClient.put('/admin/settings', settingsData);
    return res?.data ?? res;
  },

  // Get collections
  async getCollections() {
    return await api.get('/collections');
  },

  // Create collection
  async createCollection(collectionData) {
    return await api.post('/collections', collectionData);
  },

  // Update collection
  async updateCollection(id, collectionData) {
    return await api.put(`/collections/${id}`, collectionData);
  },

  // Delete collection
  async deleteCollection(id) {
    return await api.delete(`/collections/${id}`);
  },

  // Bulk update collections
  async bulkUpdateCollections(collections) {
    // Delete all existing collections first
    const existingCollections = await this.getCollections();
    if (existingCollections.collections) {
      for (const collection of existingCollections.collections) {
        await this.deleteCollection(collection.id);
      }
    }

    // Insert new collections
    const collectionsToSave = collections.map((collection, index) => ({
      name: collection.name,
      description: collection.description,
      image_url: collection.image_url,
      slug: collection.slug,
      is_active: collection.is_active,
      sort_order: index + 1
    }));

    const results = [];
    for (const collectionData of collectionsToSave) {
      const result = await this.createCollection(collectionData);
      results.push(result);
    }

    return { success: true, collections: results };
  },

  // Get admin users
  async getUsers() {
    return await api.get('/admin/users');
  },

  // Create admin user
  async createUser(userData) {
    return await api.post('/admin/users', userData);
  },

  // Delete admin user
  async deleteUser(userId) {
    return await api.delete(`/admin/users/${userId}`);
  },

  // Update user password
  async updateUserPassword(userId, newPassword) {
    return await api.put(`/admin/users/${userId}/password`, { newPassword });
  }
};

export default adminSettingsApi;
