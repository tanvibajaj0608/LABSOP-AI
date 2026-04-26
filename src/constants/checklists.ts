export const REGULATORY_CHECKLISTS: Record<string, string[]> = {
  'ISO 15189': [
    'Evidence of clinical validation for the examination method',
    'Documented environmental and storage conditions monitoring',
    'Clear definition of biological reference intervals',
    'Evidence of staff technical competence records',
    'Risk management assessment for the examination process'
  ],
  'CAP (College of American Pathologists)': [
    'Validation/Verification of performance specifications',
    'Monthly supervisor review protocol for QC results',
    'Evidence of successful Proficiency Testing (PT) participation',
    'Tracking system for reagent lot-to-lot verification',
    'Instrument maintenance and troubleshooting records'
  ],
  'NABL (India)': [
    'Estimated measurement uncertainty (MU) calculation',
    'Traceability to SI units/National standards',
    'NABL 160 compliance for document control',
    'Bio-hazardous waste disposal protocols',
    'ILC/PT participation records'
  ],
  'EHR (Electronic Health Record)': [
    'System security and data integrity verification',
    'Data entry audit logging protocols',
    'Electronic signature authorization system',
    'Downtime procedure and data recovery plan'
  ],
  'Pharma (GxP/GLP)': [
    'Data archiving and long-term retention protocol',
    'Equipment calibration and maintenance history',
    'Deviation and OOS (Out of Spec) reporting system',
    'Material traceability and vendor qualification'
  ],
  'CLIA': [
    'Verification of test performance characteristics',
    'Comprehensive Quality Assessment (QA) plan',
    'Personnel standard qualifications record',
    'Proficiency testing documentation'
  ],
  'ISO 9001': [
    'Continuous improvement and corrective actions plan',
    'Customer feedback and satisfaction monitoring',
    'Internal audit schedule for QMS',
    'Documented policy for resource management'
  ]
};
