import APIService from 'frontend/services/api.service';
import { Task, Comment } from 'frontend/types';

export default class TaskService extends APIService {
  async listTasks(accountId: string): Promise<Task[]> {
    const response = await this.apiClient.get(`/accounts/${accountId}/tasks`);
    return response.data.items;
  }

  async createTask(accountId: string, data: { title: string; description: string }): Promise<Task> {
    const response = await this.apiClient.post(`/accounts/${accountId}/tasks`, data);
    return response.data;
  }

  async updateTask(accountId: string, taskId: string, data: { title: string; description: string }): Promise<Task> {
    const response = await this.apiClient.put(`/accounts/${accountId}/tasks/${taskId}`, data);
    return response.data;
  }

  async deleteTask(accountId: string, taskId: string): Promise<void> {
    await this.apiClient.delete(`/accounts/${accountId}/tasks/${taskId}`);
  }

  async addComment(taskId: string, content: string): Promise<Comment> {
    const response = await this.apiClient.post(`/tasks/${taskId}/comments`, { content });
    return response.data;
  }

  async getComments(taskId: string): Promise<Comment[]> {
    const response = await this.apiClient.get(`/tasks/${taskId}/comments`);
    return response.data.items || response.data;
  }

  async updateComment(commentId: string, content: string): Promise<Comment> {
    const response = await this.apiClient.put(`/comments/${commentId}`, { content });
    return response.data;
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.apiClient.delete(`/comments/${commentId}`);
  }
}