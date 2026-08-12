/**
 * Utility to generate a concise, editable complaint description from 
 * the AI's image analysis result.
 */
export function generateDescriptionFromVision(vision) {
  if (!vision || !vision.valid) return "";

  // If the vision result reason is long and descriptive (not just a short tag), use it.
  if (
    vision.reason &&
    vision.reason.length > 25 &&
    !vision.reason.toLowerCase().includes("this image does not appear")
  ) {
    return vision.reason;
  }

  const category = vision.category || "An issue";
  const department = vision.department ? ` and may require attention from the ${vision.department}` : "";
  const severity = vision.severity ? ` (Severity: ${vision.severity})` : "";
  
  return `${category} has been detected at the reported location${department}${severity}.`;
}
