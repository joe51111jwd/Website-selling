export type SizeBucket = "1–5" | "6–20" | "21–50" | "51–100" | "100+";

export const SIZES: SizeBucket[] = ["1–5", "6–20", "21–50", "51–100", "100+"];

export type CalcResult = { crew: number; minutes: number; rate: number; days: number; annual: number };

export type SignupRequest = {
  intent: "trial" | "demo";
  source: string;
  size?: SizeBucket;
  calc?: CalcResult;
};

export type OpenSignup = (r: SignupRequest) => void;

/** Copy tokens (PLAYBOOK "Tokens"). Each ⚑: Andrew confirms before launch. */
export const T = {
  PROGRAM: "Founding Member trial",
  SIZE: "5–100",
  /** call length in minutes; must equal the Cal.com event */
  N: 30,
  EMAIL: "hello@smartcrewhq.com",
} as const;
