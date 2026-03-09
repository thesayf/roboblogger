"use client";

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

function parseGoogleUrl(url: string): { id: string; type: "google_doc" | "google_sheet"; mimeType: string } | null {
  try {
    // Match Google Docs: https://docs.google.com/document/d/XXXX/...
    const docMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (docMatch) {
      return { id: docMatch[1], type: "google_doc", mimeType: "application/vnd.google-apps.document" };
    }
    // Match Google Sheets: https://docs.google.com/spreadsheets/d/XXXX/...
    const sheetMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (sheetMatch) {
      return { id: sheetMatch[1], type: "google_sheet", mimeType: "application/vnd.google-apps.spreadsheet" };
    }
    return null;
  } catch {
    return null;
  }
}

function loadGooglePickerScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.gapi) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google API"));
    document.head.appendChild(script);
  });
}

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Sheet,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  Unlink,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Link,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface LinkedDoc {
  id: string;
  name: string;
  type: "google_doc" | "google_sheet";
  googleId: string;
  googleUrl: string;
  metadata?: { title?: string; sheetNames?: string[] };
  lastAccessedAt?: string;
  createdAt: string;
}

interface GoogleStatus {
  connected: boolean;
  email?: string;
  connectedAt?: string;
}

export function DocumentsTab() {
  const searchParams = useSearchParams();
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null);
  const [documents, setDocuments] = useState<LinkedDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState<"google_doc" | "google_sheet">("google_doc");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  // Check for google=connected param from OAuth callback
  useEffect(() => {
    if (searchParams.get("google") === "connected") {
      setSuccessMsg("Google account connected successfully!");
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete("google");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, []);

  // Auto-clear messages
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [statusRes, docsRes] = await Promise.all([
        fetch("/api/integrations/google/status"),
        fetch("/api/documents"),
      ]);

      if (statusRes.ok) {
        setGoogleStatus(await statusRes.json());
      }
      if (docsRes.ok) {
        const data = await docsRes.json();
        setDocuments(data.documents || []);
      }
    } catch {
      setError("Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }

  function connectGoogle() {
    setIsConnecting(true);
    window.location.href = "/api/integrations/google/auth";
  }

  async function disconnectGoogle() {
    if (!confirm("Disconnect Google? All linked documents will be removed.")) return;
    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/integrations/google/disconnect", { method: "DELETE" });
      if (res.ok) {
        setGoogleStatus({ connected: false });
        setDocuments([]);
        setSuccessMsg("Google disconnected");
      } else {
        setError("Failed to disconnect");
      }
    } catch {
      setError("Failed to disconnect");
    } finally {
      setIsDisconnecting(false);
    }
  }

  async function createDocument() {
    if (!createName.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim(), type: createType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create document");
        return;
      }
      setDocuments((prev) => [data, ...prev]);
      setShowCreateDialog(false);
      setCreateName("");
      setSuccessMsg(`Created "${data.name}"`);
    } catch {
      setError("Failed to create document");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function openPicker() {
    setIsPickerLoading(true);
    setError(null);
    try {
      // Get access token from our backend
      const tokenRes = await fetch("/api/integrations/google/token");
      if (!tokenRes.ok) {
        setError("Failed to get Google access token");
        return;
      }
      const { accessToken } = await tokenRes.json();

      // Load the Google Picker API script if not already loaded
      await loadGooglePickerScript();

      // Wait for gapi to be ready
      await new Promise<void>((resolve, reject) => {
        window.gapi.load("picker", { callback: resolve, onerror: reject });
      });

      const docsView = new window.google.picker.DocsView()
        .setIncludeFolders(true)
        .setMimeTypes(
          "application/vnd.google-apps.document,application/vnd.google-apps.spreadsheet"
        )
        .setMode(window.google.picker.DocsViewMode.LIST);

      const sharedView = new window.google.picker.DocsView()
        .setIncludeFolders(true)
        .setMimeTypes(
          "application/vnd.google-apps.document,application/vnd.google-apps.spreadsheet"
        )
        .setOwnedByMe(false)
        .setMode(window.google.picker.DocsViewMode.LIST);

      const picker = new window.google.picker.PickerBuilder()
        .addView(docsView)
        .addView(sharedView)
        .setOAuthToken(accessToken)
        .setCallback(async (data: any) => {
          if (data.action === "picked" && data.docs?.length > 0) {
            const picked = data.docs[0];
            await linkExistingDocument(picked.id, picked.name, picked.url, picked.mimeType);
          }
        })
        .setTitle("Select a Google Doc or Sheet")
        .build();

      picker.setVisible(true);
    } catch (err) {
      console.error("Picker error:", err);
      setError("Failed to open Google Picker");
    } finally {
      setIsPickerLoading(false);
    }
  }

  async function linkExistingDocument(
    googleId: string,
    name: string,
    url: string,
    mimeType: string
  ) {
    setError(null);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "link",
          name,
          googleId,
          googleUrl: url,
          mimeType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to link document");
        return;
      }
      setDocuments((prev) => [data, ...prev]);
      setSuccessMsg(`Linked "${data.name}"`);
    } catch {
      setError("Failed to link document");
    }
  }

  async function linkByUrl() {
    const parsed = parseGoogleUrl(linkUrl.trim());
    if (!parsed) {
      setError("Invalid URL. Paste a Google Docs or Sheets URL.");
      return;
    }
    if (!linkName.trim()) {
      setError("Please enter a name for the document.");
      return;
    }
    setIsLinking(true);
    setError(null);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "link",
          name: linkName.trim(),
          googleId: parsed.id,
          googleUrl: linkUrl.trim(),
          mimeType: parsed.mimeType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to link document");
        return;
      }
      setDocuments((prev) => [data, ...prev]);
      setShowLinkDialog(false);
      setLinkUrl("");
      setLinkName("");
      setSuccessMsg(`Linked "${data.name}"`);
    } catch {
      setError("Failed to link document");
    } finally {
      setIsLinking(false);
    }
  }

  async function deleteDoc(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This will also remove it from Google Drive.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        setSuccessMsg(`Deleted "${name}"`);
      } else {
        setError("Failed to delete document");
      }
    } catch {
      setError("Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#8B7355]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle className="h-4 w-4" />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Google Connection Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${googleStatus?.connected ? 'bg-green-100' : 'bg-gray-100'}`}>
                {googleStatus?.connected ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <FileText className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-[#2F2F2F]">
                  {googleStatus?.connected ? "Google Connected" : "Connect Google"}
                </p>
                <p className="text-sm text-[#888888]">
                  {googleStatus?.connected
                    ? `Connected as ${googleStatus.email}`
                    : "Connect your Google account to create and manage documents"}
                </p>
              </div>
            </div>
            <div>
              {googleStatus?.connected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnectGoogle}
                  disabled={isDisconnecting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {isDisconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Unlink className="h-4 w-4 mr-1" />
                  )}
                  Disconnect
                </Button>
              ) : (
                <Button
                  onClick={connectGoogle}
                  disabled={isConnecting}
                  className="bg-[#8B7355] hover:bg-[#7A6548]"
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-1" />
                  )}
                  Connect Google
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Section */}
      {googleStatus?.connected && (
        <>
          {/* Actions Bar */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#2F2F2F]">
              Documents ({documents.length}/20)
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadData()}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              {/* TODO: Re-enable once Google verification is complete and broader scopes are added
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLinkDialog(true)}
              >
                <Link className="h-4 w-4 mr-1" />
                Link Existing
              </Button>
              */}
              <Button
                size="sm"
                onClick={() => setShowCreateDialog(true)}
                className="bg-[#8B7355] hover:bg-[#7A6548]"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create New
              </Button>
            </div>
          </div>

          {/* Document List */}
          {documents.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-[#888888] mb-2">No documents yet</p>
                <p className="text-sm text-[#AAAAAA]">
                  Create a new document or link an existing Google Doc/Sheet.
                  The AI agent can also create and manage documents for you.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          doc.type === "google_sheet" ? "bg-green-100" : "bg-blue-100"
                        }`}>
                          {doc.type === "google_sheet" ? (
                            <Sheet className="h-4 w-4 text-green-600" />
                          ) : (
                            <FileText className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[#2F2F2F] truncate">
                            {doc.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {doc.type === "google_sheet" ? "Sheet" : "Doc"}
                            </Badge>
                            {doc.lastAccessedAt && (
                              <span className="text-[11px] text-[#AAAAAA]">
                                Last accessed {new Date(doc.lastAccessedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.googleUrl, "_blank")}
                          className="text-[#888888] hover:text-[#2F2F2F]"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDoc(doc.id, doc.name)}
                          disabled={deletingId === doc.id}
                          className="text-[#888888] hover:text-red-600"
                        >
                          {deletingId === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Link Existing Document Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Existing Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Google Docs/Sheets URL</Label>
              <Input
                value={linkUrl}
                onChange={(e) => {
                  setLinkUrl(e.target.value);
                  // Auto-detect type from URL for visual feedback
                  const parsed = parseGoogleUrl(e.target.value);
                  if (parsed && !linkName) {
                    // Don't override name if user already typed one
                  }
                }}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="mt-1"
              />
              {linkUrl && parseGoogleUrl(linkUrl) && (
                <div className="flex items-center gap-1 mt-1.5">
                  {parseGoogleUrl(linkUrl)?.type === "google_sheet" ? (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      <Sheet className="h-3 w-3 mr-1 text-green-500" />
                      Google Sheet detected
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      <FileText className="h-3 w-3 mr-1 text-blue-500" />
                      Google Doc detected
                    </Badge>
                  )}
                </div>
              )}
              {linkUrl && !parseGoogleUrl(linkUrl) && linkUrl.length > 10 && (
                <p className="text-xs text-red-500 mt-1">Not a valid Google Docs or Sheets URL</p>
              )}
            </div>
            <div>
              <Label>Display Name</Label>
              <Input
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
                placeholder="e.g. SEO Research - Keywords"
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowLinkDialog(false);
                  openPicker();
                }}
                disabled={isPickerLoading}
                className="text-[#888888]"
              >
                {isPickerLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-1" />
                )}
                Browse Drive instead
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={linkByUrl}
                  disabled={!linkUrl.trim() || !linkName.trim() || isLinking}
                  className="bg-[#8B7355] hover:bg-[#7A6548]"
                >
                  {isLinking ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Link className="h-4 w-4 mr-1" />
                  )}
                  Link
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Document Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Name</Label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="My Document"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={createType} onValueChange={(v: any) => setCreateType(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google_doc">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      Google Doc
                    </div>
                  </SelectItem>
                  <SelectItem value="google_sheet">
                    <div className="flex items-center gap-2">
                      <Sheet className="h-4 w-4 text-green-500" />
                      Google Sheet
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={createDocument}
                disabled={!createName.trim() || isSubmitting}
                className="bg-[#8B7355] hover:bg-[#7A6548]"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
