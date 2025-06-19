import type { TagDefinition } from "./tags";

/**
 * Represents the data structure of a highlighted text region
 */
export interface HiLiteData {
  /** Unique identifier for this specific highlight */
  markerId: string;
  /** The ID of the tag definition used for this highlight */
  tagId: string;
  /** The highlighted text content */
  text: string;
  /** The starting index of the highlight in the content */
  beginIndex: number;
  /** The ending index of the highlight in the content */
  endIndex: number;
}

/**
 * Interface for the ref object exposed by HiLiteContent
 */
export interface HiLiteRef {
  /**
   * Highlight the current selection with the given tag
   * @param tag The tag definition to apply to the selection
   * @returns The newly created tag's data that can be saved to a database
   */
  hiliteTag: (tag: TagDefinition) => HiLiteData | undefined;

  /**
   * Remove a specific highlight by marker id
   * @param markerId The ID of the marker to remove
   */
  removeTag: (markerId: string) => HiLiteData | undefined;

  /**
   * Get all highlights as an array of HiLiteData
   * @returns Array of all highlights with their data
   */
  getAllTags: () => HiLiteData[];

  /**
   * Restore highlights from a saved array of HiLiteData
   * @param tags Array of HiLiteData to restore
   */
  restoreTags: (tags: HiLiteData[]) => void;

  /**
   * Update an existing highlight with a new tag
   * @param markerId The ID of the marker to update
   * @param newTag The new tag definition to apply
   * @returns The updated tag's data that can be saved to a database
   */
  updateTag: (markerId: string, newTag: TagDefinition) => HiLiteData | undefined;
}
