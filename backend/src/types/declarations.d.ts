// Type declarations for packages without @types
declare module 'cors';
declare module 'morgan';
declare module 'multer';
declare module 'pdf-parse';
declare module 'pdfkit';

declare module 'mammoth' {
  interface ExtractOptions {
    buffer?: Buffer;
    path?: string;
  }
  interface Result {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }
  function extractRawText(options: ExtractOptions): Promise<Result>;
  function convertToHtml(options: ExtractOptions): Promise<Result>;
}
