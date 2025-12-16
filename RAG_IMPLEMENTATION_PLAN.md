# RAG-Based Memory System Implementation Plan

## Overview
A personalized context system that learns from user interactions to provide intelligent schedule suggestions and understand user patterns over time.

## Architecture

```
User Input → Embedding Generation → Vector Search → Context Retrieval → Enhanced AI Response
                                           ↓
                                    Vector Database
                                    (User Patterns)
```

## Data Storage Structure

### 1. Conversation Memory Entries
```javascript
{
  id: "conv_2024-01-15_14:30:00",
  userId: "user_123",
  text: "I'm feeling tired today, move my deep work to afternoon",
  embedding: [0.23, -0.45, 0.67, ...], // 1536-dim vector
  metadata: {
    timestamp: "2024-01-15T14:30:00Z",
    dayOfWeek: "Monday",
    action: "reschedule",
    entities: {
      mood: "tired",
      blockType: "deep-work",
      timePreference: "afternoon"
    },
    contextBefore: {
      scheduleLoad: "heavy", // 5+ hours of meetings
      previousNightWork: true,
      lastBreak: "2 hours ago"
    },
    outcome: {
      userSatisfied: true,
      patternStrength: 0.7
    }
  }
}
```

### 2. Learned Patterns
```javascript
{
  id: "pattern_tired_afternoon_deepwork",
  userId: "user_123",
  patternText: "When user is tired, they prefer deep work in afternoon",
  embedding: [0.34, -0.22, ...],
  metadata: {
    type: "scheduling_preference",
    trigger: {
      conditions: ["mood:tired", "dayPart:morning"],
      confidence: 0.85
    },
    action: {
      suggestion: "move_deepwork_afternoon",
      parameters: {
        targetTime: "14:00-17:00",
        breakBefore: true
      }
    },
    occurrences: 12,
    lastSeen: "2024-01-15",
    createdAt: "2024-01-01",
    strengthHistory: [0.3, 0.5, 0.7, 0.85] // grows with repetition
  }
}
```

### 3. User Shortcuts/Aliases
```javascript
{
  id: "alias_standup",
  userId: "user_123",
  text: "standup means daily team standup meeting at 10am for 15 minutes",
  embedding: [0.12, 0.89, ...],
  metadata: {
    type: "alias",
    trigger: "standup",
    expansion: {
      title: "Daily Standup",
      type: "meeting",
      time: "10:00",
      duration: 15,
      recurring: "weekdays"
    },
    usageCount: 45,
    lastUsed: "2024-01-15"
  }
}
```

### 4. User Profile Context
```javascript
{
  id: "profile_user_123",
  userId: "user_123",
  text: "User is a software engineer who prefers morning deep work, takes regular breaks, and has energy dips after lunch",
  embedding: [0.56, 0.23, ...],
  metadata: {
    type: "user_profile",
    workStyle: {
      preferredDeepWork: "09:00-11:00",
      breakFrequency: "every 90 minutes",
      breakDuration: 15,
      lunchTime: "12:00",
      energyPattern: {
        morning: "high",
        earlyAfternoon: "low",
        lateAfternoon: "medium",
        evening: "variable"
      }
    },
    goals: [
      "Focus on career growth",
      "Maintain work-life balance",
      "Learn new technologies"
    ],
    projects: [
      {
        name: "Main Product Feature",
        priority: "high",
        preferredTime: "morning"
      }
    ],
    updateFrequency: "weekly"
  }
}
```

## When Context is Retrieved

### 1. **On Chat Message Input**
```javascript
// User types: "I need to focus today"

// System performs:
1. Generate embedding for "I need to focus today"
2. Search for similar vectors:
   - Past "focus" conversations
   - Deep work patterns
   - Successful focus day schedules
3. Retrieve top 5 relevant contexts
4. Include in AI prompt:
   "Context: User typically focuses best 9-11am, prefers 2-hour blocks, 
    last successful focus session was Monday with no meetings before noon"
```

### 2. **On Schedule View Load**
```javascript
// Morning app open

// System checks:
1. Day of week patterns
2. Previous night's activity
3. Upcoming deadlines from past conversations
4. Energy patterns for this time

// Proactive suggestion:
"Good morning! Based on your Monday patterns and that project deadline 
you mentioned, I've suggested a deep work block from 9-11am"
```

### 3. **On Block Creation/Modification**
```javascript
// User adds "Meeting with team"

// System retrieves:
1. Similar meeting patterns
2. Typical meeting durations
3. Post-meeting preferences (needs break?)
4. Energy impacts of meetings

// AI enhances with context:
"Adding 1-hour team meeting. Should I add your usual 15-min break after?"
```

### 4. **Pattern Recognition Triggers**
```javascript
// Continuous monitoring for:
- Repeated actions (3+ times) → Create pattern
- Time-based triggers → Check relevant patterns
- Mood/energy mentions → Retrieve similar states
- Project/goal mentions → Pull related contexts
```

## Pattern Strengthening Algorithm

