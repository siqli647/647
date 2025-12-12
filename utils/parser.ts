
import { Question, QuestionType, Option } from '../types';

export const parseRawTextToQuestions = (rawText: string): Question[] => {
  const questions: Question[] = [];
  const seenTexts = new Set<string>(); // Set to track seen questions for deduplication
  
  // Clean up the text first to normalize line endings
  const cleanText = rawText.replace(/\r\n/g, '\n');

  // Regex to split by 【结束】 or identify blocks
  const blocks = cleanText.split('【结束】').filter(block => block.trim().length > 0);

  let idCounter = 1;

  for (const block of blocks) {
    try {
      // Extract Type
      // Matches content between 【题型】 and 【题文】
      const typeMatch = block.match(/【题型】\s*(.*?)\s*\n/);
      // Fallback: look for 【题型】 then anything until 【题文】
      const typeStr = typeMatch ? typeMatch[1].trim() : (block.match(/【题型】\s*([\s\S]*?)\s*【题文】/)?.[1].trim() || '');
      
      let type = QuestionType.Unknown;
      if (typeStr.includes('单选')) type = QuestionType.SingleChoice;
      else if (typeStr.includes('多选')) type = QuestionType.MultipleChoice;
      else if (typeStr.includes('判断')) type = QuestionType.TrueFalse;

      // Extract Question Text
      // Matches content between 【题文】 and 【选项】
      const textMatch = block.match(/【题文】\s*([\s\S]*?)\s*【选项】/);
      // Fallback: if no 【选项】, it might be True/False, try until 【答案】
      const textMatchFallback = block.match(/【题文】\s*([\s\S]*?)\s*【答案】/);
      
      let text = textMatch ? textMatch[1].trim() : (textMatchFallback ? textMatchFallback[1].trim() : '');

      // Deduplication check
      // Normalize text (remove whitespace) to check for duplicates
      const normalizedText = text.replace(/\s+/g, '');
      if (!text || seenTexts.has(normalizedText)) {
          continue; // Skip duplicate or empty text
      }
      seenTexts.add(normalizedText);

      // Extract Options
      // Matches content between 【选项】 and 【答案】
      const optionsMatch = block.match(/【选项】\s*([\s\S]*?)\s*【答案】/);
      const optionsRaw = optionsMatch ? optionsMatch[1].trim() : '';
      
      const options: Option[] = [];
      const optionLines = optionsRaw.split('\n').filter(line => line.trim().length > 0);
      
      for (const line of optionLines) {
        // Robust match for options:
        // Handles: "A. Text", "A、Text", "A Text", "(A) Text", "（A）Text"
        // Also trims the line first to handle indentation
        const trimmedLine = line.trim();
        const optMatch = trimmedLine.match(/^[(（]?([A-Z])[)）\.\s、]\s*(.*)/);
        
        if (optMatch) {
          options.push({
            label: optMatch[1],
            content: optMatch[2].trim()
          });
        }
      }

      // Extract Answer
      // Matches 【答案】 until newline, 【解析】, or end of string
      const answerMatch = block.match(/【答案】\s*([A-Z,]+|正确|错误|T|F)(?:[\s\n]|$|【)/);
      let answers: string[] = [];
      
      if (answerMatch) {
        const answerStr = answerMatch[1].trim();
        if (type === QuestionType.TrueFalse) {
             answers = [answerStr];
        } else {
             // Split by nothing (e.g. "ABC") or commas/spaces if present
             answers = answerStr.split(/[\s,]+|(?=[A-Z])/).filter(c => /[A-Z]/.test(c) || c === '正确' || c === '错误');
             // If split logic above failed for string like "ABC", fallback to char split
             if (answers.length === 0 && /[A-Z]+/.test(answerStr)) {
                answers = answerStr.split('');
             }
        }
      }

      // Extract Explanation (optional)
      const explanationMatch = block.match(/【解析】\s*([\s\S]*?)$/);
      const explanation = explanationMatch ? explanationMatch[1].trim() : undefined;

      if (text && options.length > 0 && answers.length > 0) {
        questions.push({
          id: `q-${idCounter++}`,
          type,
          text,
          options,
          correctAnswer: answers,
          explanation
        });
      } else if (text && type === QuestionType.TrueFalse && answers.length > 0) {
         // Special handling for True/False if they don't have standard "Options" block
         questions.push({
          id: `q-${idCounter++}`,
          type,
          text,
          options: [{label: 'A', content: '正确'}, {label: 'B', content: '错误'}], // Default options for T/F
          correctAnswer: answers,
          explanation
         });
      }
    } catch (e) {
      console.warn('Failed to parse block:', block, e);
    }
  }

  return questions;
};
