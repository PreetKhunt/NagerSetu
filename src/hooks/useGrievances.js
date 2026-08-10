import { useContext } from "react";
import { GrievanceContext } from "../context/contexts";

/**
 * Access the shared grievance store.
 *
 * Throws rather than returning null when used outside the provider: a page
 * that silently rendered zeroes because it sat outside the tree would look
 * like working software with wrong numbers, which is the harder bug to find.
 */
export default function useGrievances() {
  const value = useContext(GrievanceContext);
  if (!value) {
    throw new Error("useGrievances must be used inside <GrievanceProvider>");
  }
  return value;
}
