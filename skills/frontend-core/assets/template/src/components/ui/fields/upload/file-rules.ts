import { fieldText } from '@/constants/field-text';
import { formatFileSize } from '@/utils/format-file-size';

export interface FileRules {
  /** Same as the HTML attribute: "image/*,.pdf" */
  accept?: string | undefined;
  /** Bytes */
  maxSize?: number | undefined;
  maxFiles?: number | undefined;
}

export function matchesAccept(file: File, accept: string | undefined) {
  if (!accept) return true;
  return accept.split(',').some((rule) => {
    const r = rule.trim().toLowerCase();
    if (r.startsWith('.')) return file.name.toLowerCase().endsWith(r);
    if (r.endsWith('/*')) return file.type.startsWith(r.slice(0, -1));
    return file.type === r;
  });
}

/** Splits new files into accepted ones and messages for the rest. */
export function checkFiles(incoming: File[], existing: File[], rules: FileRules) {
  const accepted: File[] = [];
  const problems: string[] = [];
  for (const file of incoming) {
    const all = [...existing, ...accepted];
    if (!matchesAccept(file, rules.accept)) problems.push(fieldText.fileType(file.name));
    else if (rules.maxSize !== undefined && file.size > rules.maxSize)
      problems.push(fieldText.fileSize(file.name, formatFileSize(rules.maxSize)));
    else if (all.some((f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified))
      problems.push(fieldText.fileDuplicate(file.name));
    else if (rules.maxFiles !== undefined && all.length >= rules.maxFiles) {
      problems.push(fieldText.fileCount(rules.maxFiles));
      break;
    } else accepted.push(file);
  }
  return { accepted, problems };
}
