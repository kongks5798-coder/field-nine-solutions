/**
 * Core autonomous agent execution engine.
 * Pure functions for task decomposition, step execution, validation, and self-healing.
 */

export interface TaskStepDef {
  title: string;
  description: string;
  filesAffected: string[];
}

/**
 * Build the AI prompt for task decomposition.
 * Instructs the AI to break a user's high-level task into concrete steps.
 */
export function buildDecompositionPrompt(
  userPrompt: string,
  fileNames: string[],
  fileContext: string,
): string {
  return `You are an autonomous AI coding agent. The user has given you a task to complete.

## Your Task
${userPrompt}

## Current Project Files
${fileNames.length > 0 ? fileNames.join(", ") : "(empty project)"}

## File Contents (Preview)
${fileContext}

## Instructions
Break this task into 3-8 concrete implementation steps. Each step should be a single, focused change.
Respond ONLY with valid JSON in this exact format:
{
  "steps": [
    { "title": "Step title", "description": "What to implement", "filesAffected": ["file1.html", "file2.css"] }
  ]
}

Rules:
- Each step should produce working code (no placeholder TODOs)
- Order steps by dependency (foundation first, details later)
- Be specific about what each step implements
- Keep step count between 3-8
- Respond ONLY with JSON, no other text`;
}

/**
 * Parse the AI's decomposition response into steps.
 */
export function parseDecompositionResponse(response: string): TaskStepDef[] {
  // Try to extract JSON from the response
  const jsonMatch = response.match(/\{[\s\S]*"steps"[\s\S]*\}/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed.steps)) return [];
    return parsed.steps.map((s: Record<string, unknown>) => ({
      title: String(s.title ?? "Untitled step"),
      description: String(s.description ?? ""),
      filesAffected: Array.isArray(s.filesAffected)
        ? s.filesAffected.map(String)
        : [],
    }));
  } catch {
    return [];
  }
}

/**
 * Build the AI prompt for executing a single step.
 */
export function buildStepPrompt(
  step: TaskStepDef,
  stepIndex: number,
  totalSteps: number,
  previousResults: string[],
  fileContext: string,
): string {
  const prevSummary = previousResults.length > 0
    ? `\n## Previous Steps Completed\n${previousResults.map((r, i) => `Step ${i + 1}: ${r}`).join("\n")}`
    : "";

  return `You are executing step ${stepIndex + 1} of ${totalSteps} in an autonomous coding task.

## Current Step: ${step.title}
${step.description}

## Files to Modify
${step.filesAffected.join(", ") || "Any needed files"}
${prevSummary}

## Current File Contents
${fileContext}

## Output Format
Generate complete file contents using [FILE:filename]...[/FILE] blocks.
For modifications use [EDIT:filename]...[/EDIT] blocks.
Generate production-quality code — no placeholders, no TODOs.
Use modern CSS, semantic HTML, and clean JavaScript.`;
}

/**
 * Build the AI prompt for self-healing (fixing errors).
 */
export function buildSelfHealPrompt(
  errors: string[],
  fileContext: string,
): string {
  return `The code you generated has errors. Fix them.

## Errors
${errors.map((e, i) => `${i + 1}. ${e}`).join("\n")}

## Current File Contents
${fileContext}

## Instructions
Fix ALL the errors listed above. Output the corrected files using [FILE:filename]...[/FILE] blocks.
Do not explain — just output the fixed code.`;
}

/**
 * Validate step output by checking for common code issues.
 * Returns list of errors found.
 */
export function validateStepOutput(
  generatedFiles: Record<string, string>,
  consoleErrors: string[],
): string[] {
  const errors: string[] = [];

  // Check console errors from preview
  for (const err of consoleErrors) {
    errors.push(`Console: ${err}`);
  }

  // Basic validation on generated files
  for (const [name, content] of Object.entries(generatedFiles)) {
    if (!content.trim()) {
      errors.push(`Empty file: ${name}`);
    }

    // Check for unclosed tags in HTML
    if (name.endsWith(".html")) {
      const openTags = (content.match(/<[a-z][^/]*>/gi) ?? []).length;
      const closeTags = (content.match(/<\/[a-z]+>/gi) ?? []).length;
      if (Math.abs(openTags - closeTags) > 3) {
        errors.push(`${name}: Possibly unclosed HTML tags (${openTags} open, ${closeTags} close)`);
      }
    }

    // Check for syntax errors in JS
    if (name.endsWith(".js") || name.endsWith(".ts")) {
      const braceOpen = (content.match(/\{/g) ?? []).length;
      const braceClose = (content.match(/\}/g) ?? []).length;
      if (braceOpen !== braceClose) {
        errors.push(`${name}: Mismatched braces ({${braceOpen} vs }${braceClose})`);
      }
    }
  }

  return errors;
}
