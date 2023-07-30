/* abstract */ class SessionStore {
  findSession(id: string) {}
  saveSession(id: string, session: any) {}
  findAllSessions() {}
}

class InMemorySessionStore extends SessionStore {
  sessions: Map<string, any>;

  constructor() {
    super();
    this.sessions = new Map<string, any>();
  }

  findSession(id: string) {
    return this.sessions.get(id);
  }

  saveSession(id: string, session: any) {
    this.sessions.set(id, session);
  }

  findAllSessions() {
    return [...this.sessions.values()];
  }
}

export default InMemorySessionStore;
