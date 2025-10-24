import { api } from '@/lib/services/api';
import adminApiClient from '@/lib/services/adminApiClient';

// Get all knowledge base entries
export async function getKnowledgeBaseEntries(filters = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.isActive !== undefined) params.append('is_active', filters.isActive);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await api.get(`/knowledge-base?${params.toString()}`);
    return { data: response.data || [], error: null };
  } catch (error) {
    console.error('Error in getKnowledgeBaseEntries:', error);
    return { data: [], error };
  }
}

// Get single knowledge base entry
export async function getKnowledgeBaseEntry(id) {
  try {
    const data = await api.get(`/knowledge-base/${id}`);
    return { data, error: null };
  } catch (error) {
    console.error('Error in getKnowledgeBaseEntry:', error);
    return { data: null, error };
  }
}

// Create knowledge base entry
export async function createKnowledgeBaseEntry(entry) {
  try {
    const response = await adminApiClient.post('/knowledge-base', entry);
    return { data: response.data || response, error: null };
  } catch (error) {
    console.error('Error in createKnowledgeBaseEntry:', error);
    return { data: null, error };
  }
}

// Update knowledge base entry
export async function updateKnowledgeBaseEntry(id, updates) {
  try {
    const response = await adminApiClient.put(`/knowledge-base/${id}`, updates);
    return { data: response.data || response, error: null };
  } catch (error) {
    console.error('Error in updateKnowledgeBaseEntry:', error);
    return { data: null, error };
  }
}

// Delete knowledge base entry
export async function deleteKnowledgeBaseEntry(id) {
  try {
    await adminApiClient.delete(`/knowledge-base/${id}`);
    return { error: null };
  } catch (error) {
    console.error('Error in deleteKnowledgeBaseEntry:', error);
    return { error };
  }
}

// Toggle active status
export async function toggleKnowledgeBaseEntryStatus(id, isActive) {
  try {
    const response = await adminApiClient.put(`/knowledge-base/${id}`, { is_active: isActive });
    return { data: response.data || response, error: null };
  } catch (error) {
    console.error('Error in toggleKnowledgeBaseEntryStatus:', error);
    return { data: null, error };
  }
}

// Get knowledge base categories
export async function getKnowledgeBaseCategories() {
  try {
    const categories = await api.get('/knowledge-base/categories');
    return { data: categories, error: null };
  } catch (error) {
    console.error('Error in getKnowledgeBaseCategories:', error);
    return { data: [], error };
  }
}
