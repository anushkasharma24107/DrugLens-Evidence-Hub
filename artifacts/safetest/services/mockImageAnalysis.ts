export type ImageQualityAssessment = {
  blur: 'pass' | 'review';
  brightness: 'pass' | 'review';
  glare: 'pass' | 'review';
  stripPosition: 'pass' | 'review';
  resolution: 'pass' | 'review';
  score: number;
  usable: boolean;
  explanation: string;
};

/**
 * Development-only deterministic assessor. This is deliberately isolated so
 * it can be replaced by an on-device model without changing the workflow.
 * It is not medical-grade analysis and never confirms a diagnosis.
 */
export function assessDemoImage(_uri: string): ImageQualityAssessment {
  return {
    blur: 'pass',
    brightness: 'pass',
    glare: 'pass',
    stripPosition: 'pass',
    resolution: 'pass',
    score: 94,
    usable: true,
    explanation: 'Demo assessment only. Human review remains required.',
  };
}