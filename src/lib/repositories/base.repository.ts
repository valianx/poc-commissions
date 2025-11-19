export class BaseRepository<T extends { id: string }> {
  constructor(private storageKey: string) {}

  private isBrowser(): boolean {
    return typeof window !== "undefined";
  }

  getAll(): T[] {
    if (!this.isBrowser()) return [];
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  getById(id: string): T | null {
    const items = this.getAll();
    return items.find((item) => item.id === id) || null;
  }

  create(item: T): T {
    if (!this.isBrowser()) return item;
    const items = this.getAll();
    items.push(item);
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    return item;
  }

  update(id: string, updates: Partial<T>): T | null {
    if (!this.isBrowser()) return null;
    const items = this.getAll();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;

    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    } as T;
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    return items[index];
  }

  delete(id: string): boolean {
    if (!this.isBrowser()) return false;
    const items = this.getAll();
    const filtered = items.filter((item) => item.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    return filtered.length < items.length;
  }

  softDelete(id: string): T | null {
    return this.update(id, { deletedAt: new Date().toISOString() } as Partial<T>);
  }

  findBy(predicate: (item: T) => boolean): T[] {
    return this.getAll().filter(predicate);
  }

  findOne(predicate: (item: T) => boolean): T | null {
    return this.getAll().find(predicate) || null;
  }

  clear(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(this.storageKey);
  }
}
