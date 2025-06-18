export type TagDefinition = {
  id: string;
  color: string;
  selectedColor: string; // Color to use when tag is selected
  style?: React.CSSProperties; // Optional custom style
};

export class HiLiteTags {
  private tags: TagDefinition[];
  constructor(tags: TagDefinition[]) {
    if (!Array.isArray(tags)) {
      console.warn('HiLiteTags constructor expected an array of TagDefinition, received:', typeof tags);
      this.tags = [];
      return;
    }
    if (tags.length === 0) {
      console.warn('HiLiteTags initialized with an empty array of tags');
    }
    // Validate tag definitions
    const seenIds = new Set<string>();
    tags.forEach(tag => {
      if (!tag.id) {
        console.warn('Tag definition missing required "id" property:', tag);
      }
      if (!tag.color) {
        console.warn('Tag definition missing required "color" property:', tag);
      }
      if (!tag.selectedColor) {
        console.warn('Tag definition missing required "selectedColor" property:', tag);
      }
      if (seenIds.has(tag.id)) {
        console.warn(`Duplicate tag id "${tag.id}" found. Tag ids must be unique.`);
      }
      seenIds.add(tag.id);
    });
    this.tags = tags;
  }
  getById(id: string): TagDefinition {
    const tag = this.tags.find(t => t.id === id);
    if (!tag) {
      throw new Error(`Tag with id "${id}" not found`);
    }
    return tag;
  }
  getAll() {
    return this.tags;
  }
};
