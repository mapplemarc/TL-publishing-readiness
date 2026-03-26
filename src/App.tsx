import React, { useState, useMemo, useRef, useEffect } from 'react';
import { categories, ScoreValue } from './data/questions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { CheckCircle2, AlertTriangle, XCircle, RefreshCcw, Loader2, BookOpen, FileUp, FileText, X, Printer } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import * as mammoth from 'mammoth';
import html2pdf from 'html2pdf.js';

const CircularProgress = ({ value, max = 5, size = 100, strokeWidth = 10 }: { value: number, max?: number, size?: number, strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / max) * circumference;

  let colorClass = "text-rose-500";
  if (value >= 4) colorClass = "text-[#059669]";
  else if (value >= 3) colorClass = "text-amber-500";

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          className="text-muted/20"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${colorClass} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-foreground">{value.toFixed(1)}</span>
      </div>
    </div>
  );
};

export default function App() {
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [attachedPdf, setAttachedPdf] = useState<{name: string, data: string} | null>(null);
  const [scores, setScores] = useState<Record<string, ScoreValue>>({});
  const [aiFeedback, setAiFeedback] = useState<Record<string, string>>({});
  const [competitivePieces, setCompetitivePieces] = useState<{company: string, title: string, url: string, date: string}[]>([]);
  const [summary, setSummary] = useState<{coreIdea: string, keyStats: string[], keyActions: string[], keywords: string[]} | null>(null);
  const [competitiveUrls, setCompetitiveUrls] = useState('');
  const [competitivePdfs, setCompetitivePdfs] = useState<{name: string, data: string}[]>([]);
  const [competitiveTexts, setCompetitiveTexts] = useState<{name: string, text: string}[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const compFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('print') === 'true') {
      try {
        const data = localStorage.getItem('mja_print_data');
        if (data) {
          const parsed = JSON.parse(data);
          setScores(parsed.scores || {});
          setAiFeedback(parsed.aiFeedback || {});
          setSummary(parsed.summary || null);
          setCompetitivePieces(parsed.competitivePieces || []);
          setShowResults(true);
          setIsPrinting(true);
          
          // Clean up storage
          localStorage.removeItem('mja_print_data');
          
          // Wait for render, then print
          setTimeout(() => {
            window.print();
            setIsPrinting(false);
          }, 1000);
        }
      } catch (e) {
        console.error("Failed to load print data", e);
      }
    }
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          setAttachedPdf({ name: file.name, data: base64String });
          setIsExtracting(false);
        };
        reader.readAsDataURL(file);
      } else if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          try {
            const result = await mammoth.extractRawText({ arrayBuffer });
            setContent((prev) => prev + (prev ? '\n\n' : '') + result.value);
          } catch (error) {
            console.error("Error parsing DOCX", error);
            alert("Failed to parse DOCX file.");
          } finally {
            setIsExtracting(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onloadend = () => {
          setContent((prev) => prev + (prev ? '\n\n' : '') + (reader.result as string));
          setIsExtracting(false);
        };
        reader.readAsText(file);
      } else {
        alert("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
        setIsExtracting(false);
      }
    } catch (e) {
      console.error(e);
      setIsExtracting(false);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCompFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setIsExtracting(true);
    try {
      for (const file of files) {
        if (file.type === 'application/pdf') {
          const base64String = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
          });
          setCompetitivePdfs(prev => [...prev, { name: file.name, data: base64String }]);
        } else if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const arrayBuffer = await new Promise<ArrayBuffer>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as ArrayBuffer);
            reader.readAsArrayBuffer(file);
          });
          const result = await mammoth.extractRawText({ arrayBuffer });
          setCompetitiveTexts(prev => [...prev, { name: file.name, text: result.value }]);
        } else if (file.type === 'text/plain') {
          const text = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsText(file);
          });
          setCompetitiveTexts(prev => [...prev, { name: file.name, text }]);
        } else {
          alert(`Unsupported file type for ${file.name}. Please upload a PDF, DOCX, or TXT file.`);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Error processing competitive files.");
    } finally {
      setIsExtracting(false);
    }
    
    if (compFileInputRef.current) {
      compFileInputRef.current.value = '';
    }
  };

  const analyzeContent = async () => {
    if (!content.trim() && !attachedPdf) return;
    
    setIsAnalyzing(true);
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not defined in the environment.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const rubricText = JSON.stringify(categories.map(c => ({
        category: c.title,
        questions: c.questions.map(q => ({
          id: q.id,
          text: q.text,
          scoring_rubric: q.options
        }))
      })), null, 2);

      const promptText = `You are the notoriously strict Editor in Chief of Harvard Business Review. You are rigorous, highly critical, and hold content to the highest global standards of thought leadership. You do not hand out good scores easily.

Evaluate the following draft thought leadership content using the Source Global White Space methodology.

Here is the scoring rubric (1-5 scale for each question):
${rubricText}

${content.trim() ? `Draft Content / Additional Context:\n"""\n${content}\n"""` : ''}
${attachedPdf ? `\n(A PDF document is also attached to this request. Please evaluate its contents.)` : ''}

${competitiveUrls.trim() || competitivePdfs.length > 0 || competitiveTexts.length > 0 ? `
USER-PROVIDED COMPETITIVE PIECES FOR DIRECT COMPARISON:
The user has specifically provided the following competitive pieces to compare against. You MUST evaluate how the draft differentiates itself from these specific pieces.
${competitiveUrls.trim() ? `URLs:\n${competitiveUrls}\n` : ''}
${competitivePdfs.length > 0 ? `(There are also ${competitivePdfs.length} competitive PDF(s) attached to this request for direct comparison.)\n` : ''}
${competitiveTexts.length > 0 ? `Text Documents:\n${competitiveTexts.map(t => `--- ${t.name} ---\n${t.text}\n`).join('\n')}` : ''}
` : ''}

CRITICAL SCORING INSTRUCTIONS (BE HARSH):
- DO NOT inflate scores. You are a notoriously strict editor.
- A score of 5 means the piece is paradigm-shifting and flawless. This should be extremely rare.
- A score of 4 means excellent, ready for publication with minor tweaks.
- A score of 3 means average, standard consulting fluff. It needs significant work.
- A score of 1 or 2 means the content is weak, derivative, or poorly executed.
- Default to lower scores (2 or 3) unless the content provides overwhelming evidence of excellence.

CRITICAL INSTRUCTION FOR DIFFERENTIATION:
You MUST use the Google Search tool to search the live web for recent publications on this topic. Even if the user has provided specific competitive pieces, you MUST STILL conduct a WIDE and comprehensive search across major consulting firms (e.g., McKinsey, BCG, Bain, Deloitte), boutique consultancies, industry publications, think tanks, and leading technology companies. Compare the uploaded draft against BOTH these live search results AND the user-provided competitive pieces. 
- STRICT TIME CONSTRAINT: You MUST NOT review, reference, or include ANY competitive pieces that were originally published more than 12 months ago, UNLESS the piece has been explicitly updated within the last 12 months. Before including any competitive piece, verify its publication or last updated date. If it is older than 12 months and has not been updated, EXCLUDE IT completely.
- Pay close attention to the SPECIFIC ANGLE or TAKE, not just the broad topic. It is expected that competitors write about the same broad topics. What matters is whether this draft's specific perspective, solution, or insight is unique.
- If competitors have published the EXACT SAME specific take or angle within the last 12 months, the Differentiation score MUST be 3 or lower. Cite the competitors in your rationale.
- Award a 4 or 5 if the specific angle, framework, or insight is genuinely unique and unaddressed by the search results, even if the broad topic itself is highly crowded.

CRITICAL INSTRUCTION FOR RECOMMENDATIONS:
Your feedback MUST match the depth, analytical rigor, and specific style of Source Global's firm-by-firm commentary. 
- Do not give generic advice like "add more data" or "improve the structure." 
- Instead, provide highly specific, nuanced critiques. For example: "The lack of a consistently clear structure in report materials emerged as a notable weakness... there is evidence of strong practice that could be replicated." or "Recommendations are often linked to ways in which the firm can help. This would be excusable were the underlying analysis stronger and more compelling. Instead, this heavy-handed approach is off-putting."
- Point out specific strengths and exact areas where the execution falls short (e.g., 'heavy-handed sales approach', 'lack of clear methodology', 'fizzles out with little or no actionable guidance', 'sharpness is compromised by a lack of clarity on who it is for').
- Be direct, professional, and constructive, maintaining your persona as the HBR Editor in Chief.

For each question ID in the rubric, provide:
1. The score (1-5) based strictly on the rubric.
2. A specific, actionable rationale/recommendation explaining why it received this score and exactly how the author can improve it to achieve a 5, following the style guidelines above.

CRITICAL INSTRUCTION FOR SUMMARY:
Provide a concise summary of the uploaded draft, including:
1. The Core Idea (1-2 sentences)
2. Key Stats (a list of the most important statistics cited in the draft)
3. Key Actions (a list of the main recommendations or actions for the reader)
4. Keywords (a list of the key topics discussed)

CRITICAL INSTRUCTION FOR COMPETITIVE PIECES LIST:
You must provide a list of at least 8 to 12 competitive thought leadership pieces you reviewed or referenced during your evaluation. 
- You MUST ensure the URLs provided are REAL, VALID, and EXACT links to the actual pieces. Do not hallucinate URLs or provide broken links. Only use links that were explicitly returned by the search tool.
- Include the company name, the title of the piece, the exact valid URL, and the date of publish.

OUTPUT FORMAT:
You MUST return your entire response as a single, valid JSON object. Do not include any markdown formatting or extra text outside the JSON. The JSON must exactly match this structure:
{
  "evaluations": [
    { "questionId": "string", "score": number, "rationale": "string" }
  ],
  "summary": {
    "coreIdea": "string",
    "keyStats": ["string"],
    "keyActions": ["string"],
    "keywords": ["string"]
  },
  "competitivePieces": [
    { "company": "string", "title": "string", "url": "string", "date": "string" }
  ]
}`;

      const parts: any[] = [];
      if (attachedPdf) {
        parts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: attachedPdf.data
          }
        });
      }
      competitivePdfs.forEach(pdf => {
        parts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: pdf.data
          }
        });
      });
      parts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: { parts },
        config: {
          tools: [{ googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true }
        }
      });

      if (response.text) {
        let rawText = response.text.trim();
        if (rawText.startsWith('```json')) {
          rawText = rawText.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (rawText.startsWith('```')) {
          rawText = rawText.replace(/^```\n/, '').replace(/\n```$/, '');
        }
        
        const resultData = JSON.parse(rawText);
        const results = resultData.evaluations;
        const newScores: Record<string, ScoreValue> = {};
        const newFeedback: Record<string, string> = {};
        
        results.forEach((item: any) => {
          newScores[item.questionId] = item.score as ScoreValue;
          newFeedback[item.questionId] = item.rationale;
        });

        setScores(newScores);
        setAiFeedback(newFeedback);
        setSummary(resultData.summary || null);
        setCompetitivePieces(resultData.competitivePieces || []);
        setShowResults(true);
        window.scrollTo(0, 0);
      }
    } catch (error: any) {
      console.error("Analysis failed:", error);
      alert(`Failed to analyze content: ${error?.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAssessment = () => {
    setScores({});
    setAiFeedback({});
    setSummary(null);
    setCompetitivePieces([]);
    setContent('');
    setAttachedPdf(null);
    setCompetitiveUrls('');
    setCompetitivePdfs([]);
    setCompetitiveTexts([]);
    setShowResults(false);
    setIsPrinting(false);
    window.scrollTo(0, 0);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    
    let documentTitle = "TL Assessment";
    if (attachedPdf && attachedPdf.name) {
      const baseName = attachedPdf.name.replace(/\.[^/.]+$/, "");
      const truncatedName = baseName.length > 50 ? baseName.substring(0, 50).trim() + '...' : baseName;
      documentTitle = `TL Assessment - ${truncatedName}`;
    } else if (content && content.trim()) {
      const firstLine = content.trim().split('\n')[0].replace(/[^a-zA-Z0-9 \-_]/g, '').trim();
      if (firstLine) {
        const truncatedName = firstLine.length > 40 ? firstLine.substring(0, 40).trim() + '...' : firstLine;
        documentTitle = `TL Assessment - ${truncatedName}`;
      }
    }
    
    // Open the window immediately to bypass popup blockers
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to save the report as a PDF.");
      setIsPrinting(false);
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head><title>${documentTitle}</title></head>
        <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#f0f9ff;color:#0A3948;margin:0;">
          <div style="text-align:center;">
            <h2 style="margin-bottom: 10px;">Preparing your PDF report...</h2>
            <p>Please wait a few seconds. The print dialog will open automatically.</p>
          </div>
        </body>
      </html>
    `);
    
    setTimeout(() => {
      const element = document.getElementById('report-container');
      if (!element) {
        setIsPrinting(false);
        printWindow.close();
        return;
      }
      
      // Get all stylesheets and styles from the current document
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(el => el.outerHTML)
        .join('\n');
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${documentTitle}</title>
            <base href="${window.location.origin}">
            ${styles}
            <style>
              body { background: white !important; color: black !important; padding: 20px; }
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .print\\:hidden { display: none !important; }
                .break-inside-avoid { break-inside: avoid; }
                @page { margin: 0.5in; }
              }
            </style>
          </head>
          <body>
            ${element.outerHTML}
            <script>
              // Wait a moment for styles and fonts to apply
              setTimeout(() => {
                window.print();
              }, 1000);
            </script>
          </body>
        </html>
      `;
      
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      setIsPrinting(false);
    }, 500); // Wait for accordions to expand
  };

  const { totalScore, categoryScores, status, recommendations, failingCategories, allDimensionsExcellent } = useMemo(() => {
    if (!showResults) return { totalScore: 0, categoryScores: [], status: null, recommendations: [], failingCategories: [], allDimensionsExcellent: false };

    let total = 0;
    const catScores = categories.map((cat) => {
      const catTotal = cat.questions.reduce((sum, q) => sum + (scores[q.id] || 0), 0);
      const catAvg = catTotal / cat.questions.length;
      total += catAvg;
      return { ...cat, average: catAvg };
    });

    let status: 'red' | 'yellow' | 'green' = 'red';
    const failingCategories = catScores.filter(cat => cat.average < 3.0).map(cat => cat.title);
    const hasFailingCategory = failingCategories.length > 0;
    const allDimensionsExcellent = catScores.every(cat => cat.average >= 4.0);

    if (hasFailingCategory) {
      status = 'red';
    } else if (total >= 16) {
      status = 'green';
    } else if (total >= 12) {
      status = 'yellow';
    } else {
      status = 'red';
    }

    const recs = categories.flatMap((cat) =>
      cat.questions
        .filter((q) => (scores[q.id] || 0) < 5) // Show recommendations for anything less than perfect
        .map((q) => ({
          category: cat.title,
          question: q.text,
          score: scores[q.id],
          recommendation: aiFeedback[q.id] || q.recommendation,
        }))
    );

    return { totalScore: total, categoryScores: catScores, status, recommendations: recs, failingCategories, allDimensionsExcellent };
  }, [scores, aiFeedback, showResults]);

  if (showResults) {
    return (
      <div className="min-h-screen bg-teal-gradient pb-12">
        <header className="py-5 px-6 sm:px-10 border-b border-white/10 mb-8 print:hidden">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="text-[14px] font-bold text-white/95 print:text-black tracking-normal">MJA <span>Consulting</span></div>
            <Button variant="ghost" className="text-white hover:bg-white/10" onClick={handlePrint} disabled={isPrinting}>
              {isPrinting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />} 
              {isPrinting ? 'Generating PDF...' : 'Save as PDF'}
            </Button>
          </div>
        </header>

        <div id="report-container" className={`max-w-4xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 ${isPrinting ? 'bg-white py-8' : ''}`}>
          <div className="text-center space-y-4 mb-12">
            <h1 className={`text-4xl md:text-5xl font-extrabold tracking-tight ${isPrinting ? 'text-black' : 'text-white'}`}>
              Thought Leadership<br/>
              <span className={`font-normal ${isPrinting ? 'text-teal-700' : 'text-[#00E5FF]'}`}>Publishing Readiness Assessment</span>
            </h1>
            <p className={`text-lg ${isPrinting ? 'text-teal-900' : 'text-teal-100'}`}>Based on the Source Global White Space methodology</p>
          </div>

          <Card className="border-t-4 border-t-primary shadow-lg rounded-xl overflow-hidden bg-white">
            <CardHeader className="text-center pb-2 bg-white">
              <CardTitle className="text-2xl font-bold">Total Quality Score</CardTitle>
              <CardDescription className="text-muted-foreground">Score range: 4 to 20</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-6 pt-4 bg-white">
              <div className="text-7xl font-black tracking-tighter text-primary">
                {totalScore.toFixed(1)}
              </div>
              
              <div className="flex items-center space-x-2">
                {status === 'green' && (
                  <Badge className="bg-[#059669] hover:bg-[#047857] text-white px-4 py-2 text-lg flex items-center gap-2 rounded-md">
                    <CheckCircle2 className="w-5 h-5" /> Yes - Ready to Publish
                  </Badge>
                )}
                {status === 'yellow' && (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 text-lg flex items-center gap-2 rounded-md">
                    <AlertTriangle className="w-5 h-5" /> Maybe - Needs Improvement
                  </Badge>
                )}
                {status === 'red' && (
                  <Badge className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 text-lg flex items-center gap-2 rounded-md">
                    <XCircle className="w-5 h-5" /> No - Do Not Publish
                  </Badge>
                )}
              </div>
              
              <p className="text-center text-secondary-foreground max-w-lg text-base">
                {status === 'green' && allDimensionsExcellent && "Excellent work. This piece meets our rigorous editorial standards across all dimensions and is ready for publication."}
                {status === 'green' && !allDimensionsExcellent && "Excellent work overall. While this piece is strong enough for publication, some dimensions could still be refined to maximize its impact."}
                {status === 'yellow' && "This content has potential but requires targeted refinement before publication. Focus on the Editor's recommendations below to elevate its impact."}
                {status === 'red' && failingCategories.length > 0 
                  ? `This content falls short of our editorial standards. Regardless of the total score, a piece cannot be published if any category scores below a 3.0. Please address the critical weaknesses in: ${failingCategories.join(', ')}.`
                  : status === 'red' 
                    ? "This content is currently weak across multiple dimensions. Its impact could be negative, and significant revisions are required before it is ready for your audience."
                    : null}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categoryScores.map((cat) => (
              <Card key={cat.id} className="shadow-md rounded-xl border-border bg-white flex flex-col items-center justify-start p-6 text-center">
                <CardHeader className="p-0 mb-4 flex flex-col items-center justify-center min-h-[3rem]">
                  <CardTitle className="text-lg font-bold text-primary leading-tight">{cat.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex justify-center items-center mt-auto">
                  <CircularProgress value={cat.average} max={5} size={100} strokeWidth={8} />
                </CardContent>
              </Card>
            ))}
          </div>

          {summary && (
            <Card className="shadow-md rounded-xl border-border mt-8 bg-white">
              <CardHeader className="bg-white border-b border-border pb-6">
                <CardTitle className="text-2xl font-bold">Draft Summary</CardTitle>
                <CardDescription className="text-base text-secondary-foreground mt-2">A quick overview of the core elements extracted from your draft.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-primary mb-2">Core Idea</h3>
                  <p className="text-secondary-foreground">{summary.coreIdea}</p>
                </div>
                
                {summary.keyStats && summary.keyStats.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-primary mb-2">Key Stats</h3>
                    <ul className="list-disc pl-5 space-y-1 text-secondary-foreground">
                      {summary.keyStats.map((stat, i) => <li key={i}>{stat}</li>)}
                    </ul>
                  </div>
                )}

                {summary.keyActions && summary.keyActions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-primary mb-2">Key Actions</h3>
                    <ul className="list-disc pl-5 space-y-1 text-secondary-foreground">
                      {summary.keyActions.map((action, i) => <li key={i}>{action}</li>)}
                    </ul>
                  </div>
                )}

                {summary.keywords && summary.keywords.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-primary mb-2">Key Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {summary.keywords.map((keyword, i) => (
                        <Badge key={i} variant="secondary" className="bg-secondary text-secondary-foreground">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {recommendations.length > 0 && (
            <Card className="shadow-md rounded-xl border-border mt-8 bg-white">
              <CardHeader className="bg-white border-b border-border pb-6">
                <CardTitle className="text-2xl font-bold">Editor's Feedback & Recommendations</CardTitle>
                <CardDescription className="text-base text-secondary-foreground mt-2">Review the detailed editorial feedback to improve your score.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isPrinting ? (
                  <Accordion key="print" type="multiple" defaultValue={recommendations.map((_, i) => `item-${i}`)} className="w-full">
                    {recommendations.map((rec, index) => (
                      <AccordionItem key={index} value={`item-${index}`} className="border-b border-border px-6 py-2 break-inside-avoid">
                        <AccordionTrigger className="text-left hover:no-underline py-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className={`border rounded-full w-8 h-8 flex items-center justify-center font-black shrink-0 shadow-sm text-sm ${
                              rec.score >= 4 ? 'bg-[#059669] text-white border-[#059669]' : 
                              rec.score >= 3 ? 'bg-amber-500 text-white border-amber-500' : 
                              'bg-rose-500 text-white border-rose-500'
                            }`}>
                              {rec.score}
                            </div>
                            <Badge variant="outline" className="w-fit bg-secondary text-secondary-foreground border-border font-semibold">{rec.category}</Badge>
                            <span className="font-semibold text-primary text-base">{rec.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-secondary-foreground bg-secondary/50 p-6 rounded-lg mb-4 border border-border">
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <p className="font-bold text-primary mb-2 text-base">Editor's Rationale:</p>
                              <p className="whitespace-pre-wrap leading-relaxed">{rec.recommendation}</p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <Accordion key="screen" type="single" collapsible className="w-full">
                    {recommendations.map((rec, index) => (
                      <AccordionItem key={index} value={`item-${index}`} className="border-b border-border px-6 py-2">
                        <AccordionTrigger className="text-left hover:no-underline py-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className={`border rounded-full w-8 h-8 flex items-center justify-center font-black shrink-0 shadow-sm text-sm ${
                              rec.score >= 4 ? 'bg-[#059669] text-white border-[#059669]' : 
                              rec.score >= 3 ? 'bg-amber-500 text-white border-amber-500' : 
                              'bg-rose-500 text-white border-rose-500'
                            }`}>
                              {rec.score}
                            </div>
                            <Badge variant="outline" className="w-fit bg-secondary text-secondary-foreground border-border font-semibold">{rec.category}</Badge>
                            <span className="font-semibold text-primary text-base">{rec.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-secondary-foreground bg-secondary/50 p-6 rounded-lg mb-4 border border-border">
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <p className="font-bold text-primary mb-2 text-base">Editor's Rationale:</p>
                              <p className="whitespace-pre-wrap leading-relaxed">{rec.recommendation}</p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          )}

          {competitivePieces && competitivePieces.length > 0 && (
            <Card className="shadow-md rounded-xl border-border mt-8 bg-white">
              <CardHeader className="bg-white border-b border-border pb-6">
                <CardTitle className="text-2xl font-bold">Competitive Thought Leadership Reviewed</CardTitle>
                <CardDescription className="text-base text-secondary-foreground mt-2">
                  The following recent publications were analyzed to evaluate the differentiation of your draft.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {competitivePieces.map((piece, index) => (
                    <div key={index} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/20 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border font-semibold">
                            {piece.company}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{piece.date}</span>
                        </div>
                        <a 
                          href={piece.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-lg font-bold text-primary hover:underline block mt-2"
                        >
                          {piece.title}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!isPrinting && (
            <div className="flex justify-center pt-10 pb-12">
              <Button onClick={resetAssessment} size="lg" className="gap-2 bg-white text-primary border-2 border-border hover:bg-secondary hover:border-muted-foreground transition-all rounded-md px-8 py-6 text-base font-bold shadow-sm">
                <RefreshCcw className="w-5 h-5" /> Analyze Another Draft
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-teal-gradient text-white flex-1 flex flex-col">
        <header className="py-5 px-6 sm:px-10 border-b border-white/10">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="text-[14px] font-bold text-white/95 tracking-normal">MJA <span>Consulting</span></div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl w-full space-y-10">
            <div className="text-center space-y-6">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Thought Leadership<br/>
                <span className="text-[#00E5FF] font-normal">Publishing Readiness Assessment</span>
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
                Understand where your thought leadership truly stands. Upload your draft and get a personalized, actionable report based on the Source Global White Space methodology.
              </p>
            </div>

            <Card className="bg-white rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.22)] border-0 overflow-hidden">
              <CardHeader className="px-8 pt-8 pb-4">
                <CardTitle className="text-2xl font-bold flex items-center gap-3 text-primary">
                  <BookOpen className="w-6 h-6 text-[#00A8CC]" />
                  Draft Submission
                </CardTitle>
                <CardDescription className="text-base text-secondary-foreground mt-2">
                  Upload a PDF or Word document, or paste the full text of your article.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-secondary/50 p-4 rounded-xl border border-border">
                    <Label htmlFor="content" className="text-sm font-semibold text-primary">
                      Upload a document for analysis
                    </Label>
                    <div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept=".pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                        className="hidden" 
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isAnalyzing || isExtracting}
                        className="gap-2 bg-white border-border hover:bg-secondary text-primary font-semibold rounded-md shadow-sm"
                      >
                        {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                        Upload PDF or Word Doc
                      </Button>
                    </div>
                  </div>

                  {attachedPdf && (
                    <div className="flex items-center justify-between p-4 bg-[#e0f9fd] border border-[#9beaf7] rounded-xl">
                      <div className="flex items-center gap-3 text-[#0A3948]">
                        <FileText className="w-6 h-6 text-[#00A8CC]" />
                        <span className="font-bold text-sm">{attachedPdf.name}</span>
                        <span className="text-xs font-medium opacity-80">(PDF attached for analysis)</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setAttachedPdf(null)} className="h-8 w-8 p-0 text-[#0A3948] hover:bg-[#9beaf7]/50 rounded-full">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="content" className="text-sm font-semibold text-primary ml-1">
                      Or paste your draft directly
                    </Label>
                    <div className="bg-white rounded-xl overflow-hidden border border-border focus-within:border-[#00A8CC] focus-within:ring-1 focus-within:ring-[#00A8CC] shadow-sm">
                      <ReactQuill
                        theme="snow"
                        value={content}
                        onChange={setContent}
                        placeholder={attachedPdf ? "Add any additional context or instructions here (optional)..." : "Paste your draft here..."}
                        readOnly={isAnalyzing}
                        className="[&_.ql-container]:border-none [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-border [&_.ql-editor]:text-base [&_.ql-editor]:min-h-[120px] [&_.ql-editor]:max-h-[300px]"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-primary mb-1">Direct Comparison (Optional)</h3>
                      <p className="text-sm text-secondary-foreground mb-4">Provide URLs or upload documents of specific competitive pieces you want to compare against.</p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-secondary/50 p-4 rounded-xl border border-border mb-4">
                        <Label className="text-sm font-semibold text-primary">
                          Upload competitive documents
                        </Label>
                        <div>
                          <input 
                            type="file" 
                            ref={compFileInputRef} 
                            onChange={handleCompFileUpload} 
                            accept=".pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                            className="hidden" 
                            multiple
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => compFileInputRef.current?.click()}
                            disabled={isAnalyzing || isExtracting}
                            className="gap-2 bg-white border-border hover:bg-secondary text-primary font-semibold rounded-md shadow-sm"
                          >
                            {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                            Upload PDF/Word
                          </Button>
                        </div>
                      </div>

                      {(competitivePdfs.length > 0 || competitiveTexts.length > 0) && (
                        <div className="space-y-2 mb-4">
                          {competitivePdfs.map((pdf, idx) => (
                            <div key={`pdf-${idx}`} className="flex items-center justify-between p-3 bg-secondary/30 border border-border rounded-lg">
                              <div className="flex items-center gap-3 text-primary">
                                <FileText className="w-5 h-5 text-muted-foreground" />
                                <span className="font-semibold text-sm">{pdf.name}</span>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => setCompetitivePdfs(prev => prev.filter((_, i) => i !== idx))} className="h-8 w-8 p-0 text-muted-foreground hover:bg-secondary rounded-full">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          {competitiveTexts.map((text, idx) => (
                            <div key={`txt-${idx}`} className="flex items-center justify-between p-3 bg-secondary/30 border border-border rounded-lg">
                              <div className="flex items-center gap-3 text-primary">
                                <FileText className="w-5 h-5 text-muted-foreground" />
                                <span className="font-semibold text-sm">{text.name}</span>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => setCompetitiveTexts(prev => prev.filter((_, i) => i !== idx))} className="h-8 w-8 p-0 text-muted-foreground hover:bg-secondary rounded-full">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="compUrls" className="text-sm font-semibold text-primary ml-1">
                          Competitive URLs (one per line)
                        </Label>
                        <Textarea
                          id="compUrls"
                          placeholder="https://..."
                          className="min-h-[100px] text-base resize-y rounded-xl border-border focus:border-[#00A8CC] focus:ring-[#00A8CC] shadow-sm p-4"
                          value={competitiveUrls}
                          onChange={(e) => setCompetitiveUrls(e.target.value)}
                          disabled={isAnalyzing}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t border-border bg-secondary/30 p-6 px-8">
                <Button
                  onClick={analyzeContent}
                  disabled={(!content.trim() && !attachedPdf) || isAnalyzing || isExtracting}
                  size="lg"
                  className="gap-2 bg-[#1a1a1a] hover:bg-[#2d2d2d] text-white rounded-md px-8 py-6 text-base font-bold shadow-md transition-all hover:-translate-y-[1px]"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing Draft...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Evaluate Content
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <p className="text-center text-sm text-white/50 mt-8">
              Your content is processed securely and not stored permanently.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
