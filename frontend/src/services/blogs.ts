const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const getBlogs = async (token: string) => {
  return fetch(`${BASE_URL}/blogs`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const getBlogById = async (id: number | string, token: string) => {
  return fetch(`${BASE_URL}/blogs/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const generateBlog = async (
  options: {
    topic: string;
    tone?: string;
    audience?: string;
    depth?: string;
    reference_urls?: string;
    model_name?: string;
  }, 
  token: string
) => {
  return fetch(`${BASE_URL}/blogs/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(options)
  });
};

export const updateBlogContent = async (id: number | string, content: string, token: string) => {
  return fetch(`${BASE_URL}/blogs/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ markdown_content: content })
  });
};

export const regenerateBlogSelection = async (blogId: number, data: { selected_text: string; prompt: string; model_name: string; full_text: string }, token: string) => {
  return fetch(`${BASE_URL}/blogs/${blogId}/regenerate-selection`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
};

export const publishBlog = async (blogId: number, platform: string, token: string) => {
  return fetch(`${BASE_URL}/blogs/${blogId}/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ platform })
  });
};

export const promoteOnLinkedIn = async (blogId: number, token: string) => {
  return fetch(`${BASE_URL}/blogs/${blogId}/promote/linkedin`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

export const deleteBlog = async (id: number | string, token: string) => {
  return fetch(`${BASE_URL}/blogs/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const updateBlogTitle = async (id: number | string, title: string, token: string) => {
  return fetch(`${BASE_URL}/blogs/${id}/title`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title })
  });
};

export const getStreamUrl = (id: number | string, token: string) => {
  return `${BASE_URL}/blogs/stream/${id}?token=${token}`;
};
