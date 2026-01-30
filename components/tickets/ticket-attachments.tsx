'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Paperclip, Download, Trash2, Upload } from 'lucide-react';
// Helper function for file size formatting
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
import type { TicketAttachment } from '@/lib/db/schema';

interface TicketAttachmentsProps {
  ticketId: string;
  canDelete?: boolean;
}

export function TicketAttachments({ ticketId, canDelete = false }: TicketAttachmentsProps) {
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const loadAttachments = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/attachments`);
      const result = await response.json();

      if (result.success) {
        setAttachments(result.data);
      }
    } catch (error) {
      console.error('Error loading attachments:', error);
      toast.error('첨부파일을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttachments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '파일 업로드에 실패했습니다');
      }

      toast.success('파일이 업로드되었습니다');
      loadAttachments();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(
        error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다'
      );
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleDownload = (attachment: TicketAttachment) => {
    window.open(`/api/tickets/${ticketId}/attachments/${attachment.id}`, '_blank');
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('이 파일을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(
        `/api/tickets/${ticketId}/attachments/${attachmentId}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '파일 삭제에 실패했습니다');
      }

      toast.success('파일이 삭제되었습니다');
      loadAttachments();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error(
        error instanceof Error ? error.message : '파일 삭제 중 오류가 발생했습니다'
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          첨부파일 ({attachments.length})
        </h3>

        <label>
          <input
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <Button size="sm" disabled={isUploading} asChild>
            <span>
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? '업로드 중...' : '파일 추가'}
            </span>
          </Button>
        </label>
      </div>

      {attachments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            첨부파일이 없습니다
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <Card key={attachment.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Paperclip className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{attachment.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(attachment.fileSize)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(attachment)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {canDelete && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(attachment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