```javascript
function updatePatternStrength(pattern, newOccurrence) {
  const {
    wasSuccessful,
    timeSinceLastSeen,
    similarity
  } = newOccurrence;
  
  // Base reinforcement
  let strengthDelta = wasSuccessful ? 0.1 : -0.05;
  
  // Decay for old patterns
  const weeksSinceLastSeen = timeSinceLastSeen / (7 * 24 * 60 * 60 * 1000);
  const decayFactor = Math.pow(0.95, weeksSinceLastSeen);
  
  // Similarity boost (how close to original pattern)
  strengthDelta *= similarity; // 0.0 to 1.0
  
  // Update pattern
  pattern.strength = Math.min(1.0, Math.max(0.0, 
    pattern.strength * decayFactor + strengthDelta
  ));
  
  // Pattern activation threshold
  if (pattern.strength > 0.7) {
    pattern.status = 'active';
    pattern.autoSuggest = true;
  } else if (pattern.strength < 0.3) {
    pattern.status = 'inactive';
    pattern.autoSuggest = false;
  }
  
  return pattern;
}
```

## Implementation Phases

### Phase 1: Basic Memory (Week 1)
- Store conversations with embeddings
- Simple retrieval on chat input
- Manual pattern creation

### Phase 2: Pattern Learning (Week 2)
- Automatic pattern detection
- Confidence scoring
- Basic shortcuts/aliases

### Phase 3: Proactive Assistance (Week 3)
- Context-aware suggestions
- Time-based triggers
- Energy/mood awareness

### Phase 4: Advanced Personalization (Week 4)
- Multi-factor pattern matching
- Goal-oriented scheduling
- Predictive adjustments

## Privacy & Data Management

### User Controls
```javascript
{
  memorySettings: {
    enabled: true,
    retentionDays: 90,
    storeLocation: "local", // or "cloud"
    sensitiveDataHandling: "exclude", // or "encrypt"
    patternLearning: true,
    proactiveSuggestions: true
  }
}
```

### Data Lifecycle
1. **Creation**: Embedding generated, metadata extracted
2. **Storage**: Encrypted at rest, indexed by user
3. **Retrieval**: Similarity search with user filter
4. **Update**: Pattern strength adjusted, metadata enriched
5. **Expiry**: Auto-delete after retention period
6. **Export**: User can download all their data
7. **Deletion**: Complete removal on request

## Example User Journey

### Day 1 (Monday)
```
User: "I'm exhausted from the weekend hackathon"
AI: "I'll note that. Would you like me to adjust today's schedule for lower energy?"
[STORES: Monday + exhausted + weekend work]
```

### Day 8 (Monday)
```
User: "Tired again, worked all Sunday"
AI: "I notice this is the second Monday you're tired after weekend work. 
    Should I regularly suggest lighter Monday mornings?"
[PATTERN DETECTED: Monday after weekend work = tired]
```

### Day 15 (Monday)
```
App opens, detects it's Monday
AI: "Good morning! I see you worked yesterday. Based on your pattern,
    I've drafted a lighter morning schedule with deep work after 2pm. 
    Should I apply it?"
[PATTERN ACTIVATED: Automatically recognized and suggested]
```

### Day 30 (Pattern Evolution)
```
User: "Actually, I'm feeling energetic despite working yesterday"
AI: "Got it! I'll adjust my understanding. Seems weekend work doesn't 
    always mean tired Mondays for you."
[PATTERN WEAKENED: Confidence reduced from 0.85 to 0.70]
```

## Technical Stack

### Required Dependencies
```json
{
  "chromadb": "^1.5.0",          // Vector database
  "openai": "^4.0.0",            // Embeddings
  "node-cron": "^3.0.0",         // Scheduled pattern analysis
  "natural": "^6.0.0",           // NLP for entity extraction
  "mongodb": "existing",          // Pattern storage
  "redis": "^4.0.0"              // Fast context cache (optional)
}
```

### API Endpoints
```typescript
POST /api/memory/store
  - Store new conversation with embedding

GET /api/memory/retrieve
  - Get relevant context for query

POST /api/memory/patterns/detect
  - Analyze conversations for patterns

PUT /api/memory/patterns/:id/strengthen
  - Update pattern confidence

GET /api/memory/suggestions
  - Get proactive suggestions based on context

DELETE /api/memory/user/:userId
  - Complete data deletion
```

## Success Metrics

1. **Pattern Accuracy**: % of accepted vs rejected suggestions
2. **Context Relevance**: User feedback on suggestion quality
3. **Time Saved**: Reduction in manual schedule adjustments
4. **User Satisfaction**: "Did this suggestion help?" responses
5. **Pattern Growth**: Number of learned patterns over time
6. **Engagement**: Usage of shortcuts/aliases

## Fallback & Error Handling

```javascript
// If embedding service fails
if (!embeddingAvailable) {
  fallbackToKeywordSearch(text);
}

// If pattern confidence too low
if (pattern.strength < 0.5) {
  askUserForConfirmation();
}

// If conflicting patterns
if (patterns.conflict()) {
  presentOptionsToUser();
}

// Privacy mode
if (user.privacyMode) {
  useSessionOnlyMemory();
}
```

## Future Enhancements

1. **Cross-user Pattern Learning** (anonymized)
   - "Users like you typically..."
   
2. **External Calendar Integration**
   - Learn from existing calendar patterns
   
3. **Biometric Integration**
   - Sleep data, energy levels from wearables
   
4. **Team Patterns**
   - Shared organizational rhythms
   
5. **Seasonal Adjustments**
   - Winter vs summer energy patterns

## Testing Strategy

1. **Unit Tests**: Pattern matching algorithms
2. **Integration Tests**: Embedding → Storage → Retrieval
3. **User Studies**: A/B test with/without memory
4. **Privacy Audit**: Data handling compliance
5. **Performance Tests**: Vector search at scale