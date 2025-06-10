export type TagDefinition = {
  id: string;
  color: string;
  selectedColor: string; // Color to use when tag is selected
  style?: React.CSSProperties; // Optional custom style
};

export class HiLiteTags {
  private tags: TagDefinition[];
  constructor(tags: TagDefinition[]) {
    this.tags = tags;
  }
  getById(id: string) {
    return this.tags.find(t => t.id === id);
  }
  getAll() {
    return this.tags;
  }
};

export type HiLitedTags = {
  markerId: string;
  tagId: string;
  text: string;
  beginIndex: number;
  endIndex: number;
};
