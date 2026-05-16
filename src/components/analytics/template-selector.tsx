'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { TemplateConfig } from '@/lib/pdf-template-types';

interface TemplateSelectorProps {
  timeRange: string;
}

export function TemplateSelector({ timeRange }: TemplateSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/analytics/export/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('خطا در دریافت لیست قالب‌ها');
    }
  };

  const generatePDF = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/analytics/export/pdf?range=${timeRange}&template=${selectedTemplate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'خطا در دانلود PDF' }));
        throw new Error(errorData.error || 'خطا در دانلود PDF');
      }

      // Download PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hamsou-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('گزارش PDF با موفقیت دانلود شد');
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error(error.message || 'خطا در تولید PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <Select value={selectedTemplate} onValueChange={setSelectedTemplate} dir="rtl">
        <SelectTrigger className="w-[180px]" dir="rtl">
          <SelectValue placeholder="انتخاب قالب" />
        </SelectTrigger>
        <SelectContent dir="rtl">
          {templates.map((template) => (
            <SelectItem key={template.id} value={template.id} dir="rtl">
              <div className="flex flex-col">
                <span>{template.name}</span>
                <span className="text-xs text-muted-foreground">{template.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={generatePDF} disabled={loading} variant="outline" size="sm">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            در حال تولید...
          </>
        ) : (
          <>
            <FileDown className="w-4 h-4 ml-2" />
            دانلود PDF
          </>
        )}
      </Button>
    </div>
  );
}
