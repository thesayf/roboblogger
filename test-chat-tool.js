// Test script for the new tool-based chat system
// Run with: node test-chat-tool.js

async function testChatEndpoint() {
  const testMessages = [
    "What's on my schedule today?",
    "Show me my goals",
    "How do I use the app?",
    "Hello!",
  ];
  
  console.log('🧪 Testing new tool-based chat system...\n');
  
  for (const message of testMessages) {
    console.log(`📝 Testing message: "${message}"`);
    
    try {
      const response = await fetch('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers if needed for your test environment
        },
        body: JSON.stringify({
          message,
          context: {
            userName: 'Test User',
            currentDate: new Date().toISOString().split('T')[0],
            currentTime: new Date().toTimeString().slice(0, 5),
            dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          },
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Success!');
        console.log('Response:', data.response?.substring(0, 100) + '...');
        console.log('Has data:', data.hasData);
        if (data.fullResponse?.messages) {
          console.log('Tool calls:', data.fullResponse.messages.map(m => m.type).join(', '));
        }
      } else {
        console.log('❌ Failed:', data.error);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    
    console.log('---\n');
  }
  
  console.log('🎉 Test complete!');
}

// Run the test
testChatEndpoint().catch(console.error);

console.log(`
📌 NOTE: This test assumes:
1. The app is running on localhost:3000
2. You're authenticated (you may need to add auth headers)
3. The new tool-based chat system is active

If the test fails with auth errors, you'll need to:
1. Test through the UI instead
2. Or add proper authentication headers
`);