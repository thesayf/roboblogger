"use client";

import { useState, useEffect } from 'react';
import { Key, Plus, Copy, Trash2, Check, AlertCircle, Clock, Activity, ChevronLeft, Code } from 'lucide-react';
import Link from 'next/link';

interface ApiKey {
  _id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  rateLimit: number;
  requestCount: number;
  lastUsedAt?: string;
  createdAt: string;
  isActive: boolean;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // New key form
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Newly created key (shown once)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete confirmation
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const response = await fetch('/api/keys');
      const data = await response.json();
      if (response.ok) {
        setKeys(data.keys);
      } else {
        setError(data.error || 'Failed to fetch API keys');
      }
    } catch (err) {
      setError('Failed to fetch API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const createKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setIsCreating(true);
    setError('');

    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setNewlyCreatedKey(data.rawKey);
        setNewKeyName('');
        setShowNewKeyForm(false);
        fetchKeys(); // Refresh the list
      } else {
        setError(data.error || 'Failed to create API key');
      }
    } catch (err) {
      setError('Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/keys?id=${keyId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setKeys(keys.filter(k => k._id !== keyId));
        setDeletingKeyId(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete API key');
      }
    } catch (err) {
      setError('Failed to delete API key');
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/blog/admin"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">API Keys</h1>
            <p className="text-slate-400 mt-1">
              Manage API keys to access your blog content from external applications
            </p>
          </div>
          <button
            onClick={() => setShowNewKeyForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Generate Key
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">
            &times;
          </button>
        </div>
      )}

      {/* Newly created key banner */}
      {newlyCreatedKey && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-emerald-400 font-medium mb-2">
                API Key Created Successfully!
              </p>
              <p className="text-slate-400 text-sm mb-3">
                Copy this key now. For security reasons, it won&apos;t be shown again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-slate-800 rounded-lg text-sm text-slate-200 font-mono overflow-x-auto">
                  {newlyCreatedKey}
                </code>
                <button
                  onClick={() => copyToClipboard(newlyCreatedKey)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-300" />
                  )}
                </button>
              </div>
            </div>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="text-slate-400 hover:text-slate-300"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* New key form */}
      {showNewKeyForm && (
        <div className="mb-6 p-4 bg-slate-800/50 border border-white/10 rounded-lg">
          <form onSubmit={createKey} className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Key Name
              </label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production, Development, My Website"
                className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                disabled={isCreating}
              />
            </div>
            <button
              type="submit"
              disabled={isCreating || !newKeyName.trim()}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isCreating ? 'Creating...' : 'Create Key'}
            </button>
            <button
              type="button"
              onClick={() => setShowNewKeyForm(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* API Keys list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/30 border border-white/10 rounded-lg">
          <Key className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No API Keys</h3>
          <p className="text-slate-400 mb-4">
            Generate an API key to access your blog content from external applications.
          </p>
          <button
            onClick={() => setShowNewKeyForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Generate Your First Key
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {keys.map((key) => (
            <div
              key={key._id}
              className="p-4 bg-slate-800/30 border border-white/10 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Key className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{key.name}</h3>
                    <code className="text-sm text-slate-400 font-mono">{key.keyPrefix}</code>
                  </div>
                </div>

                {deletingKeyId === key._id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">Delete this key?</span>
                    <button
                      onClick={() => deleteKey(key._id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-sm rounded transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeletingKeyId(null)}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeletingKeyId(key._id)}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="mt-4 flex items-center gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Created {formatDate(key.createdAt)}
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  {key.requestCount.toLocaleString()} requests
                </div>
                {key.lastUsedAt && (
                  <div>Last used {formatDate(key.lastUsedAt)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Usage documentation */}
      <div className="mt-8 p-6 bg-slate-800/30 border border-white/10 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <Code className="w-5 h-5 text-violet-400" />
          <h3 className="font-medium text-white">API Usage</h3>
        </div>

        <p className="text-slate-400 text-sm mb-4">
          Use your API key to fetch blog posts from your application:
        </p>

        <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-slate-300">
            <code>{`// Fetch all published posts
const response = await fetch('https://roboblogger.vercel.app/api/v1/posts', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});
const { posts } = await response.json();

// Fetch a single post by slug
const response = await fetch('https://roboblogger.vercel.app/api/v1/posts/my-post-slug', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});
const { post } = await response.json();`}</code>
          </pre>
        </div>

        <div className="mt-4 text-sm text-slate-400">
          <p><strong className="text-slate-300">Rate Limit:</strong> 1,000 requests per hour</p>
          <p className="mt-1"><strong className="text-slate-300">Available Endpoints:</strong></p>
          <ul className="mt-2 space-y-1 ml-4">
            <li><code className="text-violet-400">GET /api/v1/posts</code> - List published posts</li>
            <li><code className="text-violet-400">GET /api/v1/posts/:slug</code> - Get post by slug</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
