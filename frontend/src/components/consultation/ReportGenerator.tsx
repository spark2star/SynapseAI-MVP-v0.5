'use client';

import { useState } from 'react';
import  Button  from '@/components/ui/Button';

interface ReportGeneratorProps {
  sessionId: string;
  onReportGenerated: (report: any) => void;
}

export function ReportGenerator({ sessionId, onReportGenerated }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/consultation/${sessionId}/generate-report`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      const data = await response.json();
      onReportGenerated(data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <h3 className="font-semibold">Generate Clinical Report</h3>
        <p className="text-sm text-gray-600">
          Create a structured report from the consultation transcript
        </p>
      </div>
      
      <Button
        onClick={generateReport}
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Generate Report'}
      </Button>
    </div>
  );
}
