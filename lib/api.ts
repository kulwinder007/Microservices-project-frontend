const API_BASE_URL = 'http://baackend123.aws.com:3000';

export async function fetchTasks() {
  const response = await fetch(`${API_BASE_URL}/tasks`);
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
}

export async function createTask(taskData: any) {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });
  if (!response.ok) throw new Error('Failed to create task');
  return response.json();
}

export async function updateTaskStatus(taskId: string, status: string) {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update task');
  return response.json();
}

export async function createUser(userData: { name: string; email: string; password: string }) {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  if (!response.ok) throw new Error('Failed to create user');
  return response.json();
}

export async function signIn(credentials: { email: string; password: string }) {
  const response = await fetch(`${API_BASE_URL}/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) throw new Error('Invalid credentials');
  return response.json();
}

export async function validateSession() {
  const token = localStorage.getItem('sessionToken');
  if (!token) return null;

  const response = await fetch(`${API_BASE_URL}/auth/validate`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('user');
    return null;
  }
  
  return response.json();
}