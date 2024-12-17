import axios from 'axios';
import { Tool, ToolCreate } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

export const toolsApi = {
    getTools: async (): Promise<Tool[]> => {
        try {
            const response = await axios.get<Tool[]>(`${API_BASE_URL}/tools`);
            return response.data;
        } catch (error) {
            console.error('Get Tools Error:', error);
            throw error;
        }
    },

    createTool: async (tool: ToolCreate): Promise<Tool> => {
        try {
            const response = await axios.post<Tool>(`${API_BASE_URL}/tools`, tool);
            return response.data;
        } catch (error) {
            console.error('Create Tool Error:', error);
            throw error;
        }
    },

    updateTool: async (id: number, tool: Partial<ToolCreate>): Promise<Tool> => {
        try {
            const response = await axios.put<Tool>(`${API_BASE_URL}/tools/${id}`, tool);
            return response.data;
        } catch (error) {
            console.error('Update Tool Error:', error);
            throw error;
        }
    },

    deleteTool: async (id: number): Promise<void> => {
        try {
            await axios.delete(`${API_BASE_URL}/tools/${id}`);
        } catch (error) {
            console.error('Delete Tool Error:', error);
            throw error;
        }
    },

    toggleTool: async (id: number): Promise<Tool> => {
        try {
            const response = await axios.post<Tool>(`${API_BASE_URL}/tools/${id}/toggle`);
            return response.data;
        } catch (error) {
            console.error('Toggle Tool Error:', error);
            throw error;
        }
    }
};