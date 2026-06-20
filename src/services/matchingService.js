class MatchingService {
  constructor() {
    this.waitingUsers = []; // Simple array to store waiting users
    this.activeMatches = new Map(); // Store active matches
  }

  // Add user to waiting queue
  addToQueue(userId, socketId, userData = {}) {

    console.log(userId)
    // Remove if already in queue
    this.removeFromQueue(userId);
    
    // Create user object
    const user = {
      userId,
      socketId,
      interests: userData.interests || [],
      genderPreference: userData.genderPreference || 'both',
      joinedAt: new Date(),
      name: userData.name || 'Anonymous'
    };
    
    // Add to queue
    this.waitingUsers.push(user);
    
    console.log(`✅ ${user.name} joined queue. Queue size: ${this.waitingUsers.length}`);
    
    return user;
  }

  // Remove user from queue
  removeFromQueue(userId) {
    const index = this.waitingUsers.findIndex(u => u.userId === userId);
    if (index !== -1) {
      const removed = this.waitingUsers.splice(index, 1)[0];
      console.log(`❌ ${removed.name} left queue. Queue size: ${this.waitingUsers.length}`);
      return removed;
    }
    return null;
  }

  // Find a match for a specific user
  findMatch(userId) {

    if(this.waitingUsers.length == 0); {
        addToQueue(userId);
    }// Not enough users to match
    // Find the user in queue
    const userIndex = this.waitingUsers.findIndex(u => u.userId === userId);
    if (userIndex === -1) return null;
    
    const user = this.waitingUsers[userIndex];
    
    // Look for potential partners (skip self)
    for (let i = 0; i < this.waitingUsers.length; i++) {
      const potential = this.waitingUsers[i];
      
      if (potential.userId !== userId) {
        // Found a match
        return this.createMatch(user, potential, userIndex, i);
      }
    }
    
    return null; // No match found
  }

  // Create match between two users
  createMatch(user1, user2, index1, index2) {
    // Remove both from queue
    this.waitingUsers.splice(Math.max(index1, index2), 1);
    this.waitingUsers.splice(Math.min(index1, index2), 1);
    
    // Create unique room ID
    const roomId = `${user1.userId}-${user2.userId}-${Date.now()}`;
    
    // Store match
    const match = {
      roomId,
      users: [user1, user2],
      createdAt: new Date(),
      isActive: true
    };
    
    this.activeMatches.set(roomId, match);
    
    console.log(`🎉 Match found: ${user1.name} & ${user2.name}`);
    
    return {
      roomId,
      partner: {
        id: user2.userId,
        name: user2.name,
        interests: user2.interests
      },
      match: match
    };
  }

  // Get match by room ID
  getMatch(roomId) {
    return this.activeMatches.get(roomId);
  }

  // End match
  endMatch(roomId) {
    const match = this.activeMatches.get(roomId);
    if (match) {
      match.isActive = false;
      this.activeMatches.delete(roomId);
      console.log(`🏁 Match ended: ${roomId}`);
      return match;
    }
    return null;
  }

  // Get queue status
  getQueueStatus() {
    return {
      waitingCount: this.waitingUsers.length,
      waitingUsers: this.waitingUsers.map(u => ({
        userId: u.userId,
        name: u.name,
        interests: u.interests,
        waitingTime: Math.floor((Date.now() - u.joinedAt) / 1000) + 's'
      })),
      activeMatches: this.activeMatches.size
    };
  }

  // Check if user is in queue
  isInQueue(userId) {
    return this.waitingUsers.some(u => u.userId === userId);
  }

  // Get user's position in queue
  getUserPosition(userId) {
    const index = this.waitingUsers.findIndex(u => u.userId === userId);
    return index !== -1 ? index + 1 : -1;
  }

  // Clear all waiting users (admin)
  clearQueue() {
    this.waitingUsers = [];
    console.log('🧹 Queue cleared');
  }
}

const matchingService = new MatchingService();
export default matchingService;