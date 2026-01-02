// src/modules/collab/ot.service.ts


interface Operation {
  userId: string;
  roomId: string;
  version: number;
  diff: string; // simple diff string, e.g. using text-diff or diff-match-patch
}

export class OTService {
  // In-memory store for simple document state (roomId -> { code, version })
  private static docs = new Map<string, { code: string; version: number }>();

  static async applyOperation(op: Operation): Promise<{ code: string; version: number }> {
    const current = this.docs.get(op.roomId) || { code: "", version: 0 };

    // Reject if client version is older than current (naive conflict resolution)
    if (op.version < current.version) {
      return current;
    }

    // Naive patch application (replace with actual diff logic if needed)
    const mergedCode = op.diff;
    const newVersion = current.version + 1;

    this.docs.set(op.roomId, { code: mergedCode, version: newVersion });

    return { code: mergedCode, version: newVersion };
  }

  static async getDocument(roomId: string) {
    return this.docs.get(roomId) || { code: "", version: 0 };
  }

  static async resetDocument(roomId: string) {
    this.docs.delete(roomId);
  }
}
