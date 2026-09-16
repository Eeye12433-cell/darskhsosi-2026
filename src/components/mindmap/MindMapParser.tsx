import React, { useState, useEffect, useRef } from 'react';
import InteractiveMindMap from './InteractiveMindMap';
import { Button } from '@/components/ui/button';
import { Network, FileText, Maximize2, ImageDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}

interface MindMapParserProps {
  content: string;
  language: 'ar' | 'en';
}

// Parse AI response to extract mind map structure
const parseMindMapFromText = (text: string): MindMapNode | null => {
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return null;

  // Try to find a structured format (numbered or bulleted)
  const rootNode: MindMapNode = {
    id: 'root',
    label: '',
    children: [],
  };

  let currentLevel1: MindMapNode | null = null;
  let currentLevel2: MindMapNode | null = null;
  let nodeCounter = 0;

  // Find the title (first heading or significant line)
  const titleMatch = text.match(/^#\s*(.+)|^\*\*(.+)\*\*|^(.+?)[:：]/m);
  if (titleMatch) {
    rootNode.label = (titleMatch[1] || titleMatch[2] || titleMatch[3]).trim();
  } else {
    // Use first meaningful line as title
    rootNode.label = lines[0].replace(/^[#\-\*\d\.]+\s*/, '').substring(0, 50);
  }

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty or title lines
    if (!trimmed || trimmed === rootNode.label) continue;

    // Detect heading level
    const h2Match = trimmed.match(/^##\s+(.+)/);
    const h3Match = trimmed.match(/^###\s+(.+)/);
    const numbered1Match = trimmed.match(/^(\d+)[\.）\)]\s*(.+)/);
    const numbered2Match = trimmed.match(/^\s+[a-zأ-ي][\)\.]\s*(.+)|^\s+[\-\*]\s*(.+)/);
    const bulletMatch = trimmed.match(/^[\-\*]\s+(.+)/);
    const boldMatch = trimmed.match(/^\*\*(.+?)\*\*/);

    if (h2Match || numbered1Match || boldMatch) {
      const label = (h2Match?.[1] || numbered1Match?.[2] || boldMatch?.[1])?.trim();
      if (label && label.length > 2) {
        nodeCounter++;
        currentLevel1 = {
          id: `node-${nodeCounter}`,
          label: label.substring(0, 60),
          children: [],
        };
        rootNode.children!.push(currentLevel1);
        currentLevel2 = null;
      }
    } else if ((h3Match || numbered2Match || bulletMatch) && currentLevel1) {
      const label = (h3Match?.[1] || numbered2Match?.[1] || numbered2Match?.[2] || bulletMatch?.[1])?.trim();
      if (label && label.length > 2) {
        nodeCounter++;
        const childNode: MindMapNode = {
          id: `node-${nodeCounter}`,
          label: label.substring(0, 50),
          children: [],
        };
        currentLevel1.children!.push(childNode);
        currentLevel2 = childNode;
      }
    }
  }

  // If no structure found, create simple nodes from paragraphs
  if (rootNode.children!.length === 0) {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 10);
    paragraphs.slice(0, 6).forEach((p, i) => {
      const cleanText = p.replace(/^[#\-\*\d\.]+\s*/gm, '').trim();
      if (cleanText.length > 5) {
        rootNode.children!.push({
          id: `para-${i}`,
          label: cleanText.substring(0, 40) + (cleanText.length > 40 ? '...' : ''),
          children: [],
        });
      }
    });
  }

  return rootNode.children!.length > 0 ? rootNode : null;
};

const MindMapParser: React.FC<MindMapParserProps> = ({ content, language }) => {
  const [viewMode, setViewMode] = useState<'visual' | 'text'>('visual');
  const [mindMapData, setMindMapData] = useState<MindMapNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const mindMapRef = useRef<HTMLDivElement>(null);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  useEffect(() => {
    const parsed = parseMindMapFromText(content);
    setMindMapData(parsed);
  }, [content]);

  const handleExportAsImage = async () => {
    if (!mindMapRef.current) return;

    setIsExportingImage(true);

    try {
      const { toPng } = await import('html-to-image');

      // Target the React Flow pane so we capture the rendered graph reliably.
      const flowEl = mindMapRef.current.querySelector('.react-flow') as HTMLElement | null;
      const target = flowEl || mindMapRef.current;

      const dataUrl = await toPng(target, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
        // Skip UI chrome (zoom controls, legend badge) that shouldn't be in the export.
        filter: (node) => {
          if (!(node instanceof HTMLElement)) return true;
          const cls = node.className?.toString?.() || '';
          if (cls.includes('react-flow__controls')) return false;
          if (cls.includes('react-flow__attribution')) return false;
          if (cls.includes('react-flow__minimap')) return false;
          return true;
        },
      });

      const link = document.createElement('a');
      link.download = `mindmap_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      toast.success(t('تم تصدير الخريطة كصورة', 'Mind map exported as image'));
    } catch (error) {
      console.error('Image export error:', error);
      toast.error(t('فشل تصدير الصورة', 'Image export failed'));
    } finally {
      setIsExportingImage(false);
    }
  };

  if (!mindMapData) {
    return null;
  }

  return (
    <div className={cn(
      'border border-border rounded-xl overflow-hidden bg-card',
      isFullscreen && 'fixed inset-4 z-50 shadow-2xl'
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            {t('خريطة ذهنية تفاعلية', 'Interactive Mind Map')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'visual' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('visual')}
            className="h-8"
          >
            <Network className="w-4 h-4 me-1" />
            {t('رسومي', 'Visual')}
          </Button>
          <Button
            variant={viewMode === 'text' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('text')}
            className="h-8"
          >
            <FileText className="w-4 h-4 me-1" />
            {t('نص', 'Text')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportAsImage}
            disabled={isExportingImage || viewMode !== 'visual'}
            className="h-8"
            title={t('تصدير كصورة', 'Export as Image')}
          >
            {isExportingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageDown className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-8"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        'transition-all duration-300',
        isFullscreen ? 'h-[calc(100%-56px)]' : ''
      )}>
        {viewMode === 'visual' ? (
          <div ref={mindMapRef}>
            <InteractiveMindMap 
              data={mindMapData} 
              language={language}
              className={isFullscreen ? 'h-full' : 'h-[500px]'}
            />
          </div>
        ) : (
          <div className="p-4 max-h-[500px] overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap font-mono text-muted-foreground">
              {content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default MindMapParser;
