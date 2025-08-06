import * as React from 'react';
import { Task, Comment } from 'frontend/types';
import { TaskService } from 'frontend/services';
import { useAccountContext } from 'frontend/contexts';

const taskService = new TaskService();

type CommentsState = {
  [taskId: string]: {
    loading: boolean;
    error: string | null;
    comments: Comment[];
    editingId: string | null;
    editContent: string;
    submitting: boolean;
  };
};

const Tasks: React.FC = () => {
  const { accountDetails, isAccountLoading } = useAccountContext();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ title: '', description: '' });
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState({ title: '', description: '' });
  const [submitting, setSubmitting] = React.useState(false);
  const [commentForms, setCommentForms] = React.useState<{ [taskId: string]: string }>({});
  const [commentSubmitting, setCommentSubmitting] = React.useState<{ [taskId: string]: boolean }>({});
  const [commentSuccess, setCommentSuccess] = React.useState<{ [taskId: string]: boolean }>({});
  const [commentsState, setCommentsState] = React.useState<CommentsState>({});

  const fetchTasks = React.useCallback(() => {
    if (!accountDetails?.id) return;
    setLoading(true);
    setError(null);
    taskService
      .listTasks(accountDetails.id)
      .then(setTasks)
      .catch((err) => setError(err.message || 'Failed to load tasks'))
      .finally(() => setLoading(false));
  }, [accountDetails?.id]);

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Fetch comments for a task
  const fetchComments = async (taskId: string) => {
    setCommentsState((prev) => ({
      ...prev,
      [taskId]: {
        ...(prev[taskId] || {}),
        loading: true,
        error: null,
        comments: prev[taskId]?.comments || [],
        editingId: null,
        editContent: '',
        submitting: false,
      },
    }));
    try {
      const comments = await taskService.getComments(taskId);
      setCommentsState((prev) => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          loading: false,
          comments,
          error: null,
        },
      }));
    } catch (err: any) {
      setCommentsState((prev) => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          loading: false,
          error: err.message || 'Failed to load comments',
        },
      }));
    }
  };

  // Fetch comments for all tasks on mount or when tasks change
  React.useEffect(() => {
    tasks.forEach((task) => {
      fetchComments(task.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountDetails?.id) return;
    setSubmitting(true);
    try {
      await taskService.createTask(accountDetails.id, form);
      setForm({ title: '', description: '' });
      fetchTasks();
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingId(task.id);
    setEditForm({ title: task.title, description: task.description });
  };

  const handleUpdate = async (taskId: string) => {
    if (!accountDetails?.id) return;
    setSubmitting(true);
    try {
      await taskService.updateTask(accountDetails.id, taskId, editForm);
      setEditingId(null);
      fetchTasks();
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!accountDetails?.id) return;
    setSubmitting(true);
    try {
      await taskService.deleteTask(accountDetails.id, taskId);
      fetchTasks();
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentInputChange = (taskId: string, value: string) => {
    setCommentForms((prev) => ({ ...prev, [taskId]: value }));
    setCommentSuccess((prev) => ({ ...prev, [taskId]: false }));
  };

  const handleAddComment = async (taskId: string) => {
    const content = commentForms[taskId];
    if (!content) return;
    setCommentSubmitting((prev) => ({ ...prev, [taskId]: true }));
    setCommentSuccess((prev) => ({ ...prev, [taskId]: false }));
    try {
      await taskService.addComment(taskId, content);
      setCommentForms((prev) => ({ ...prev, [taskId]: '' }));
      setCommentSuccess((prev) => ({ ...prev, [taskId]: true }));
      fetchComments(taskId);
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  // Comment CRUD
  const handleEditComment = (taskId: string, comment: Comment) => {
    setCommentsState((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        editingId: comment.id,
        editContent: comment.content,
      },
    }));
  };

  const handleUpdateComment = async (taskId: string, commentId: string) => {
    const content = commentsState[taskId]?.editContent;
    if (!content) return;
    setCommentsState((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        submitting: true,
      },
    }));
    try {
      await taskService.updateComment(commentId, content);
      setCommentsState((prev) => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          editingId: null,
          editContent: '',
        },
      }));
      fetchComments(taskId);
    } catch (err: any) {
      setError(err.message || 'Failed to update comment');
    } finally {
      setCommentsState((prev) => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          submitting: false,
        },
      }));
    }
  };

  const handleDeleteComment = async (taskId: string, commentId: string) => {
    setCommentsState((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        submitting: true,
      },
    }));
    try {
      await taskService.deleteComment(commentId);
      fetchComments(taskId);
    } catch (err: any) {
      setError(err.message || 'Failed to delete comment');
    } finally {
      setCommentsState((prev) => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          submitting: false,
        },
      }));
    }
  };

  if (isAccountLoading || loading) return <div>Loading tasks...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h2 style={{ marginBottom: 24 }}>Tasks</h2>
      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleInputChange}
          required
          disabled={submitting}
          style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <input
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleInputChange}
          required
          disabled={submitting}
          style={{ flex: 2, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <button type="submit" disabled={submitting || !form.title || !form.description} style={{ padding: '8px 16px', borderRadius: 4, background: '#2d6cdf', color: '#fff', border: 'none' }}>
          Add Task
        </button>
      </form>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001' }}>
        <thead>
          <tr style={{ background: '#f5f6fa' }}>
            <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #eee' }}>Title</th>
            <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #eee' }}>Description</th>
            <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #eee' }}>Actions</th>
            <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #eee' }}>Comments</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: 24 }}>No tasks found.</td>
            </tr>
          ) : (
            tasks.map((task) => (
              <tr key={task.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 12 }}>
                  {editingId === task.id ? (
                    <input
                      name="title"
                      value={editForm.title}
                      onChange={handleEditInputChange}
                      required
                      disabled={submitting}
                      style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', width: '100%' }}
                    />
                  ) : (
                    <strong>{task.title}</strong>
                  )}
                </td>
                <td style={{ padding: 12 }}>
                  {editingId === task.id ? (
                    <input
                      name="description"
                      value={editForm.description}
                      onChange={handleEditInputChange}
                      required
                      disabled={submitting}
                      style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', width: '100%' }}
                    />
                  ) : (
                    task.description
                  )}
                </td>
                <td style={{ padding: 12 }}>
                  {editingId === task.id ? (
                    <>
                      <button onClick={() => handleUpdate(task.id)} disabled={submitting} style={{ marginRight: 8, padding: '6px 12px', borderRadius: 4, background: '#2d6cdf', color: '#fff', border: 'none' }}>
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} disabled={submitting} style={{ padding: '6px 12px', borderRadius: 4, background: '#eee', color: '#333', border: 'none' }}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(task)} style={{ marginRight: 8, padding: '6px 12px', borderRadius: 4, background: '#2d6cdf', color: '#fff', border: 'none' }} disabled={submitting}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(task.id)} style={{ padding: '6px 12px', borderRadius: 4, background: '#e74c3c', color: '#fff', border: 'none' }} disabled={submitting}>
                        Delete
                      </button>
                    </>
                  )}
                </td>
                <td style={{ padding: 12, minWidth: 320 }}>
                  {/* Add Comment Form */}
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      handleAddComment(task.id);
                    }}
                    style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}
                  >
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentForms[task.id] || ''}
                      onChange={e => handleCommentInputChange(task.id, e.target.value)}
                      style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                      disabled={commentSubmitting[task.id]}
                    />
                    <button
                      type="submit"
                      disabled={commentSubmitting[task.id] || !(commentForms[task.id] && commentForms[task.id].trim())}
                      style={{ padding: '6px 12px', borderRadius: 4, background: '#27ae60', color: '#fff', border: 'none' }}
                    >
                      Add
                    </button>
                  </form>
                  {commentSuccess[task.id] && <span style={{ color: '#27ae60', fontSize: 12 }}>Comment added!</span>}
                  {/* Comments List */}
                  <div style={{ marginTop: 8 }}>
                    {commentsState[task.id]?.loading ? (
                      <div style={{ fontSize: 13, color: '#888' }}>Loading comments...</div>
                    ) : commentsState[task.id]?.error ? (
                      <div style={{ color: 'red', fontSize: 13 }}>{commentsState[task.id]?.error}</div>
                    ) : commentsState[task.id]?.comments?.length === 0 ? (
                      <div style={{ fontSize: 13, color: '#888' }}>No comments yet.</div>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {commentsState[task.id]?.comments.map((comment) => (
                          <li key={comment.id} style={{ marginBottom: 6, background: '#f8f8fa', borderRadius: 4, padding: '6px 10px', display: 'flex', alignItems: 'center' }}>
                            {commentsState[task.id]?.editingId === comment.id ? (
                              <>
                                <input
                                  value={commentsState[task.id]?.editContent}
                                  onChange={e => setCommentsState(prev => ({
                                    ...prev,
                                    [task.id]: {
                                      ...prev[task.id],
                                      editContent: e.target.value,
                                    },
                                  }))}
                                  style={{ flex: 1, padding: 6, borderRadius: 4, border: '1px solid #ccc', marginRight: 8 }}
                                  disabled={commentsState[task.id]?.submitting}
                                />
                                <button onClick={() => handleUpdateComment(task.id, comment.id)} disabled={commentsState[task.id]?.submitting} style={{ marginRight: 4, padding: '4px 10px', borderRadius: 4, background: '#2d6cdf', color: '#fff', border: 'none', fontSize: 12 }}>
                                  Save
                                </button>
                                <button onClick={() => setCommentsState(prev => ({ ...prev, [task.id]: { ...prev[task.id], editingId: null, editContent: '' } }))} disabled={commentsState[task.id]?.submitting} style={{ padding: '4px 10px', borderRadius: 4, background: '#eee', color: '#333', border: 'none', fontSize: 12 }}>
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <span style={{ flex: 1 }}>{comment.content}</span>
                                <button onClick={() => handleEditComment(task.id, comment)} style={{ marginRight: 4, padding: '4px 10px', borderRadius: 4, background: '#2d6cdf', color: '#fff', border: 'none', fontSize: 12 }} disabled={commentsState[task.id]?.submitting}>
                                  Edit
                                </button>
                                <button onClick={() => handleDeleteComment(task.id, comment.id)} style={{ padding: '4px 10px', borderRadius: 4, background: '#e74c3c', color: '#fff', border: 'none', fontSize: 12 }} disabled={commentsState[task.id]?.submitting}>
                                  Delete
                                </button>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Tasks;