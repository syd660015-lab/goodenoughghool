export interface ChildInfo {
  name: string;
  birthDate: string;
  testDate: string;
  examinerName: string;
}

export interface ScoringItem {
  id: number;
  text: string;
}

export interface MentalAge {
  years: number;
  months: number;
}

export type IQInterpretation = "عبقري" | "ذكي جداً" | "فوق المتوسط" | "متوسط" | "أقل من المتوسط" | "على حدود الضعف العقلي" | "ضعف عقلي بسيط" | "ضعف عقلي معتدل" | "ضعف عقلي شديد" | "ضعف عقلي تام";
