export type TagDefinition = {
  id: string;
  name: string;
  color: string;
  style?: React.CSSProperties; // Optional custom style
};

export class HiLiteTags {
  private tags: TagDefinition[];
  constructor(tags: TagDefinition[]) {
    this.tags = tags;
  }
  getByName(name: string) {
    return this.tags.find(t => t.name === name);
  }
  getById(id: string) {
    return this.tags.find(t => t.id === id);
  }
  getAll() {
    return this.tags;
  }
}
